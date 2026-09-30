import { Router } from 'express';
import { asyncHandler } from '../utils/http.js';
import { createMarketFromCandidate } from '../services/marketService.js';

const router = Router();
router.post('/from-candidate/:id', asyncHandler(async (req, res) => res.status(201).json(await createMarketFromCandidate(req.params.id))));
export default router;
