import { Router } from 'express';
import { asyncHandler } from '../utils/http.js';
import { runDiscovery } from '../services/discoveryService.js';

const router = Router();
router.post('/run', asyncHandler(async (_req, res) => res.json(await runDiscovery())));
export default router;
