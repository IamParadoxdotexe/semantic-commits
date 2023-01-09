import * as finder from 'find-package-json';

export const packageJson = finder().next();

export const packagePath = packageJson.filename.split('/').slice(0, -1).join('/');

export interface Config {
    majorPrefix: string;
    minorPrefix: string;
    patchPrefix: string;
    minPostfixLength: number;
    versionFilePath: string;
    majorBranchPrefixes: string[];
    minorBranchPrefixes: string[];
    patchBranchPrefixes: string[];
    head: string;
    updatePackageVersion: boolean;
    indent: number;
}

// merge package.json configuration with default config
const defaultConfig: Config = {
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

export function getConfig(configOverrides?: Partial<Config>): Config {
    return {
        ...defaultConfig,
        ...(configOverrides || packageJson.value["semanticCommits"])
    }
}

export function throwError(message: string, exit=true) {
    if (exit) {
        console.error(`semantic-commits - ${ message }`);
        process.exit(1);
    } else {
        throw new Error(`semantic-commits - ${ message }`)
    }
}

export function consoleLog(message: string) {
    console.log(`semantic-commits - ${message}`)
}

export * from './install';
export * from './commit-msg';
export * from './post-commit';