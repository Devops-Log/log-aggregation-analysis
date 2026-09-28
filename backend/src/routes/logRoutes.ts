import { Router } from 'express';
import { createLog, getLogs, getMetrics, seedLogs } from '../controllers/logController';

const router = Router();

router.post('/seed', seedLogs);
router.get('/metrics', getMetrics);
router.post('/', createLog);
router.get('/', getLogs);

export default router;
