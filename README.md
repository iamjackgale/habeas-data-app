# Habeas Data Application

![Cover Image](./cover-impage.png)

this is a simple demo of the x402 payment protocol, showcasing how easy it is to add crypto payments to any API and how seamlessly clients can pay for access

> **Note:** This repository began as a fork of [x402-demo](https://github.com/Jnix2007/x402-demo) by Jnix2007, extended with additional features including portfolio integration via the Octav API.

## Tech Stack

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

## Quickstart

### Pre-requisites

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

## Project Structure

[ASK TO WRITE NEW STRUCTURE CHART]

## Octav API Integrations

the client includes integration with the [Octav Portfolio API](https://docs.octav.fi/api/endpoints/portfolio) to fetch and display portfolio data for blockchain addresses.

[ADD TRANSACTIONS AND OTHER ENPOINTS]

## Widgets

React query hooks

check out `/components/widgets/portfolio.tsx` for a complete example of how to use the portfolio API in your components.

## Octav Products In This Demo

- [Portfolio API](https://docs.octav.fi/api/endpoints/portfolio)
- [API Access & Pricing](https://api-docs.octav.fi/getting-started/api-access)
- [Get an API Key](https://data.octav.fi)
- [Supported Chains](https://docs.octav.fi/api/reference/supported-chains)
- [Protocol Types](https://docs.octav.fi/api/reference/protocol-types)

## CDP Products In This Demo

This project uses **four CDP products**:

| CDP product | purpose | used in | auth details |
|-------------|---------|---------|---------------|
| **Embedded Wallet** | user auth & wallet creation | client | CDP Project ID only |
| **x402 Facilitator** | payment verification & settlement | server | CDP API Key |
| **Faucet API** | distribute testnet USDC | server | CDP API Key |
| **Token Balances API** | check USDC balances | server | CDP API Key |

CDP products work together seamlessly - the server uses one CDP API key to access the Facilitator, Faucet, and Token Balances APIs, while the client uses a CDP Project ID for Embedded Wallet creation & auth

## Learn More

**x402 & CDP:**
- [CDP Facilitator docs](https://docs.cdp.coinbase.com/x402)
- [CDP Embedded Wallet docs](https://docs.cdp.coinbase.com/embedded-wallets)
- [CDP x402 Facilitator API reference](https://docs.cdp.coinbase.com/api-reference/v2/rest-api/x402-facilitator/x402-facilitator)
- [x402 GitHub repo](https://github.com/coinbase/x402)

**Octav:**
- [Octav API Documentation](https://api-docs.octav.fi)
- [Portfolio API](https://docs.octav.fi/api/endpoints/portfolio)

**Technologies:**
- [Next.js Documentation](https://nextjs.org/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Shadcn Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)