import { existsSync } from "fs";

var exec = require('child_process').exec;
const { readFileSync, writeFileSync } = require('fs');

const prefixOptions = ['PATCH', 'MINOR', 'MAJOR'];
const postfixMinLength = 8;

export async function commitMsg(commitMessagePath: string) {
    const versionJsonPath = './version.json';

    // read commit message
    const rawMessage = readFileSync(commitMessagePath, 'utf-8');
    let message = rawMessage.split(/\r?\n/)[0];

    // check if commit is first on the branch
    let currentBranch = '';
    await new Promise<void>(resolve => {
        exec('git branch --show-current', (_error: string, stdout: string) => {
            currentBranch = stdout.trim();

            exec(`git rev-list --count origin..${currentBranch}`, (_error: string, stdout: string) => {
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
        if (currentBranch.match(/^(feature|refactor)\/.+/g)) {
            messageParts.unshift('MINOR');
        } else if (currentBranch.match(/^(bug|fix|improvement)\/.+/g)) {
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
    if (messagePostfix.trim().length < postfixMinLength) {
        throwError(`Commit message postfix must be at least ${postfixMinLength} characters.`);
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
    const versionJsonPath = 'version.json';

    exec('git diff --name-only', (_error: string, stdout: string) => {
        const modifiedFiles = stdout.trim().split(/\r?\n/);

        // check if version.json has been modified by commit-msg hook
        if (modifiedFiles.includes(versionJsonPath)) {
            exec('git rev-parse --short HEAD', (_error: string, stdout: string) => {
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