// NFT related info
interface NFT {
  tokenId: string;
}

// Info with optional UUID and note
interface Info {
  uuid: string | null;
  note: string | null;
}

// Asset (can be in assetsIn, assetsOut, or nativeAssetFees)
interface Asset {
  balance: string;
  chainContract: string;
  chainKey: string;
  closedPnl: string;
  contract: string;
  costBasis: string;
  decimal: string;
  explorerUrl: string;
  from: string;
  imgSmall: string;
  imgLarge: string;
  info: Info;
  categories: string[];
  isAssetIn: boolean;
  isNativeAssetFees: boolean;
  name: string;
  nft: NFT;
  price: string;
  priceSource: string;
  symbol: string;
  to: string;
  totalCostBasis: string;
  transactionAssetUUID: string;
  uuid: string;
  value: string;
}

// Chain information
interface Chain {
  uuid: string;
  key: string;
  name: string;
  imgSmall: string;
  imgLarge: string;
}

// Protocol/SubProtocol/UserProtocol
interface Protocol {
  uuid: string;
  key: string;
  name: string;
  imgSmall: string;
  imgLarge: string;
}

// User information
interface User {
  address: string;
  uuid: string;
}

// Main transaction type
export interface Transaction {
  assetsIn: Asset[];
  assetsOut: Asset[];
  categories: string[];
  chain: Chain;
  closedPnl: string;
  confirmed: string; // e.g., "PENDING"
  explorerUrl: string;
  blockNumber: number;
  fees: string;
  feesFiat: string;
  isRecalculated: boolean;
  nativeAssetFees: Asset;
  actions: any[]; // Empty array in examples, type as needed
  functionName: string;
  hash: string;
  info: Info;
  isEdited: boolean;
  editedAt: string | null;
  isManual: boolean;
  protocol?: Protocol;
  subProtocol?: Protocol;
  userProtocol?: Omit<Protocol, 'imgLarge'>; // userProtocol doesn't have imgLarge
  timestamp: string;
  type: string; // e.g., "WITHDRAW", "DEPOSIT", "SWAP", etc.
  uuid: string;
  user: User;
  value: string;
  valueFiat: string;
  requestFinanceInvoice: string;
  from: string;
  to: string;
}

// API response
export interface TransactionsResponse {
  transactions: Transaction[];
}

// If you want to be more specific about confirmation status:
type ConfirmationStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

// Enhanced version with more specific types:
interface TransactionEnhanced extends Omit<Transaction, 'type' | 'confirmed'> {
  type: TransactionType;
  confirmed: ConfirmationStatus;
}

interface TransactionsResponseEnhanced {
  transactions: TransactionEnhanced[];
}

export type TransactionType =
  "ADDLIQUIDITY"
  | "AIRDROP"
  | "APPROVAL"
  | "BORROW"
  | "BRIDGEIN"
  | "BRIDGEOUT"
  | "CLAIM"
  | "COLLECT"
  | "CLOSEVAULT"
  | "DEPOSIT"
  | "DONATION"
  | "EXPENSE"
  | "FAILED"
  | "FOLLOW"
  | "IGNORE"
  | "INTERACTION"
  | "LEND"
  | "MINT"
  | "MULTITYPE"
  | "OPENVAULT"
  | "REPAYVAULT"
  | "REMOVELIQUIDITY"
  | "SIGN"
  | "SELFTRANSFER"
  | "SPAM"
  | "STAKE"
  | "SWAP"
  | "TRANSFERIN"
  | "TRANSFEROUT"
  | "UNDEFINED"
  | "UNSTAKE"
  | "UNWRAP"
  | "VOTE"
  | "WITHDRAW"
  | "WRAP";
