import Candidate from '../models/Candidate.js';
import Source from '../models/Source.js';
import { validateCandidate } from './validationService.js';

export async function listCandidates(status) {
  const query = status ? { status } : {};
  return Candidate.find(query).populate('sourceLinks').sort({ createdAt: -1 });
}

export async function getCandidate(id) {
  const candidate = await Candidate.findById(id).populate('sourceLinks');
  if (!candidate) throw Object.assign(new Error('Candidate not found'), { status: 404 });
  return candidate;
}

export async function updateCandidate(id, body) {
  const candidate = await Candidate.findById(id);
  if (!candidate) throw Object.assign(new Error('Candidate not found'), { status: 404 });
  if (candidate.status === 'created') throw Object.assign(new Error('Created markets cannot be edited in this demo'), { status: 409 });

  const fields = ['question', 'category', 'description', 'outcomes', 'eventDate', 'closingDate', 'resolutionCriteria', 'resolutionSource', 'reviewerNote'];
  for (const field of fields) if (body[field] !== undefined) candidate[field] = body[field];
  const validation = validateCandidate(candidate.toObject(), await Candidate.find({ _id: { $ne: id } }).lean());
  candidate.validationIssues = validation.issues;
  candidate.confidence = validation.confidence;
  if (candidate.status === 'discovered') candidate.status = 'needs_review';
  await candidate.save();
  return Candidate.findById(id).populate('sourceLinks');
}

export async function reviewCandidate(id, action, note) {
  const candidate = await Candidate.findById(id);
  if (!candidate) throw Object.assign(new Error('Candidate not found'), { status: 404 });
  if (!['approve', 'reject'].includes(action)) throw Object.assign(new Error('Invalid review action'), { status: 400 });
  if (action === 'approve') {
    const errors = candidate.validationIssues.filter(i => i.severity === 'error');
    if (errors.length) throw Object.assign(new Error('Candidate has blocking validation errors'), { status: 409, details: errors });
    candidate.status = 'approved';
  } else {
    candidate.status = 'rejected';
  }
  candidate.reviewerNote = note || candidate.reviewerNote;
  await candidate.save();
  return Candidate.findById(id).populate('sourceLinks');
}

export async function getStats() {
  const [total, review, approved, created, rejected] = await Promise.all([
    Candidate.countDocuments(), Candidate.countDocuments({ status: 'needs_review' }), Candidate.countDocuments({ status: 'approved' }), Candidate.countDocuments({ status: 'created' }), Candidate.countDocuments({ status: 'rejected' })
  ]);
  return { total, review, approved, created, rejected };
}
