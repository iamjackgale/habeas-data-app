# x402 demo

![x402 demo](./x402-demo.png)

this is a simple demo of the x402 payment protocol, showcasing how easy it is to add crypto payments to any API and how seamlessly clients can pay for access

> **Note:** This repository is a fork of [x402-demo](https://github.com/Jnix2007/x402-demo) by Jnix2007, extended with additional features including portfolio integration via the Octav API.

## what is x402?

[x402](https://www.x402.org/) is an HTTP-based payment protocol that enables instant, automatic stablecoin payments for APIs and digital content

it revives the HTTP 402 "Payment Required" status code to enable programmatic payments without accounts, sessions, or complex auth

x402 is perfect for:
- AI agents paying for services
- micropayments and pay-per-use APIs
- monetizing web services without subscription-based paywalls
- instant settlement without intermediaries

## about this demo

this project showcases **four Coinbase Developer Platform (CDP) products** working together:

### CDP products used

**client-side:**
- **CDP Embedded Wallet** - seamless user auth with a variety of web2-friendly auth methods; no extension or seed phrases

**server-side:**
- **CDP x402 Facilitator** - payment verification and blockchain settlement
- **CDP Faucet API** - one-click test USDC distribution
- **CDP Token Balances API** - realtime USDC balance checking

### what you'll see

- simple API endpoint requiring 0.01 USDC payment
- multiple web2-friendly auth options for wallet creation
- one-click faucet for test USDC
- automatic payment handling (no manual transaction signing)
- real-time balance updates via CDP API
- transaction confirmations on Basescan

## tech stack

**client:**
- Next.js 15 with App Router
- React 19
- Tailwind CSS v4
- Shadcn UI
- TypeScript
- Radix UI primitives
- React Query for data fetching

**server:**
- Express.js
- Node.js

## quickstart

### pre-reqs

1. **Node.js v18+** installed
2. **pnpm** installed (for client dependencies)
   - install with: `npm install -g pnpm`
3. **CDP Project** created at https://portal.cdp.coinbase.com/
4. **CDP API Key** for using CDP Facilitator, Faucet API, and Token Balances API
5. **wallet address** to receive payments (any Ethereum address)

### 1. install server dependencies

```bash
cd server
npm install
```

### 2. configure server

```bash
cp .env.example .env
```

edit your `server/.env`:
```env
RECEIVER_WALLET=0xYourWalletAddressHere
CDP_API_KEY_ID=your-api-key-id
CDP_API_KEY_SECRET=your-api-key-secret
PORT=3001
```

**get CDP API credentials:**
1. go to https://portal.cdp.coinbase.com/
2. navigate to API Keys
3. create new API key
4. copy the ID and Secret

### 3. start server

```bash
npm run dev:server
```

you should see:
```
🚀 x402 Demo Server running on http://localhost:3001
📝 Protected endpoint: http://localhost:3001/motivate
💰 Receiving payments at: 0xYourAddress
```

leave this terminal running

### 4. install client dependencies

open a new terminal:

```bash
cd client
pnpm install
```

> **Note:** This project uses `pnpm` as the package manager for the client. Make sure you have `pnpm` installed. If you don't have it, install it with `npm install -g pnpm`.

### 5. configure client

```bash
cp .env.local.example .env.local
```

edit your `client/.env.local`:
```env
NEXT_PUBLIC_CDP_PROJECT_ID=your-project-id-here
NEXT_PUBLIC_API_URL=http://localhost:3001

# Octav API Key (REQUIRED for Octav Portfolio API)
# Get your API key at https://data.octav.fi
OCTAV_API_KEY=your_octav_api_key_here
```

**get your CDP Project ID:**
1. go to https://portal.cdp.coinbase.com/
2. select your project from the dropdown
3. go to Settings
4. copy the Project ID

**get your Octav API Key:**
1. visit https://data.octav.fi
2. sign up or log in to your account
3. navigate to your API keys section
4. create a new API key or copy your existing one
5. add it to your `.env.local` file as `OCTAV_API_KEY`
6. ask the Octav team for Credits

**Important:** Never commit your `.env.local` file to version control. It's already included in `.gitignore`.

### 6. start client (in a new terminal)

```bash
cd client
pnpm run dev
```

> **Note:** The client uses `pnpm` for package management. Use `pnpm run dev` instead of `npm run dev:client`.

you should see:
```
✓ Ready in 2.5s
○ Local:        http://localhost:3000
```

### 7. try it

1. open http://localhost:3000
2. click "Connect Wallet" and choose your preferred sign-in method
3. complete authentication; CDP Embedded Wallet is created automatically
4. click "Faucet" to get free testnet USDC
5. click "Get Motivational Quote (0.01 USDC)"
6. watch the payment happen automatically
7. see your quote and transaction confirmation on Basescan

## project structure

```
x402-demo/
├── server/              # express API with x402
│   ├── index.js         # main server with x402 middleware
│   ├── faucet.js        # CDP Faucet API integration
│   ├── balances.js      # CDP Token Balances API integration
│   ├── package.json
│   └── .env.example
├── client/              # Next.js web app
│   ├── app/
│   │   ├── api/
│   │   │   └── portfolio/
│   │   │       └── route.ts          # NextJS API endpoint for Octav Portfolio API
│   │   ├── (dashboard)/
│   │   │   └── page.tsx
│   │   ├── page.tsx           # main UI with auth & payments
│   │   ├── providers.tsx      # CDP Embedded Wallet setup
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── widgets/
│   │   │   └── portfolio.tsx         # Portfolio widget component
│   │   └── ui/                        # UI components
│   ├── services/
│   │   └── octav/
│   │       ├── loader.ts              # React Query hook (useGetPortfolio)
│   │       └── portfolio.ts           # Portfolio API service
│   ├── types/
│   │   └── portfolio.ts               # TypeScript types for portfolio data
│   ├── package.json
│   └── .env.local.example
└── README.md            # this file
```

## x402 server-side integration

this is literally all the code needed to add payments to your API:

```javascript
import { paymentMiddleware } from "x402-express";
import { facilitator } from "@coinbase/x402";

app.use(paymentMiddleware(
  "0xYourWalletAddress",  // your wallet where you'll receive payments for your API
  {
    "GET /motivate": {
      price: "$0.01",              // how much you want to charge
      network: "base-sepolia",     // blockchain network
      // asset: "0x036CbD...",     // optional: specify token (defaults to USDC)
    }
  },
  facilitator  // CDP's hosted facilitator (requires CDP API key)
));

app.get("/motivate", (req, res) => {
  res.json({ quote: "Work hard, have fun, make history." });
});
```

the **CDP x402 Facilitator** handles:
- payment verification (validates EIP-3009 signatures and amounts)
- blockchain settlement (submits to the indicated chain; pays gas fees on supported chains)
- error handling and retry logic
- adding response headers with transaction details

**note on tokens:** the `price: "$0.01"` shorthand defaults to USDC

**EVM limitation:** On EVM chains (like Base), x402 uses EIP-3009 `transferWithAuthorization`, which requires tokens to explicitly implement this standard. Most ERC20 tokens have not implemented EIP-3009, so in practice this limits x402 in its current form to using mostly USDC.

**Solana flexibility:** On Solana, x402 works with **any SPL token** using standard token transfers with facilitator fee sponsorship - no special token implementation required

## octav portfolio API integration

the client includes integration with the [Octav Portfolio API](https://docs.octav.fi/api/endpoints/portfolio) to fetch and display portfolio data for blockchain addresses.

### NextJS API endpoint

the template includes a NextJS API route at `/app/api/portfolio/route.ts` that acts as a secure proxy to the Octav API. this endpoint:

- **securely stores your API key** on the server (never exposed to the client)
- **handles authentication** with the Octav API
- **validates request parameters**
- **returns formatted error messages** for better debugging

#### API endpoint structure

```
GET /api/portfolio?addresses=<address>&includeImages=true&includeExplorerUrls=true
```

**query parameters:**
- `addresses` (required): single wallet address
- `includeImages` (optional): include image URLs for assets, chains, and protocols
- `includeExplorerUrls` (optional): include blockchain explorer URLs
- `waitForSync` (optional): wait for fresh data if cache is stale

**example request:**

```typescript
// in your component
const { data, isLoading, error } = useGetPortfolio({
  address: '0x6426af179aabebe47666f69fd9079673f6cd',
  includeImages: true,
  includeExplorerUrls: true,
  waitForSync: true,
});
```

### React Query hook

the template provides a `useGetPortfolio` hook that uses React Query for data fetching:

```typescript
import { useGetPortfolio } from '@/services/octav/loader';

function MyComponent() {
  const { data, isLoading, error } = useGetPortfolio({
    address: '0x6426af179aabebe47666f69fd9079673f6cd',
    includeImages: true,
    includeExplorerUrls: true,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Portfolio for {data.address}</h2>
      <p>Net Worth: ${data.networth}</p>
      <p>Cash Balance: ${data.cashBalance}</p>
      <p>Daily Income: ${data.dailyIncome}</p>
      <p>Daily Expense: ${data.dailyExpense}</p>
    </div>
  );
}
```

### portfolio data structure

the API returns comprehensive portfolio data including:

- **portfolio summary**: net worth, cash balance, daily income/expense, fees
- **assets by protocol**: organized by protocol (wallet, lending, staking, DEX, etc.)
- **chain distribution**: assets organized by blockchain

see the complete type definitions in `/types/portfolio.ts` for all available fields.

### error handling

the API endpoint and React Query hook include comprehensive error handling:

- **missing API key**: clear error message if `OCTAV_API_KEY` is not set
- **invalid address**: validation error for malformed addresses
- **API errors**: Octav API error messages are passed through to the component
- **network errors**: handled gracefully with user-friendly messages

**example error display:**

```typescript
if (error) {
  return (
    <div className="p-4 border border-red-300 bg-red-50 rounded-md">
      <p className="font-semibold text-red-800">Error</p>
      <p className="text-red-600">{error.message}</p>
    </div>
  );
}
```

### example component

check out `/components/widgets/portfolio.tsx` for a complete example of how to use the portfolio API in your components.

### full API documentation

- [Portfolio API](https://docs.octav.fi/api/endpoints/portfolio)
- [API Access & Pricing](https://api-docs.octav.fi/getting-started/api-access)
- [Get an API Key](https://data.octav.fi)
- [Supported Chains](https://docs.octav.fi/api/reference/supported-chains)
- [Protocol Types](https://docs.octav.fi/api/reference/protocol-types)

## x402 client-side integration

making a paid request from your app's front-end is incredibly simple with CDP's new `useX402` hook:

```typescript
import { useX402 } from "@coinbase/cdp-hooks";

// one line to get payment-enabled fetch
const { fetchWithPayment } = useX402();

// make paid request; payment happens automatically
const response = await fetchWithPayment("http://localhost:3001/motivate");
const data = await response.json();
```

the **`useX402` hook** from CDP Embedded Wallet automatically:
- detects 402 responses from the server
- extracts payment information
- creates payment transactions
- signs with your CDP Embedded Wallet
- retries with proof of payment
- returns the paid content

## how x402 works

```
┌─────────┐                    ┌─────────┐                    ┌────────────┐
│ Client  │                    │  Server │                    │ Facilitator│
└────┬────┘                    └────┬────┘                    └─────┬──────┘
     │                              │                                │
     │  1. GET /motivate            │                                │
     ├─────────────────────────────>│                                │
     │                              │                                │
     │  2. 402 Payment Required     │                                │
     │     + Payment Requirements   │                                │
     │<─────────────────────────────┤                                │
     │                              │                                │
     │  3. Create & Sign Payment    │                                │
     │     Transaction              │                                │
     │                              │                                │
     │  4. GET /motivate            │                                │
     │     + X-PAYMENT header       │                                │
     ├─────────────────────────────>│                                │
     │                              │  5. Verify Payment             │
     │                              ├───────────────────────────────>│
     │                              │                                │
     │                              │  6. Verification Result        │
     │                              │<───────────────────────────────┤
     │                              │                                │
     │                              │  7. Settle Payment             │
     │                              ├───────────────────────────────>│
     │                              │                                │
     │                              │  8. Settlement Result          │
     │                              │     + Transaction Hash         │
     │                              │<───────────────────────────────┤
     │                              │                                │
     │  9. 200 OK                   │                                │
     │     + Protected Content      │                                │
     │     + X-PAYMENT-RESPONSE     │                                │
     │<─────────────────────────────┤                                │
     │                              │                                │
```

## suggested demo presentation flow

1. **show server code** (`server/index.js`)
   - show how simple the integration is
   - point out the 3 lines of x402 config
   - explain the endpoint just returns data normally

2. **start server**
   - run `npm run dev:server`
   - show it's just a normal Express server

3. **show client UI** (http://localhost:3000)
   - connect or create wallet
   - request faucet funds
   - show how the displayed balance updates

4. **make paid request**
   - click "Get Motivational Quote"
   - show the loading state
   - point out payment happens automatically
   - show the quote appears
   - show transaction on BaseScan

5. **explain what's happening**
   - first request got a 402 payment required from the API server
   - client created EIP-3009 payment, signed with CDP Embedded Wallet
   - client retried request with X-PAYMENT header
   - server called **CDP x402 Facilitator** to verify payment
   - **CDP Facilitator** verified signature and settled payment onchain
   - server returned paid content with transaction details

## why x402 matters

### for devs
- easily monetize APIs, adding payments with just a few lines of code
- no complex blockchain integration; facilitator handles all that
- no managing private keys or gas
- works with existing HTTP infra

### for users
- no accounts or subscriptions
- pay only for what you use
- instant access
- transparent pricing

### for agents
- programmatic payment without human intervention
- discover and pay for services autonomously
- no API keys or authentication needed

## CDP products in this demo

this demo uses **four CDP products**:

| CDP product | purpose | used in | auth details |
|-------------|---------|---------|---------------|
| **Embedded Wallet** | user auth & wallet creation | client | CDP Project ID only |
| **x402 Facilitator** | payment verification & settlement | server | CDP API Key |
| **Faucet API** | distribute testnet USDC | server | CDP API Key |
| **Token Balances API** | check USDC balances | server | CDP API Key |

CDP products work together seamlessly - the server uses one CDP API key to access the Facilitator, Faucet, and Token Balances APIs, while the client uses a CDP Project ID for Embedded Wallet creation & auth

## learn more

**x402 & CDP:**
- [CDP Facilitator docs](https://docs.cdp.coinbase.com/x402)
- [CDP Embedded Wallet docs](https://docs.cdp.coinbase.com/embedded-wallets)
- [CDP x402 Facilitator API reference](https://docs.cdp.coinbase.com/api-reference/v2/rest-api/x402-facilitator/x402-facilitator)
- [x402 GitHub repo](https://github.com/coinbase/x402)

**Octav:**
- [Octav API Documentation](https://api-docs.octav.fi)
- [Portfolio API](https://docs.octav.fi/api/endpoints/portfolio)

**technologies:**
- [Next.js Documentation](https://nextjs.org/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Shadcn Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## license

MIT