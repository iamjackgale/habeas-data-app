import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import octavRoutes from './routes/octav.js';
import cdpRoutes from './routes/cdp.js';
import { paymentMiddleware } from 'x402-express';
import { facilitator } from '@coinbase/x402';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cors());

const RECEIVER_WALLET = process.env.RECEIVER_WALLET as `0x${string}` || "0xYourWalletAddress";

// apply x402 payment middleware
app.use(paymentMiddleware(
  RECEIVER_WALLET,
  {
    // configure the x402-enabled endpoint
    "GET /octav/paid": {
      // price in USDC (0.01 USDC)
      price: "$0.01",
      // using Base Sepolia testnet
      network: "base-sepolia",
      // metadata about the endpoint for better discovery
      config: {
        description: "Create your own widget",
        outputSchema: {
          type: "object",
          properties: {
            approved: { type: "boolean", description: "approved or not" },
          }
        }
      }
    }
  },
  facilitator // use CDP's hosted facilitator (requires CDP_API_KEY and CDP_API_KEY_PRIVATE_KEY env vars)
));

app.get('/octav/paid', (req: Request, res: Response) => {
  const { amount, walletAddress } = req.body;
  
  // If we reach here, payment has been verified by x402 middleware
  // The middleware only allows the request through after payment is confirmed
  
  res.json({
    approved: true,
  });
});

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Habeas Data API (TypeScript)',
    description: 'TypeScript Express server for Habeas Data services using x402 payments',
    status: 'ok',
    endpoints: {
      'GET /health': 'Health check',
      'GET /api/octav/portfolio': 'Get combined portfolio for multiple addresses',
      'GET /api/octav/historical': 'Get historical portfolio for a specific date',
      'GET /api/octav/historical/range': 'Get historical portfolio across multiple dates',
      'GET /api/octav/transactions': 'Get transactions for multiple addresses in a date range',
      'GET /api/octav/paid': 'Payment-gated endpoint (x402)',
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
