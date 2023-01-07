import { existsSync, readFileSync, writeFileSync } from "fs";
import { exec, ExecException } from 'child_process';
import * as finder from 'find-package-json';

// merge package.json configuration with default config
const packageJson = finder().next().value;
export const config = {
    "majorPrefix": "MAJOR",
    "minorPrefix": "MINOR",
    "patchPrefix": "PATCH",
    "minPostfixLength": 8,
    "versionFilePath": 'version.json',
    "majorBranchPrefixes": ['release/'],
    "minorBranchPrefixes": ['feature/', 'refactor/'],
    "patchBranchPrefixes": ['bug/', 'fix/', 'improvement/'],
    ...packageJson["semanticCommits"]
}

const prefixOptions = [config.patchPrefix, config.minorPrefix, config.majorPrefix];
const minPostfixLength = config.minPostfixLength;

export async function commitMsg(commitMessagePath: string) {
    const versionJsonPath = `./${config.versionFilePath}`;

    // read commit message
    const rawMessage = readFileSync(commitMessagePath, 'utf-8');
    let message = rawMessage.split(/\r?\n/)[0];

    // check if commit is first on the branch
    let currentBranch = '';
    await new Promise<void>(resolve => {
        exec('git branch --show-current', (_error: ExecException, stdout: string) => {
            currentBranch = stdout.trim();

            exec(`git rev-list --count origin..${currentBranch}`, (_error: ExecException, stdout: string) => {
                const commits = parseInt(stdout);
                // only the first commit of a branch should be version marked
                if (commits > 0) {
                    console.log(`Branch already has ${commits} commit${commits > 1 ? 's' : ''}. Skipping version update...`)
                    process.exit();
                }
                resolve();
            });
        });
    });

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
            messageParts.unshift('MAJOR');
        } else if (testPrefixes(config.minorBranchPrefixes)) {
            messageParts.unshift('MINOR');
        } else if (testPrefixes(config.patchBranchPrefixes)) {
            messageParts.unshift('PATCH');
        } else {
            throwError(`First commit message should take the form "{${prefixOptions.join('|')}}: {message}".`);
        }

        // update commit message if it was auto-prefixed
        message = messageParts.join(': ');
        writeFileSync(commitMessagePath, message);
    }

    // check for valid prefix
    const messagePrefix = messageParts[0];
    if (!prefixOptions.includes(messagePrefix)) {
        throwError(
            `Commit message prefix must be one of the following version types: [${prefixOptions.join(', ')}].`
        );
    }

    // check for valid postfix
    const messagePostfix = messageParts[1];
    if (messagePostfix.trim().length < minPostfixLength) {
        throwError(`Commit message postfix must be at least ${minPostfixLength} characters.`);
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

    if (messagePrefix == 'MAJOR') {
        versionParts[0]++;
        versionParts[1] = 0;
        versionParts[2] = 0;
    } else if (messagePrefix == 'MINOR') {
        versionParts[1]++;
        versionParts[2] = 0;
    } else {
        versionParts[2]++;
    }

    const newVersion = versionParts.join('.');
    versionJson.version = newVersion;

    console.log(`Updating version from ${oldVersion} to ${newVersion}...`);
    writeFileSync(versionJsonPath, JSON.stringify(versionJson, null, 4) + '\n');
}

export function postCommit() {
    const versionJsonPath = config.versionFilePath;

    exec('git diff --name-only', (_error: ExecException, stdout: string) => {
        const modifiedFiles = stdout.trim().split(/\r?\n/);

        // check if version.json has been modified by commit-msg hook
        if (modifiedFiles.includes(versionJsonPath)) {
            exec('git rev-parse --short HEAD', (_error: ExecException, stdout: string) => {
                const hash = stdout.trim();

                // add commit hash to version.json
                const versionJson = JSON.parse(readFileSync(`./${versionJsonPath}`, 'utf-8'));
                versionJson.versionCommitHash = hash;
                writeFileSync(`./${versionJsonPath}`, JSON.stringify(versionJson, null, 4) + '\n');

                // amend the last commit to include the updated version.json
                exec(`git commit --amend -C HEAD -n ${versionJsonPath}`);
            });
        }
    });
}

function throwError(message: string) {
    console.error(`semantic-commits - ${ message }`);
    process.exit(1);
}