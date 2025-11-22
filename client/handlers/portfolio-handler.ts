import { Portfolio, ProtocolPosition, Asset } from '@/types/portfolio';

/**
 * Get protocol value dictionary from portfolio data
 * @param portfolioData - Portfolio data object
 * @returns Record mapping protocol keys to their values
 */
export function getProtocolValueDictionary(portfolioData: Portfolio | undefined): Record<string, string> {
  if (!portfolioData?.assetByProtocols) {
    return {};
  }
  const protocolDictionary: Record<string, string> = {};
  Object.values(portfolioData.assetByProtocols).forEach((protocol) => {
    protocolDictionary[protocol.key] = protocol.value;
  });
  return protocolDictionary;
}

/**
 * Extract all assets from a protocol position (handles nested positions recursively)
 * @param position - Protocol position object
 * @returns Array of all assets found in this position
 */
function extractAssetsFromPosition(position: ProtocolPosition): Asset[] {
  const allAssets: Asset[] = [];

  // Collect all asset arrays from the position
  const assetArrays = [
    position.assets,
    position.supplyAssets,
    position.rewardAssets,
    position.dexAssets,
    position.quoteAssets,
    position.marginAssets,
    position.baseAssets,
  ].filter((arr): arr is Asset[] => Array.isArray(arr) && arr.length > 0);

  // Flatten all asset arrays
  assetArrays.forEach((assetArray) => {
    allAssets.push(...assetArray);
  });

  // Handle recursive nested protocol positions
  if (position.protocolPositions && Array.isArray(position.protocolPositions)) {
    position.protocolPositions.forEach((nestedPosition) => {
      allAssets.push(...extractAssetsFromPosition(nestedPosition));
    });
  }

  return allAssets;
}

/**
 * Get individual asset value dictionary from portfolio data
 * Aggregates values for the same asset across all protocols, chains, and positions
 * @param portfolioData - Portfolio data object
 * @param useSymbol - Whether to use asset symbol (default) or name as key (default: true)
 * @returns Record mapping asset symbol/name to their aggregated values
 */
export function getAssetValueDictionary(
  portfolioData: Portfolio | undefined,
  useSymbol: boolean = true
): Record<string, string> {
  if (!portfolioData?.assetByProtocols) {
    return {};
  }

  const assetDictionary: Record<string, number> = {};

  // Traverse through all protocols
  Object.values(portfolioData.assetByProtocols).forEach((protocol) => {
    // Traverse through all chains in the protocol
    if (protocol.chains) {
      Object.values(protocol.chains).forEach((chain) => {
        // Traverse through all protocol positions in the chain
        if (chain.protocolPositions) {
          Object.values(chain.protocolPositions).forEach((position) => {
            // Extract all assets from this position (handles nested positions)
            const assets = extractAssetsFromPosition(position);

            // Aggregate asset values
            assets.forEach((asset) => {
              const key = useSymbol ? asset.symbol : asset.name;
              const value = parseFloat(asset.value) || 0;

              if (assetDictionary[key]) {
                assetDictionary[key] += value;
              } else {
                assetDictionary[key] = value;
              }
            });
          });
        }
      });
    }
  });

  // Convert to string dictionary (matching getProtocolValueDictionary format)
  const result: Record<string, string> = {};
  Object.entries(assetDictionary).forEach(([key, value]) => {
    result[key] = value.toString();
  });

  return result;
}

