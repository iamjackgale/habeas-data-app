/**
 * Main Portfolio response from Octav API
 * @see https://api-docs.octav.fi/api-models/portfolio
 */
export interface Portfolio {
  address: string;
  cashBalance: string;
  closedPnl: string | 'N/A';
  dailyIncome: string;
  dailyExpense: string;
  fees: string;
  feesFiat: string;
  lastUpdated: string; // Timestamp in milliseconds since epoch
  openPnl: string | 'N/A';
  networth: string;
  totalCostBasis: string | 'N/A';
  assetByProtocols: Record<string, AssetByProtocol>;
  chains: Record<string, ChainSummary>;
  nftsChains?: Record<string, ChainSummary>;
  nftsByCollection?: Record<string, NFTCollection>;
}

export interface AssetByProtocol {
  name: string;
  key: string;
  value: string;
  totalCostBasis: string | 'N/A';
  totalClosedPnl: string | 'N/A';
  totalOpenPnl: string | 'N/A';
  imgSmall?: string;
  imgLarge?: string;
  chains: Record<string, Chain>;
}

export interface Chain {
  name: string;
  key: string;
  value: string;
  totalCostBasis: string | 'N/A';
  totalClosedPnl: string | 'N/A';
  totalOpenPnl: string | 'N/A';
  protocolPositions: Record<string, ProtocolPosition>;
}

export interface ProtocolPosition {
  name: string;
  totalOpenPnl: string | 'N/A';
  totalCostBasis: string | 'N/A';
  totalClosedPnl?: string | 'N/A';
  totalValue: string;
  unlockAt: string;
  imgSmall?: string;
  imgLarge?: string;
  explorerUrl?: string;
  assets?: Asset[];
  supplyAssets?: Asset[];
  borrowAssets?: Asset[];
  rewardAssets?: Asset[];
  dexAssets?: Asset[];
  quoteAssets?: Asset[];
  marginAssets?: Asset[];
  baseAssets?: Asset[];
  protocolPositions?: ProtocolPosition[];
  healthRate?: string;
  vaultAddress?: string;
  poolAddress?: string;
}

export interface Asset {
  balance: string;
  chainContract: string;
  chainKey: string;
  contract: string;
  decimal: string;
  name: string;
  openPnl: string | 'N/A';
  price: string;
  symbol: string;
  totalCostBasis: string | 'N/A';
  value: string;
  imgSmall?: string;
  imgLarge?: string;
  explorerUrl?: string;
}

export interface ChainSummary {
  name: string;
  key: string;
  value: string;
  totalCostBasis: string | 'N/A';
  totalClosedPnl: string | 'N/A';
  totalOpenPnl: string | 'N/A';
  imgSmall?: string;
  imgLarge?: string;
}

export interface NFTCollection {
  name: string;
  key: string;
  totalValue: string;
  imgSmall?: string;
  imgLarge?: string;
}

export interface GetPortfolioParams {
  addresses: string[];
  includeImages?: boolean;
  includeExplorerUrls?: boolean;
  waitForSync?: boolean;
  includeNFTs?: boolean;
}

export interface CombinedPortfolioResponse {
  data: Record<string, Portfolio>;
  progress: {
    loaded: number;
    total: number;
    percentage: number;
  };
}
