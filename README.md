# semantic-commits

`semantic-commits` makes it easy to add semantic versioning to any system based only on commits messages. Version is tracked in a standalone `version.json` file, as well as directly in `package.json`.

Examples:
- You commit *PATCH: Fixed bug* — `0.0.0` will update to `0.0.1`.
- You commit *MINOR: Added feature* — `0.0.1` will update to `0.1.0`.
- You commit *MAJOR: Updated API* — `0.1.0` will update to `1.0.0`.

To make it even easier, commit messages will be prefixed automatically (if needed) based on branch names.

Examples:
- You commit *Fixed thing* to `bug/foo` — `0.0.0` will update to `0.0.1`.
- You commit *Added new thing* to `feature/bar` — `0.0.1` will update to `0.1.0`.
- You commit *Updated thing* to `release/foo-bar` — `0.1.0` will update to `1.0.0`.

The system version is only updated on the first commit of a branch, resulting in each pull request representing exactly one version update. To track versioning conflicts, commit hash is recorded to differentiate branches.

```
// version.json

{
  "version": "0.0.1",
  "versionCommitHash": "82df369"
}
```

# Install

```
npm install semantic-commits -D
```

# Usage
Update `package.json > "scripts" > "prepare"` and run it once. This will install Git hooks for yourself and any other developers that run `npm install`.
```
npm pkg set scripts.prepare="semantic-commits install"
npm run prepare
```

If you use either the `commit-msg` or `post-commit` hook in other ways, the required scripts for `semantic-commits` will be appended to the end of the current hook files. Although, if your current hooks do not use an `sh` shell (ex. `#!/bin/sh`), installation will fail.

## Custom Usage

For custom Git hook implementations, the `semantic-commits commit-msg` and `semantic-commits post-commit` commands are available for invocation.

# Configuration

Custom configuration can be added in your `package.json` file under `semanticCommits`, like so:

> Values shown below are configuration defaults.

```
{
    "name": "your-package",
    ...
    "semanticCommits": {
        "majorPrefix": "MAJOR",
        "minorPrefix": "MINOR",
        "patchPrefix": "PATCH",
        "minPostfixLength": 8,
        "versionFilePath": 'version.json',
        "majorBranchPrefixes": ['release/'],
        "minorBranchPrefixes": ['feature/', 'refactor/'],
        "patchBranchPrefixes": ['bug/', 'fix/', 'improvement/'],
        "head": "origin/HEAD",
        "updatePackageVersion": true,
        "indent": 2,
    }
}
```

## Options:
- `majorPrefix` - Commit message prefix used to increment the MAJOR version.
- `minorPrefix` - Commit message prefix used to increment the MINOR version.
- `patchPrefix` - Commit message prefix used to increment the PATCH version.
- `minPostfixLength` - Minimum number of characters required in the commit message after the prefix.
- `versionFilePath` - Path to store core version information.
- `majorBranchPrefixes` - Branch prefixes to assume are MAJOR releases when a commit message prefix is missing.
- `minorBranchPrefixes` - Branch prefixes to assume are MINOR releases when a commit message prefix is missing.
- `patchBranchPrefixes` - Branch prefixes to assume are PATCH releases when a commit message prefix is missing.
- `head` - HEAD branch to compare against for determining whether the current commit is the first on the branch.
- `updatePackageVersion`: Whether to update `package.json > "version"`.
- `indent`: Level of identation used when writing version files.
