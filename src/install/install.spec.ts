import { mkdir, readdirSync, readFileSync, rmdirSync, unlinkSync, writeFileSync } from 'fs';
import * as path from 'path';
import * as assert from 'assert';
import { hookShebang, install } from './install';

const hooksPath = 'src/install/test-hooks';

describe('semantic-commits install', () => {
    before(() => {
        mkdir(hooksPath, () => {})
    })

    afterEach(() => {
        const files = readdirSync(hooksPath);

        for (const file of files)  {
            unlinkSync(path.join(hooksPath, file));
        }
    });

    it('should create new commit-msg hook', async () => {
        await install(hooksPath);

        const hook = readFileSync(path.join(hooksPath, 'commit-msg'), 'utf-8');
        const hookLines = hook.split('\n');
        
        assert.equal(hookLines[0], hookShebang, 'hook has correct shebang')
        assert.equal(hookLines.slice(-1)[0], 'semantic-commits commit-msg $1', 'hook has correct script')
    }); 

    it('should create new post-commit hook', async () => {
        await install(hooksPath);

        const hook = readFileSync(path.join(hooksPath, 'post-commit'), 'utf-8');
        const hookLines = hook.split('\n');
        
        assert.equal(hookLines[0], hookShebang, 'hook has correct shebang')
        assert.equal(hookLines.slice(-1)[0], 'semantic-commits post-commit', 'hook has correct script')
    }); 

    it('should update existing commit-msg hook', async () => {
        writeFileSync(path.join(hooksPath, 'commit-msg'), `${hookShebang}\nls`)

        await install(hooksPath);

        const hook = readFileSync(path.join(hooksPath, 'commit-msg'), 'utf-8');
        const hookLines = hook.split('\n');
        
        assert.equal(hookLines[0], hookShebang, 'hook has correct shebang')
        assert.equal(hookLines[1], 'ls', 'hook keeps existing script')
        assert.equal(hookLines.slice(-1)[0], 'semantic-commits commit-msg $1', 'hook has correct script')
    }); 

    it('should update existing post-commit hook', async () => {
        writeFileSync(path.join(hooksPath, 'post-commit'), `${hookShebang}\nls`)

        await install(hooksPath);

        const hook = readFileSync(path.join(hooksPath, 'post-commit'), 'utf-8');
        const hookLines = hook.split('\n');
        
        assert.equal(hookLines[0], hookShebang, 'hook has correct shebang')
        assert.equal(hookLines[1], 'ls', 'hook keeps existing script')
        assert.equal(hookLines.slice(-1)[0], 'semantic-commits post-commit', 'hook has correct script')
    }); 

    after(() => {
        rmdirSync(hooksPath);
    })
});