import { Router } from 'express';
import { getPortfolio } from '../controllers/portfolio.js';
import { getHistorical, getHistoricalRange } from '../controllers/historical.js';
import { getTransactions } from '../controllers/transactions.js';

const router = Router();

/**
 * GET /api/octav/portfolio
 * Query params:
 *   - addresses: comma-separated list of wallet addresses (required)
 *   - includeImages: boolean (optional)
 *   - includeExplorerUrls: boolean (optional)
 *   - waitForSync: boolean (optional)
 *   - includeNFTs: boolean (optional)
 */
router.get('/portfolio', getPortfolio);

/**
 * GET /api/octav/historical
 * Query params:
 *   - addresses: comma-separated list of wallet addresses (required)
 *   - date: date string in ISO format (required)
 */
router.get('/historical', getHistorical);

/**
 * GET /api/octav/historical/range
 * Query params:
 *   - addresses: comma-separated list of wallet addresses (required)
 *   - dates: comma-separated list of dates in ISO format (required)
 */
router.get('/historical/range', getHistoricalRange);

/**
 * GET /api/octav/transactions
 * Query params:
 *   - addresses: comma-separated list of wallet addresses (required)
 *   - startDate: start date in ISO format (required)
 *   - endDate: end date in ISO format (required)
 *   - searchText: search text (optional)
 *   - interactingAddresses: comma-separated addresses (optional)
 *   - networks: comma-separated network names (optional)
 *   - txTypes: comma-separated transaction types (optional)
 *   - protocols: comma-separated protocol names (optional)
 *   - hideSpam: boolean (optional)
 *   - sort: ASC or DESC (optional)
 *   - tokenId: NFT token ID (optional)
 */
router.get('/transactions', getTransactions);

export default router;
