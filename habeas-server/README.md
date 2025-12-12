# Habeas Server

An Express.js TypeScript server for the Habeas Data application that provides API proxy, response aggregation, caching, and x402 payment integration.

> **Note:** This is part of the **Habeas Data** project. For the frontend client, see [habeas-client](https://github.com/iamjackgale/habeas-client).

## Overview

The Habeas Server is an Express.js application that enhances the Habeas Data platform with:

- **Octav API Proxy**: Middleware layer that proxies requests to the Octav API
- **Response Aggregation**: Combines data from multiple addresses into unified responses
- **Caching**: Optional caching layer for improved performance
- **Error Handling**: Centralized error handling and response formatting
- **x402 Payment Integration**: Payment processing functionality for API access
- **CDP Integration**: Coinbase Developer Platform integration for wallet operations and token management

The server runs on port 3001 and provides endpoints like:
- `GET /api/octav/portfolio` - Portfolio data for addresses
- `GET /api/octav/historical` - Historical portfolio snapshots
- `GET /api/octav/transactions` - Transaction data within date ranges
- `GET /api/cdp/balance` - Check USDC balances
- `POST /api/cdp/faucet` - Request testnet USDC

## Tech Stack

- **Express.js** - Web framework
- **TypeScript** - Type-safe JavaScript
- **Node.js v18+** - Runtime
- **x402-express** - Payment middleware
- **Coinbase SDK** - CDP integration
- **CORS** - Cross-origin support
- **Dotenv** - Environment configuration

## Prerequisites

1. **Node.js v18+** installed
2. **CDP Project** created at https://portal.cdp.coinbase.com/
3. **CDP API Key** (for using CDP Facilitator, Faucet API, and Token Balances API)
4. **Wallet address** to receive payments (any Ethereum address)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Edit your `.env`:
```env
RECEIVER_WALLET=0xYourWalletAddressHere
CDP_API_KEY_ID=your-api-key-id
CDP_API_KEY_SECRET=your-api-key-secret
PORT=3001
OCTAV_API_KEY=your_octav_api_key_here
```

**Get CDP API Credentials:**
1. Go to https://portal.cdp.coinbase.com/
2. Navigate to API Keys
3. Create a new API key
4. Copy the ID and Secret

**Get your Octav API Key:**
1. Visit https://data.octav.fi
2. Sign up or log in to your account
3. Navigate to your API keys section
4. Create a new API key or copy your existing one
5. Add it to your `.env` file as `OCTAV_API_KEY`

### 3. Start the Server

**Development:**
```bash
npm run dev
```

You should see:
```
🚀 Habeas Server running on http://localhost:3001
💰 Receiving payments at: 0xYourAddress
```

**Production:**
```bash
npm run build
npm start
```

## Scripts

- `npm run dev` - Start development server with hot reload (uses tsx watch)
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run production server from dist/

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 3001) | No |
| `RECEIVER_WALLET` | Ethereum address for receiving payments | Yes |
| `CDP_API_KEY_ID` | Coinbase Developer Platform API key ID | Yes |
| `CDP_API_KEY_SECRET` | Coinbase Developer Platform API key secret | Yes |
| `OCTAV_API_KEY` | API key for Octav Portfolio API | Yes |

## API Endpoints

### Octav API Proxy

#### Portfolio
```
GET /api/octav/portfolio
Query Parameters:
  - addresses: string[] (wallet addresses)
  - includeImages?: boolean
  - includeExplorerUrls?: boolean
  - waitForSync?: boolean
```

#### Historical
```
GET /api/octav/historical
Query Parameters:
  - addresses: string[] (wallet addresses)
  - date: string (YYYY-MM-DD format)
```

#### Transactions
```
GET /api/octav/transactions
Query Parameters:
  - addresses: string[] (wallet addresses)
  - startDate: string (YYYY-MM-DD format)
  - endDate: string (YYYY-MM-DD format)
```

### CDP Integration

#### Check Balance
```
GET /api/cdp/balance
Query Parameters:
  - address: string (wallet address)
```

#### Request Testnet USDC
```
POST /api/cdp/faucet
Body: { "address": "0x..." }
```

## x402 Payment Integration

The server uses the x402 payment standard to require small onchain payments for API access. Configuration is in `src/index.ts` under the `paymentMiddleware` setup.

Protected endpoints require:
- Valid x402 payment header
- Sufficient payment amount in Base Sepolia USDC

## Project Structure

```
src/
├── index.ts              # Application entry point
├── controllers/          # API endpoint handlers
│   ├── portfolio.ts      # Portfolio data endpoints
│   ├── historical.ts     # Historical data endpoints
│   ├── transactions.ts   # Transaction data endpoints
│   ├── cdp.ts            # CDP endpoints
│   └── category-sync.ts  # Category synchronization
├── routes/               # Express route definitions
│   ├── octav.ts          # Octav API routes
│   └── cdp.ts            # CDP routes
├── types/                # TypeScript type definitions
├── utils/                # Utility functions
│   ├── balances.ts       # Balance checking utilities
│   ├── faucet.ts         # Faucet utilities
│   ├── cache.ts          # Caching utilities
│   └── category-sync.ts  # Category sync utilities
└── .env.example          # Environment variables template
```

## Architecture

The server acts as a middleware layer between the Habeas Client and external APIs:

```
Habeas Client (habeas-client)
    ↓
Habeas Server (this repository)
    ↓
    ├── Octav API (portfolio, historical, transactions)
    ├── CDP SDK (balance checks, faucet)
    └── x402 Facilitator (payment verification)
```

### Request Flow

1. Client makes request to Habeas Server endpoint
2. Server validates x402 payment (if protected endpoint)
3. Server calls Octav API or CDP endpoints
4. Server aggregates/caches response
5. Server returns data to client

## Data Aggregation

The server can combine data from multiple wallet addresses in a single request:

```javascript
// Example: Get portfolio for multiple addresses
GET /api/octav/portfolio?addresses=0xAddress1&addresses=0xAddress2

// Response
{
  data: {
    "0xAddress1": { /* portfolio data */ },
    "0xAddress2": { /* portfolio data */ }
  },
  progress: {
    loaded: 2,
    total: 2,
    percentage: 100
  }
}
```

## Caching

The server implements optional caching for improved performance:

- Portfolio data cached for 1 hour
- Historical data cached per date
- Transaction data cached per date range
- Cache invalidation on fresh data requests

## Error Handling

All endpoints include comprehensive error handling:

- API error responses with descriptive messages
- Proper HTTP status codes
- Request validation
- CORS error handling
- x402 payment validation errors

## Related Projects

- **[habeas-client](https://github.com/iamjackgale/habeas-client)** - Next.js frontend application

## Learning Resources

**Octav:**
- [Octav API Documentation](https://api-docs.octav.fi)
- [Portfolio API](https://docs.octav.fi/api/endpoints/portfolio)
- [Supported Chains](https://docs.octav.fi/api/reference/supported-chains)
- [Protocol Types](https://docs.octav.fi/api/reference/protocol-types)

**x402 & CDP:**
- [CDP Facilitator docs](https://docs.cdp.coinbase.com/x402)
- [CDP x402 Facilitator API reference](https://docs.cdp.coinbase.com/api-reference/v2/rest-api/x402-facilitator/x402-facilitator)
- [x402 GitHub repo](https://github.com/coinbase/x402)
- [x402-express GitHub](https://github.com/coinbase/x402-express)

**Technologies:**
- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [Coinbase Developer Platform Docs](https://docs.cdp.coinbase.com/)

## License

MIT
