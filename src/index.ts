import * as finder from 'find-package-json';

export const packageJson = finder().next();
export const packagePath = packageJson.filename.split('/').slice(0, -1).join('/');

// merge package.json configuration with default config
export const config = {
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
    ...packageJson.value["semanticCommits"]
}

export function throwError(message: string) {
    console.error(`semantic-commits - ${ message }`);
    process.exit(1);
}

export * from './install';
export * from './commit-msg';
export * from './post-commit';