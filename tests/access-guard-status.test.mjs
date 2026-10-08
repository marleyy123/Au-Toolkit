import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AccessGuard } from '../src/features/auth/components/AccessGuard.tsx';

function render(props) {
  return renderToStaticMarkup(React.createElement(AccessGuard, {
    email: 'buyer@example.com', onLogout() {}, language: 'id', ...props,
  }));
}

for (const status of ['ORDER_NOT_SUCCESS', 'DEVICE_MISMATCH', 'INVALID_PURCHASE_DATA']) {
  const html = render({ status });
  assert.ok(html.includes('Belum terverifikasi'), status);
  assert.ok(!html.includes('Expired'), status);
  assert.ok(!html.includes('Perpanjang Akses Sekarang'), status);
  assert.ok(!html.includes('telah habis'), status);
}
const expired = render({ status: 'EXPIRED' });
assert.ok(expired.includes('Expired'));
assert.ok(expired.includes('Perpanjang Akses Sekarang'));
const active = render({ status: 'ORDER_NOT_SUCCESS', statusAccount: 'Active' });
assert.ok(active.includes('Active'));
assert.ok(!active.includes('Expired'));
console.log('PASS AccessGuard only labels confirmed expiration as Expired');
