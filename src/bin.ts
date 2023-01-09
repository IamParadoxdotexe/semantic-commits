#!/usr/bin/env node
import path = require('path')
import { defaultCommitMessagePath, install, commitMsg, postCommit, getConfig } from './'

// Show usage and exit with code
function help(code: number) {
  console.log(`Usage:
  semantic-commits install
  semantic-commits config
  semantic-commits commit-msg [commit message path] (default: ${defaultCommitMessagePath})
  semantic-commits post-commit`)
  process.exit(code)
}

// Get CLI arguments
const [, , cmd, ...args] = process.argv

// CLI commands
const cmds: { [key: string]: () => void | Promise<void> } = {
    'install': install,
    'config': () => console.log(getConfig()),
    'commit-msg': () => commitMsg(args[0]),
    'post-commit': postCommit,
    ['-v']: () =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-var-requires
        console.log(require(path.join(__dirname, '../package.json')).version),
}

// Run CLI
try {
  // Run command or show usage for unknown command
  cmds[cmd] ? cmds[cmd]() : help(0)
} catch (e) {
  console.error(e instanceof Error ? `semantic-commits - ${e.message}` : e)
  process.exit(1)
}