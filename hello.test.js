import { test } from 'node:test';
import assert from 'node:assert';
import { hello } from './hello.js';

test('hello returns greeting for world', () => {
  assert.strictEqual(hello('world'), 'Hello, world!');
});

test('hello returns greeting for Alice', () => {
  assert.strictEqual(hello('Alice'), 'Hello, Alice!');
});

test('hello is a pure function with no side effects', () => {
  // Calling hello multiple times with same input should always return same output
  const result1 = hello('test');
  const result2 = hello('test');
  assert.strictEqual(result1, result2);
  assert.strictEqual(result1, 'Hello, test!');
});
