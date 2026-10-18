import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RECURSOS, recursoLigado } from './recursos.ts';

test('o Plus e a dieta nascem DESLIGADOS na v1 de luta (L12, L13: decisão do Alex)', () => {
  assert.equal(RECURSOS.plus, false);
  assert.equal(RECURSOS.dieta, false);
  assert.equal(recursoLigado('plus'), false);
});
