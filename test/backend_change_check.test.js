import test from 'node:test';
import assert from 'node:assert/strict';
import { scorePlan, validatePlan } from '../src/backend_change_check.js';

const plan = {
  change: 'add-idempotent-order-retry',
  apiContract: 'POST /orders keeps response schema and returns 409 on duplicate request ID',
  data: 'adds nullable request_id column with backfill plan',
  tests: [{ name: 'duplicate retry', status: 'passed' }, { name: 'schema contract', status: 'passed' }],
  observability: 'logs request_id and emits retry_count metric',
  rollback: { strategy: 'disable retry path and deploy previous API version' }
};

test('accepts a complete safe backend change', () => {
  const result = scorePlan(plan);
  assert.equal(result.ready, true);
  assert.deepEqual(result.errors, []);
  assert.equal(result.metrics.areas, 5);
});

test('rejects missing reasoning areas', () => {
  const incomplete = { change: 'add-cache', tests: [{ name: 'cache hit', status: 'passed' }] };
  assert.deepEqual(validatePlan(incomplete), ['apiContract is required', 'data is required', 'observability is required', 'rollback is required']);
});

test('pending or failed tests block release', () => {
  const blocked = { ...plan, tests: [{ name: 'duplicate retry', status: 'failed' }, { name: 'schema contract', status: 'pending' }] };
  const result = scorePlan(blocked);
  assert.equal(result.ready, false);
  assert.equal(result.metrics.failed, 1);
  assert.equal(result.metrics.pending, 2);
});
