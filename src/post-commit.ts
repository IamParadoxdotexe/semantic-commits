var exec = require('child_process').exec;
const { readFileSync, writeFileSync } = require('fs');

const versionJsonPath = 'version.json';

(() => {
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
})();