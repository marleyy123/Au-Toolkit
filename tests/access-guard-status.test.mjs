import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'esbuild';
import { createRequire } from 'node:module';
const bundle = await build({ entryPoints: ['src/features/auth/components/access/AccessGuard.tsx'], bundle: true,
  write: false, platform: 'node', format: 'cjs', packages: 'external', define: { 'import.meta.env': '{}' } });
const compiled = { exports: {} };
new Function('require', 'module', 'exports', bundle.outputFiles[0].text)(createRequire(import.meta.url), compiled, compiled.exports);
const { AccessGuard } = compiled.exports;

function render(props) {
  return renderToStaticMarkup(React.createElement(AccessGuard, {
    email: 'buyer@example.com', onLogout() {}, language: 'id', ...props,
  }));
}

for (const status of ['ORDER_NOT_SUCCESS', 'DEVICE_MISMATCH', 'INVALID_PURCHASE_DATA']) {
  const html = render({ status });
  assert.ok(html.includes('Belum terverifikasi'), status);
  assert.ok(!html.includes('Expired'), status);
  assert.ok(!html.includes('Perpanjang akses'), status);
  assert.ok(!html.includes('telah habis'), status);
}
const expired = render({ status: 'EXPIRED' });
assert.ok(expired.includes('Expired'));
assert.ok(expired.includes('Perpanjang akses'));
const active = render({ status: 'ORDER_NOT_SUCCESS', statusAccount: 'Active' });
assert.ok(active.includes('Active'));
assert.ok(!active.includes('Expired'));
console.log('PASS AccessGuard only labels confirmed expiration as Expired');
