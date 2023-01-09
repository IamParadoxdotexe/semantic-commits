import { chmodSync, existsSync, readFileSync, writeFileSync } from "fs";
import { exec, ExecException } from "child_process";
import * as path from 'path';
import { consoleLog, packagePath, throwError } from "..";

const hooks = [
    ['commit-msg', 'npx semantic-commits commit-msg $1'],
    ['post-commit', 'npx semantic-commits post-commit']
]

const hookComment = '# Installed by semantic-commits.';
export const hookShebang = `#!/bin/sh`

export async function install(hooksPathOverride?: string) {
    // get path for git hooks; usually is .git/hooks, but could be custom like .husky
    await new Promise<void>(resolve => 
        exec('git config core.hooksPath', { cwd: packagePath }, (_error: ExecException, stdout: string) => {
            stdout = stdout || '.git/hooks'

            const hooksPath = hooksPathOverride || path.join(packagePath, stdout.trim());

            // attempt to install all required hooks
            for (const [hookName, hookScript] of hooks) {
                const hookPath = path.join(hooksPath, hookName);

                if (existsSync(hookPath)) {
                    // check if hook is already installed
                    const currentHook = readFileSync(hookPath, 'utf-8');
                    const currentHookLines = currentHook.split('\n');

                    const currentHookShebang = currentHookLines[0];
                    if (!currentHookShebang.startsWith('#!') || !currentHookShebang.endsWith('sh')) {
                        throwError(`An existing ${hookName} hook exists at ${hookPath} with unexpected shebang "${currentHookShebang}". You must install semantic-commits manually.`)
                    }

                    let installed = false;
                    for (let i = 1; i < currentHookLines.length; i++) {
                        if (currentHookLines[i] == hookScript) {
                            // hook is already installed
                            installed = true;
                            break;
                        }
                    }

                    // install hook along-side current hook
                    if (!installed) {
                        writeFileSync(hookPath, `${currentHook}\n\n${hookComment}\n${hookScript}`);
                    }
                } else {
                    // install new hook
                    writeFileSync(hookPath, `${hookShebang}\n\n${hookComment}\n${hookScript}`);
                    chmodSync(hookPath, 0o775); // make executable
                }
            }
            
            consoleLog('All hooks installed.')
            resolve();
        })
    );
}