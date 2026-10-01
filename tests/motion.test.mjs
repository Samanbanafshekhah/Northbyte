import test from 'node:test';
import assert from 'node:assert/strict';
import { getSceneOffset } from '../motion.js';

test('abstract scene movement is bounded at both scroll extremes', () => {
  assert.equal(Math.abs(getSceneOffset(-100)), 0);
  assert.equal(getSceneOffset(100), -24);
});
test('scene depth reverses without jumps or accumulated animation state', () => {
  const forward = Array.from({ length: 101 }, (_, i) => getSceneOffset(i / 100));
  for (let i = 100; i >= 0; i--) assert.equal(getSceneOffset(i / 100), forward[i]);
  for (let i = 1; i <= 100; i++) assert.ok(Math.abs(forward[i] - forward[i - 1]) < 0.37);
});
