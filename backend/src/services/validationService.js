const GENERIC = ['this', 'that', 'thing', 'something', 'maybe'];

export function validateCandidate(candidate, allCandidates = []) {
  const issues = [];
  const question = (candidate.question || '').trim();
  const resolution = (candidate.resolutionCriteria || '').trim();

  if (question.length < 25) issues.push({ severity: 'error', code: 'QUESTION_TOO_SHORT', message: 'Question is too short to define a measurable event.' });
  if (!question.includes('?')) issues.push({ severity: 'warning', code: 'QUESTION_FORMAT', message: 'Question should normally be phrased as a clear yes/no or multiple-choice question.' });
  if (GENERIC.some(word => question.toLowerCase().includes(word))) issues.push({ severity: 'warning', code: 'VAGUE_LANGUAGE', message: 'Question contains vague language that may create resolution ambiguity.' });
  if (!candidate.eventDate) issues.push({ severity: 'error', code: 'MISSING_EVENT_DATE', message: 'No clear event date is defined.' });
  if (!candidate.closingDate) issues.push({ severity: 'error', code: 'MISSING_CLOSING_DATE', message: 'No clear closing date is defined.' });
  if (candidate.eventDate && candidate.closingDate && new Date(candidate.closingDate) > new Date(candidate.eventDate)) {
    issues.push({ severity: 'error', code: 'CLOSING_AFTER_EVENT', message: 'Closing date occurs after the event date.' });
  }
  if (!resolution || resolution.length < 40) issues.push({ severity: 'error', code: 'WEAK_RESOLUTION', message: 'Resolution criteria must explain exactly how the outcome will be determined.' });
  if (!candidate.resolutionSource) issues.push({ severity: 'error', code: 'NO_RESOLUTION_SOURCE', message: 'A reliable resolution source is required.' });
  if (!candidate.outcomes || candidate.outcomes.length < 2) issues.push({ severity: 'error', code: 'OUTCOMES_REQUIRED', message: 'At least two possible outcomes are required.' });
  if (!candidate.sourceLinks || candidate.sourceLinks.length === 0) issues.push({ severity: 'warning', code: 'NO_SUPPORTING_SOURCE', message: 'Add at least one supporting source.' });

  const normalized = question.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
  for (const existing of allCandidates) {
    const other = (existing.question || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
    if (other && normalized && (other === normalized || other.includes(normalized) || normalized.includes(other))) {
      issues.push({ severity: 'warning', code: 'POSSIBLE_DUPLICATE', message: 'A highly similar candidate already exists.' });
      break;
    }
  }

  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const confidence = Math.max(0, Math.min(100, 100 - errorCount * 25 - warningCount * 8));
  return { issues, confidence };
}
