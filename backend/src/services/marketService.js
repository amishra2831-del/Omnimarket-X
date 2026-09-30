import crypto from 'node:crypto';
import Candidate from '../models/Candidate.js';

export async function createMarketFromCandidate(id) {
  const candidate = await Candidate.findById(id).populate('sourceLinks');
  if (!candidate) throw Object.assign(new Error('Candidate not found'), { status: 404 });
  if (candidate.status !== 'approved') throw Object.assign(new Error('Only approved candidates can be created as markets'), { status: 409 });
  const marketId = `OMX-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  candidate.status = 'created';
  candidate.createdMarket = { marketId, question: candidate.question, outcomes: candidate.outcomes.map(o => o.label), createdAt: new Date() };
  await candidate.save();
  return candidate.createdMarket;
}
