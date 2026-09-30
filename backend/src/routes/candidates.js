import { Router } from 'express';
import { asyncHandler } from '../utils/http.js';
import { getStats, listCandidates, getCandidate, updateCandidate, reviewCandidate } from '../services/candidateService.js';

const router = Router();
router.get('/stats', asyncHandler(async (_req, res) => res.json(await getStats())));
router.get('/', asyncHandler(async (req, res) => res.json(await listCandidates(req.query.status))));
router.get('/:id', asyncHandler(async (req, res) => res.json(await getCandidate(req.params.id))));
router.patch('/:id', asyncHandler(async (req, res) => res.json(await updateCandidate(req.params.id, req.body))));
router.post('/:id/review', asyncHandler(async (req, res) => res.json(await reviewCandidate(req.params.id, req.body.action, req.body.note))));
export default router;
