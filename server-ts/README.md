# TypeScript x402 Demo Server

A TypeScript Express server with x402 payment integration.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

3. Run the development server:
```bash
npm run dev
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run production server

## Environment Variables

- `PORT` - Server port (default: 3001)
- `RECEIVER_WALLET` - Wallet address for receiving payments
- `CDP_API_KEY_ID` - Coinbase Developer Platform API key ID
- `CDP_API_KEY_SECRET` - Coinbase Developer Platform API key secret
