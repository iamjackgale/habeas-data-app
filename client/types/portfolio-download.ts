/**
 * Simplified Portfolio type for download/export
 * This is a cleaner, more readable version of the Portfolio type
 * that contains only essential data for user downloads
 */
export interface PortfolioDownload {
  address: string;
  lastUpdated: string; // Timestamp in milliseconds since epoch
  networth: string;
  assetByProtocols: Record<string, AssetByProtocolDownload>;
}

/**
 * Asset data organized by protocol (simplified)
 */
export interface AssetByProtocolDownload {
  key: string;
  value: string;
  totalCostBasis: string | 'N/A';
  totalClosedPnl: string | 'N/A';
  totalOpenPnl: string | 'N/A';
  name?: string; // Optional, not always present
  chains: Record<string, ChainDownload>;
}

/**
 * Chain data within a protocol (simplified)
 */
export interface ChainDownload {
  key: string;
  value: string;
  name?: string; // Optional, not always present
  protocolPositions: Record<string, ProtocolPositionDownload>;
}

/**
 * Protocol position data (simplified)
 */
export interface ProtocolPositionDownload {
  name: string;
  totalValue: string;
  assets: AssetDownload[];
  protocolPositions: ProtocolPositionDownload[]; // Recursive structure for nested positions
}

/**
 * Asset information (simplified)
 */
export interface AssetDownload {
  balance: string;
  chainContract: string;
  chainKey: string;
  contract: string;
  decimal: string;
  name: string;
  price: string;
  symbol: string;
  value: string;
}

import type { Portfolio, AssetByProtocol, Chain, ProtocolPosition, Asset } from './portfolio';

/**
 * Convert a full Portfolio to a simplified PortfolioDownload
 * This function strips out all optional/display-only fields and keeps only essential data
 * 
 * @param portfolio - The full Portfolio object from the API
 * @returns A simplified PortfolioDownload object ready for user download
 */
export function convertToPortfolioDownload(portfolio: Portfolio): PortfolioDownload {
  const assetByProtocols: Record<string, AssetByProtocolDownload> = {};
  
  // Convert each protocol
  for (const [protocolKey, protocol] of Object.entries(portfolio.assetByProtocols)) {
    assetByProtocols[protocolKey] = convertAssetByProtocol(protocol);
  }
  
  return {
    address: portfolio.address,
    lastUpdated: portfolio.lastUpdated,
    networth: portfolio.networth,
    assetByProtocols,
  };
}

/**
 * Convert AssetByProtocol to AssetByProtocolDownload
 */
function convertAssetByProtocol(protocol: AssetByProtocol): AssetByProtocolDownload {
  const chains: Record<string, ChainDownload> = {};
  
  // Convert each chain
  for (const [chainKey, chain] of Object.entries(protocol.chains)) {
    chains[chainKey] = convertChain(chain);
  }
  
  return {
    key: protocol.key,
    value: protocol.value,
    totalCostBasis: protocol.totalCostBasis,
    totalClosedPnl: protocol.totalClosedPnl,
    totalOpenPnl: protocol.totalOpenPnl,
    ...(protocol.name && { name: protocol.name }), // Only include name if it exists
    chains,
  };
}

/**
 * Convert Chain to ChainDownload
 */
function convertChain(chain: Chain): ChainDownload {
  const protocolPositions: Record<string, ProtocolPositionDownload> = {};
  
  // Convert each protocol position
  for (const [positionKey, position] of Object.entries(chain.protocolPositions || {})) {
    protocolPositions[positionKey] = convertProtocolPosition(position);
  }
  
  return {
    key: chain.key,
    value: chain.value,
    ...(chain.name && { name: chain.name }), // Only include name if it exists
    protocolPositions,
  };
}

/**
 * Convert ProtocolPosition to ProtocolPositionDownload (recursive)
 */
function convertProtocolPosition(position: ProtocolPosition): ProtocolPositionDownload {
  // Convert assets
  const assets: AssetDownload[] = (position.assets || []).map(asset => convertAsset(asset));
  
  // Recursively convert nested protocol positions
  const nestedPositions: ProtocolPositionDownload[] = (position.protocolPositions || [])
    .map(nested => convertProtocolPosition(nested));
  
  return {
    name: position.name,
    totalValue: position.totalValue,
    assets,
    protocolPositions: nestedPositions,
  };
}

/**
 * Convert Asset to AssetDownload
 */
function convertAsset(asset: Asset): AssetDownload {
  return {
    balance: asset.balance,
    chainContract: asset.chainContract,
    chainKey: asset.chainKey,
    contract: asset.contract,
    decimal: asset.decimal,
    name: asset.name,
    price: asset.price,
    symbol: asset.symbol,
    value: asset.value,
  };
}

