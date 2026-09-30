import { XMLParser } from 'fast-xml-parser';
import crypto from 'node:crypto';
import Source from '../models/Source.js';
import Candidate from '../models/Candidate.js';
import { validateCandidate } from './validationService.js';

const DEMO_EVENTS = [
  {
    title: 'NASA Artemis II mission planning update',
    url: 'https://www.nasa.gov/',
    publisher: 'NASA',
    snippet: 'NASA public updates provide milestones and schedule information for upcoming Artemis activities.',
    category: 'Space',
    question: 'Will NASA launch the Artemis II mission before July 1, 2027?',
    description: 'A demo candidate derived from a public agency update. The candidate is deliberately structured around a measurable launch event rather than copying an article.',
    eventDate: '2027-07-01T00:00:00.000Z',
    closingDate: '2027-06-30T23:00:00.000Z',
    resolutionCriteria: 'Resolve YES if NASA officially confirms that Artemis II has launched before 00:00 UTC on July 1, 2027. Otherwise resolve NO. Launch confirmation must come from NASA mission status reporting.',
    resolutionSource: 'https://www.nasa.gov/',
    outcomes: [{ label: 'Yes', description: 'Launch occurs before the deadline.' }, { label: 'No', description: 'Launch does not occur before the deadline.' }]
  },
  {
    title: 'Federal Reserve policy decision',
    url: 'https://www.federalreserve.gov/newsevents/calendar.htm',
    publisher: 'Federal Reserve',
    snippet: 'The Federal Reserve publishes a public calendar for FOMC meetings and policy announcements.',
    category: 'Economics',
    question: 'Will the Federal Reserve lower the federal funds target range at its next scheduled FOMC decision?',
    description: 'A demo candidate based on a public economic calendar. In production, the ingestion adapter would enrich the candidate with the exact meeting date and current target range.',
    eventDate: '2027-01-27T19:00:00.000Z',
    closingDate: '2027-01-27T18:30:00.000Z',
    resolutionCriteria: 'Resolve YES if the official FOMC statement shows a lower target range than the immediately preceding decision. Resolve NO otherwise.',
    resolutionSource: 'https://www.federalreserve.gov/newsevents/pressreleases.htm',
    outcomes: [{ label: 'Yes', description: 'Target range is lowered.' }, { label: 'No', description: 'Target range is unchanged or increased.' }]
  }
];

function fingerprint(question) {
  return crypto.createHash('sha256').update(question.toLowerCase().replace(/[^a-z0-9]/g, '')).digest('hex');
}

async function fetchRss(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'OmniMarketX-Discovery/1.0' } });
  if (!response.ok) throw new Error(`RSS source returned ${response.status}`);
  const xml = await response.text();
  const parser = new XMLParser({ ignoreAttributes: false });
  const parsed = parser.parse(xml);
  const items = parsed?.rss?.channel?.item || parsed?.feed?.entry || [];
  return Array.isArray(items) ? items : [items];
}

export async function runDiscovery() {
  const rssUrl = 'https://www.nasa.gov/feed/';
  let events = [];
  let sourceStatus = 'live';
  try {
    const items = await fetchRss(rssUrl);
    events = items.slice(0, 5).map(item => ({
      title: item.title?.['#text'] || item.title || 'Untitled source',
      url: item.link?.['@_href'] || item.link || rssUrl,
      publisher: 'NASA',
      snippet: item.description || item.summary || '',
      category: 'Public events'
    }));
  } catch (error) {
    sourceStatus = `fallback: ${error.message}`;
  }

  const generated = DEMO_EVENTS.map(event => ({ ...event, sourceStatus }));
  const created = [];
  for (const event of generated) {
    const source = await Source.create({ title: event.title, url: event.url, publisher: event.publisher, snippet: event.snippet, sourceType: sourceStatus === 'live' ? 'rss' : 'demo' });
    const candidate = {
      fingerprint: fingerprint(event.question),
      question: event.question,
      category: event.category,
      description: event.description,
      outcomes: event.outcomes,
      eventDate: event.eventDate,
      closingDate: event.closingDate,
      resolutionCriteria: event.resolutionCriteria,
      resolutionSource: event.resolutionSource,
      sourceLinks: [source._id],
      status: 'needs_review'
    };
    const existing = await Candidate.findOne({ fingerprint: candidate.fingerprint });
    if (existing) {
      created.push(existing);
      continue;
    }
    const validation = validateCandidate(candidate, await Candidate.find({}).lean());
    const saved = await Candidate.create({ ...candidate, validationIssues: validation.issues, confidence: validation.confidence });
    created.push(saved);
  }
  return { sourceStatus, count: created.length, candidates: created };
}
