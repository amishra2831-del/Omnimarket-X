import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCandidate } from '../src/services/validationService.js';

test('validation blocks missing resolution source and dates', () => {
  const result = validateCandidate({ question: 'Will event happen?', outcomes: [{ label: 'Yes' }, { label: 'No' }], resolutionCriteria: 'Short' }, []);
  assert.ok(result.issues.some(i => i.code === 'NO_RESOLUTION_SOURCE'));
  assert.ok(result.issues.some(i => i.code === 'MISSING_EVENT_DATE'));
});

test('valid candidate has no blocking errors', () => {
  const result = validateCandidate({
    question: 'Will NASA launch the mission before July 1, 2027?',
    eventDate: '2027-07-01', closingDate: '2027-06-30',
    resolutionCriteria: 'Resolve YES if NASA confirms the mission launched before the deadline; otherwise resolve NO.',
    resolutionSource: 'https://www.nasa.gov/', outcomes: [{ label: 'Yes' }, { label: 'No' }], sourceLinks: ['source']
  }, []);
  assert.equal(result.issues.filter(i => i.severity === 'error').length, 0);
  assert.ok(result.confidence > 70);
});
