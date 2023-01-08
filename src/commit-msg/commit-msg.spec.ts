import { readFileSync, unlinkSync, writeFileSync } from 'fs';
import * as assert from 'assert'; 
import { commitMsg } from './commit-msg';

const commitMessagePath = 'src/commit-msg/test-message';
const versionFilePath = 'src/commit-msg/version.json';

describe('semantic-commits commit-msg', () => {
    beforeEach(() => {
        writeFileSync(versionFilePath, JSON.stringify({
            version: '1.1.1',
            gitCommitHash: ''
        }))
    })

    it('should update PATCH version via commit message', async () => {
        writeFileSync(commitMessagePath, 'PATCH: Commit message')
        await testCommitMsg();

        const versionFile = JSON.parse(readFileSync(versionFilePath, 'utf-8'));
        assert.equal(versionFile.version, '1.1.2', 'PATCH version is incremented')
    });

    it('should update MINOR version via commit message', async () => {
        writeFileSync(commitMessagePath, 'MINOR: Commit message')
        await testCommitMsg();

        const versionFile = JSON.parse(readFileSync(versionFilePath, 'utf-8'));
        assert.equal(versionFile.version, '1.2.0', 'MINOR version is incremented')
    }); 

    it('should update MAJOR version via commit message', async () => {
        writeFileSync(commitMessagePath, 'MAJOR: Commit message')
        await testCommitMsg();

        const versionFile = JSON.parse(readFileSync(versionFilePath, 'utf-8'));
        assert.equal(versionFile.version, '2.0.0', 'MAJOR version is incremented')
    }); 

    it('should update PATCH version via branch name', async () => {
        writeFileSync(commitMessagePath, 'Commit message')
        await testCommitMsg('bug/foo-bar');

        const versionFile = JSON.parse(readFileSync(versionFilePath, 'utf-8'));
        assert.equal(versionFile.version, '1.1.2', 'PATCH version is incremented')
    });

    it('should update MINOR version via branch name', async () => {
        writeFileSync(commitMessagePath, 'Commit message')
        await testCommitMsg('feature/foo-bar');

        const versionFile = JSON.parse(readFileSync(versionFilePath, 'utf-8'));
        assert.equal(versionFile.version, '1.2.0', 'MINOR version is incremented')
    });

    it('should update MAJOR version via branch name', async () => {
        writeFileSync(commitMessagePath, 'Commit message')
        await testCommitMsg('release/foo-bar');

        const versionFile = JSON.parse(readFileSync(versionFilePath, 'utf-8'));
        assert.equal(versionFile.version, '2.0.0', 'MAJOR version is incremented')
    });

    it('should not update without prefix context', async () => {
        writeFileSync(commitMessagePath, 'Commit message')

        await assert.rejects(testCommitMsg('foo-bar'), 'throws error')

        const versionFile = JSON.parse(readFileSync(versionFilePath, 'utf-8'));
        assert.equal(versionFile.version, '1.1.1', 'version stays the same')
    });

    it('should not update with invalid prefix', async () => {
        writeFileSync(commitMessagePath, 'PREFIX: Commit message')

        await assert.rejects(testCommitMsg('foo-bar'), 'throws error')

        const versionFile = JSON.parse(readFileSync(versionFilePath, 'utf-8'));
        assert.equal(versionFile.version, '1.1.1', 'version stays the same')
    });

    it('should not update when postfix is too short', async () => {
        writeFileSync(commitMessagePath, 'PATCH: Commit')

        assert.rejects(testCommitMsg, 'throws error')

        const versionFile = JSON.parse(readFileSync(versionFilePath, 'utf-8'));
        assert.equal(versionFile.version, '1.1.1', 'version stays the same')
    });

    after(() => {
        unlinkSync(versionFilePath)
        unlinkSync(commitMessagePath)
    })
});

async function testCommitMsg(currentBranchOverride = 'origin/HEAD') {
    await commitMsg(commitMessagePath, { versionFilePath, updatePackageVersion: false }, currentBranchOverride, false);
}