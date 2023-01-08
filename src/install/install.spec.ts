import { mkdir, readdir, readFileSync, rmdir, unlink, writeFileSync } from 'fs';
import * as path from 'path';
import * as assert from 'assert';
import { hookShebang, install } from './install';

const hooksPathOverride = 'src/install/test-hooks';

describe('semantic-commits install', () => {
    before(() => {
        mkdir(hooksPathOverride, () => {})
    })

    afterEach(() => {
        readdir(hooksPathOverride, (_error, files) => {
            for (const file of files)  {
                unlink(path.join(hooksPathOverride, file), () => {});
            }
        })
    });

    it('should create new commit-msg hook', async () => {
        await install(hooksPathOverride);

        const hook = readFileSync(path.join(hooksPathOverride, 'commit-msg'), 'utf-8');
        const hookLines = hook.split('\n');
        
        assert(hookLines[0] == hookShebang, 'hook has correct shebang')
        assert(hookLines.slice(-1)[0] == 'semantic-commits commit-msg $1', 'hook has correct script')
    }); 

    it('should create new post-commit hook', async () => {
        await install(hooksPathOverride);

        const hook = readFileSync(path.join(hooksPathOverride, 'post-commit'), 'utf-8');
        const hookLines = hook.split('\n');
        
        assert(hookLines[0] == hookShebang, 'hook has correct shebang')
        assert(hookLines.slice(-1)[0] == 'semantic-commits post-commit', 'hook has correct script')
    }); 

    it('should update existing commit-msg hook', async () => {
        writeFileSync(path.join(hooksPathOverride, 'commit-msg'), `${hookShebang}\nls`)

        await install(hooksPathOverride);

        const hook = readFileSync(path.join(hooksPathOverride, 'commit-msg'), 'utf-8');
        const hookLines = hook.split('\n');
        
        assert(hookLines[0] == hookShebang, 'hook has correct shebang')
        assert(hookLines[1] == 'ls', 'hook keeps existing script')
        assert(hookLines.slice(-1)[0] == 'semantic-commits commit-msg $1', 'hook has correct script')
    }); 

    it('should update existing post-commit hook', async () => {
        writeFileSync(path.join(hooksPathOverride, 'post-commit'), `${hookShebang}\nls`)

        await install(hooksPathOverride);

        const hook = readFileSync(path.join(hooksPathOverride, 'post-commit'), 'utf-8');
        const hookLines = hook.split('\n');
        
        assert(hookLines[0] == hookShebang, 'hook has correct shebang')
        assert(hookLines[1] == 'ls', 'hook keeps existing script')
        assert(hookLines.slice(-1)[0] == 'semantic-commits post-commit', 'hook has correct script')
    }); 

    after(() => {
        rmdir(hooksPathOverride, () => {})
    })
});