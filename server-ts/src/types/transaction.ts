export type TransactionType =
  | "ADDLIQUIDITY"
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
  | "INCOME"
  | "LIQUIDATE"
  | "MINT"
  | "OPENVAULT"
  | "RECEIVE"
  | "REMOVELIQUIDITY"
  | "REPAY"
  | "SEND"
  | "STAKE"
  | "SUPPLY"
  | "SWAP"
  | "UNSTAKE"
  | "WITHDRAW";

interface NFT {
  tokenId: string;
}

interface Info {
  uuid: string | null;
  note: string | null;
}

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

interface Chain {
  uuid: string;
  key: string;
  name: string;
  imgSmall: string;
  imgLarge: string;
}

interface Protocol {
  uuid: string;
  key: string;
  name: string;
  imgSmall: string;
  imgLarge: string;
}

interface User {
  address: string;
  uuid: string;
}

export interface Transaction {
  assetsIn: Asset[];
  assetsOut: Asset[];
  categories: string[];
  chain: Chain;
  closedPnl: string;
  confirmed: string;
  explorerUrl: string;
  blockNumber: number;
  fees: string;
  feesFiat: string;
  isRecalculated: boolean;
  nativeAssetFees: Asset;
  actions: any[];
  functionName: string;
  hash: string;
  info: Info;
  isEdited: boolean;
  editedAt: string | null;
  isManual: boolean;
  protocol?: Protocol;
  subProtocol?: Protocol;
  userProtocol?: Omit<Protocol, 'imgLarge'>;
  timestamp: string;
  type: string;
  uuid: string;
  user: User;
  value: string;
  valueFiat: string;
  requestFinanceInvoice: string;
  from: string;
  to: string;
}

export interface TransactionsResponse {
  transactions: Transaction[];
}

export interface GetTransactionsParams {
  addresses: string[];
  startDate: string;
  endDate: string;
  initialSearchText?: string;
  interactingAddresses?: string[];
  networks?: string[];
  txTypes?: TransactionType[];
  protocols?: string[];
  hideSpam?: boolean;
  sort?: 'ASC' | 'DESC';
  nftTokenId?: number;
}

export interface CombinedTransactionsResponse {
  data: Transaction[];
  dataByAddress: Record<string, Transaction[]>;
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
  errors?: Array<{
    address: string;
    error: string;
  }>;
}
