import { readFileSync, writeFileSync } from "fs";
import { exec, ExecException } from 'child_process';
import * as path from 'path';
import { getConfig, packageJson, packagePath } from '.';

export function postCommit() {
    const config = getConfig();

    const versionJsonPath = path.join(packagePath, config.versionFilePath);

    exec('git diff --name-only', (_error: ExecException, stdout: string) => {
        const modifiedFiles = stdout.trim().split(/\r?\n/);

        // check if version.json has been modified by commit-msg hook
        if (modifiedFiles.includes(getConfig().versionFilePath)) {
            exec('git rev-parse --short HEAD', (_error: ExecException, stdout: string) => {
                const hash = stdout.trim();

                // add commit hash to version.json
                const versionJson = JSON.parse(readFileSync(versionJsonPath, 'utf-8'));
                versionJson.versionCommitHash = hash;
                writeFileSync(versionJsonPath, JSON.stringify(versionJson, null, config.indent) + '\n');

                // amend the last commit to include the updated version.json
                const files = [versionJsonPath];

                // if enabled, ammend last commit to include updated package.json
                if (config.updatePackageVersion) {
                    files.push(packageJson.filename);
                }

                exec(`git commit --amend -C HEAD -n ${files.join(' ')}`);
            });
        }
    });
}