const REQUIRED_AREAS = ['apiContract', 'data', 'tests', 'observability', 'rollback'];

export function validatePlan(plan) {
  const errors = [];
  if (!plan || typeof plan !== 'object') return ['plan must be an object'];
  if (!plan.change) errors.push('change is required');
  for (const area of REQUIRED_AREAS) {
    if (!plan[area]) errors.push(`${area} is required`);
  }
  if (plan.tests && (!Array.isArray(plan.tests) || plan.tests.length === 0)) errors.push('tests must be a non-empty array');
  if (plan.rollback && !plan.rollback.strategy) errors.push('rollback.strategy is required');
  return errors;
}

export function scorePlan(plan) {
  const errors = validatePlan(plan);
  const tests = plan.tests || [];
  const failed = tests.filter((test) => test.status === 'failed').length;
  const pending = tests.filter((test) => test.status !== 'passed').length;
  return {
    ready: errors.length === 0 && failed === 0 && pending === 0,
    errors,
    metrics: { areas: REQUIRED_AREAS.filter((area) => Boolean(plan[area])).length, tests: tests.length, failed, pending }
  };
}
