import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import octavRoutes from './routes/octav.js';
import cdpRoutes from './routes/cdp.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'x402 Demo API (TypeScript)',
    description: 'TypeScript Express server with x402 payments',
    status: 'ok',
    endpoints: {
      'GET /health': 'Health check',
      'GET /api/octav/portfolio': 'Get combined portfolio for multiple addresses',
      'GET /api/octav/historical': 'Get historical portfolio for a specific date',
      'GET /api/octav/historical/range': 'Get historical portfolio across multiple dates',
      'GET /api/octav/transactions': 'Get transactions for multiple addresses in a date range',
      'GET /api/cdp/balance/:address': 'Get USDC balance for an address',
      'POST /api/cdp/faucet': 'Request test USDC from CDP Faucet',
    }
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Octav API routes
app.use('/api/octav', octavRoutes);

// CDP API routes
app.use('/api/cdp', cdpRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`\nEndpoints:`);
  console.log(`  • GET  /health                       - Health check`);
  console.log(`  • GET  /api/octav/portfolio          - Get combined portfolio`);
  console.log(`  • GET  /api/octav/historical         - Get historical portfolio`);
  console.log(`  • GET  /api/octav/historical/range   - Get historical range`);
  console.log(`  • GET  /api/octav/transactions       - Get transactions`);
  console.log(`  • GET  /api/cdp/balance/:address     - Get USDC balance`);
  console.log(`  • POST /api/cdp/faucet               - Request test USDC`);
});
