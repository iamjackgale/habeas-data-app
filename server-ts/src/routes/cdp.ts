import { Router } from 'express';
import { getBalance, requestFromFaucet } from '../controllers/cdp.js';

const router = Router();

/**
 * @route GET /api/cdp/balance/:address
 * @desc Get USDC balance for an address on Base Sepolia
 */
router.get('/balance/:address', getBalance);

/**
 * @route POST /api/cdp/faucet
 * @desc Request test USDC from the CDP Faucet
 * @body { address: string }
 */
router.post('/faucet', requestFromFaucet);

export default router;
