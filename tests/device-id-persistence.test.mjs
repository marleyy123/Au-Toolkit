import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

const source = ts.transpileModule(await readFile('src/utils/deviceAuthService.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const storage = new Map([['au_device_id', 'dev_mobile_hw_1234abcd_legacy123']]);
function load() {
  const localStorage = {
    getItem: key => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value),
  };
  const context = vm.createContext({
    exports: {}, require: () => ({}), console,
    window: { localStorage, screen: { width: 390, height: 844, colorDepth: 24 }, devicePixelRatio: 3, innerWidth: 390 },
    navigator: { platform: 'Linux armv8l', hardwareConcurrency: 8, maxTouchPoints: 5, userAgent: 'Android' },
    localStorage,
  });
  vm.runInContext(source, context);
  return context;
}
const initial = load();
assert.equal(initial.exports.getOrCreateDeviceId('mobile'), 'dev_mobile_hw_1234abcd');
initial.window.screen.width = 844;
initial.window.screen.height = 390;
initial.window.devicePixelRatio = 2;
initial.navigator.hardwareConcurrency = 4;
assert.equal(initial.exports.getOrCreateDeviceId('mobile'), 'dev_mobile_hw_1234abcd', 'Environment drift keeps the persisted ID');
const reload = load();
assert.equal(reload.exports.getOrCreateDeviceId('mobile'), 'dev_mobile_hw_1234abcd', 'Reload preserves migrated ID');
const desktopId = reload.exports.getOrCreateDeviceId('desktop');
assert.ok(desktopId.startsWith('dev_desktop_hw_'));
assert.equal(reload.exports.getOrCreateDeviceId('mobile'), 'dev_mobile_hw_1234abcd', 'Slot IDs remain independent');
storage.clear();
const fresh = load();
const firstId = fresh.exports.getOrCreateDeviceId('mobile');
assert.ok(firstId.startsWith('dev_mobile_hw_'));
assert.equal(load().exports.getOrCreateDeviceId('mobile'), firstId);
console.log('PASS device ID survives environment drift, reload and legacy migration without mixing slots');
