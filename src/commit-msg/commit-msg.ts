import { existsSync, readFileSync, writeFileSync } from "fs";
import { execSync } from 'child_process';
import * as path from 'path';
import { Config, getConfig, packageJson, throwError, packagePath, consoleLog } from '..';

export const defaultCommitMessagePath = '.git/COMMIT_EDITMSG';

export async function commitMsg(commitMessagePath=defaultCommitMessagePath, configOverrides?: Partial<Config>, currentBranchOverride?: string, exit=true) {
    const config = configOverrides ? getConfig(configOverrides) : getConfig();

    const prefixOptions = [config.patchPrefix, config.minorPrefix, config.majorPrefix];
    const versionJsonPath = path.join(packagePath, config.versionFilePath);

    // read commit message
    const rawMessage = readFileSync(commitMessagePath, 'utf-8');
    let message = rawMessage.split(/\r?\n/)[0];

    // check if commit is first on the branch
    const headBranch = execSync("git remote show origin | sed -n '/HEAD branch/s/.*: //p'").toString().trim();
    const currentBranch = currentBranchOverride || execSync('git branch --show-current').toString().trim();

    const commitCount = parseInt(execSync(`git rev-list --count origin/${headBranch}..${currentBranch}`).toString().trim());
    if (commitCount > 0) {
        consoleLog(`Branch already has ${commitCount} commit${commitCount > 1 ? 's' : ''}. Skipping version update...`)
        process.exit();
    }

    // check for merge commit
    if (message.startsWith('Merge branch')) {
        process.exit();
    }

    // check for core composition
    const messageParts = message.split(': ');
    if (messageParts.length != 2) {
        const testPrefixes = (prefixes: string[]) => 
            prefixes.length && (new RegExp(`^(${prefixes.join('|')}).+$`)).test(currentBranch);

        if (testPrefixes(config.majorBranchPrefixes)) {
            messageParts.unshift(config.majorPrefix);
        } else if (testPrefixes(config.minorBranchPrefixes)) {
            messageParts.unshift(config.minorPrefix);
        } else if (testPrefixes(config.patchBranchPrefixes)) {
            messageParts.unshift(config.patchPrefix);
        } else {
            throwError(`First commit message should take the form "{${prefixOptions.join('|')}}: {message}".`, exit);
        }

        // update commit message if it was auto-prefixed
        message = messageParts.join(': ');
        writeFileSync(commitMessagePath, message);
    }

    // check for valid prefix
    const messagePrefix = messageParts[0];
    if (!prefixOptions.includes(messagePrefix)) {
        throwError(
            `Commit message prefix must be one of the following version types: [${prefixOptions.join(', ')}].`, exit
        );
    }

    // check for valid postfix
    const messagePostfix = messageParts[1];
    if (messagePostfix.trim().length < config.minPostfixLength) {
        throwError(`Commit message postfix must be at least ${config.minPostfixLength} characters.`, exit);
    }

    // ensure version file exists
    if (!existsSync(versionJsonPath)) {
        const defaultVervsionJson = { version: '0.0.0', versionCommitHash: '' }
        writeFileSync(versionJsonPath, JSON.stringify(defaultVervsionJson, null, 4) + '\n');
    }

    // update app version
    const versionJson = JSON.parse(readFileSync(versionJsonPath, 'utf-8'));
    const oldVersion: string = versionJson.version;
    const versionParts = oldVersion.split('.').map(v => parseInt(v, 10));

    if (messagePrefix == config.majorPrefix) {
        versionParts[0]++;
        versionParts[1] = 0;
        versionParts[2] = 0;
    } else if (messagePrefix == config.minorPrefix) {
        versionParts[1]++;
        versionParts[2] = 0;
    } else {
        versionParts[2]++;
    }

    const newVersion = versionParts.join('.');
    versionJson.version = newVersion;

    consoleLog(`Updating version from ${oldVersion} to ${newVersion}...`);

    // update main version file
    writeFileSync(versionJsonPath, JSON.stringify(versionJson, null, config.indent) + '\n');

    // if enabled, update package.json
    if (config.updatePackageVersion) {
        packageJson.value.version = newVersion;
        delete packageJson.value.__path;
        writeFileSync(packageJson.filename, JSON.stringify(packageJson.value, null, config.indent) + '\n');

        // update package-lock.json
        await new Promise<void>(resolve => {
            execSync('npm i --package-lock-only')
        })
    }
}
