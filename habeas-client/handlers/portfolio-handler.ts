import { TPortfolio, ProtocolPosition, Asset } from '@/types/portfolio';

/**
 * Get protocol value dictionary from portfolio data
 * @param portfolioData - Portfolio data object
 * @returns Record mapping protocol keys to their values
 */
export function getProtocolValueDictionary(portfolioData: TPortfolio | undefined): Record<string, string> {
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
  portfolioData: TPortfolio | undefined,
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

/**
 * Compare multiple protocol value dictionaries and create a comparison dictionary
 * @param dictionaries - Array of protocol dictionaries (output of getProtocolValueDictionary)
 * @returns Record mapping protocol keys to arrays of values from each dictionary
 */
export function getComparisonProtocolValueDictionary(
  ...dictionaries: Record<string, string>[]
): Record<string, number[]> {
  const comparisonDict: Record<string, number[]> = {};
  
  // Collect all unique keys from all dictionaries
  const allKeys = new Set<string>();
  dictionaries.forEach((dict) => {
    Object.keys(dict).forEach((key) => allKeys.add(key));
  });
  
  // For each key, create an array with values from each dictionary (0 for missing keys)
  allKeys.forEach((key) => {
    const values = dictionaries.map((dict) => {
      return parseFloat(dict[key] || '0') || 0;
    });
    comparisonDict[key] = values;
  });
  
  return comparisonDict;
}

/**
 * Compare multiple asset value dictionaries and create a comparison dictionary
 * @param dictionaries - Array of asset dictionaries (output of getAssetValueDictionary)
 * @returns Record mapping asset keys to arrays of values from each dictionary
 */
export function getComparisonAssetValueDictionary(
  ...dictionaries: Record<string, string>[]
): Record<string, number[]> {
  const comparisonDict: Record<string, number[]> = {};
  
  // Collect all unique keys from all dictionaries
  const allKeys = new Set<string>();
  dictionaries.forEach((dict) => {
    Object.keys(dict).forEach((key) => allKeys.add(key));
  });
  
  // For each key, create an array with values from each dictionary (0 for missing keys)
  allKeys.forEach((key) => {
    const values = dictionaries.map((dict) => {
      return parseFloat(dict[key] || '0') || 0;
    });
    comparisonDict[key] = values;
  });
  
  return comparisonDict;
}

/**
 * Create a dictionary mapping dates to net worth values from portfolio data
 * @param dates - Array of date strings (e.g., ['2025-01-01', '2025-06-06'])
 * @param portfolios - Array of Portfolio objects corresponding to each date
 * @returns Record mapping date keys to net worth values as numbers
 */
export function getComparisonNetWorthDictionary(
  dates: string[],
  portfolios: (TPortfolio | undefined)[]
): Record<string, number> {
  const netWorthDict: Record<string, number> = {};
  
  // Ensure dates and portfolios arrays have the same length
  if (dates.length !== portfolios.length) {
    console.warn(`getComparisonNetWorthDictionary: dates (${dates.length}) and portfolios (${portfolios.length}) arrays have different lengths`);
  }
  
  // Map each date to its corresponding net worth
  dates.forEach((date, index) => {
    const portfolio = portfolios[index];
    if (portfolio) {
      const networth = parseFloat(portfolio.networth || '0') || 0;
      netWorthDict[date] = networth;
    } else {
      // If portfolio is undefined, set net worth to 0
      netWorthDict[date] = 0;
    }
  });
  
  return netWorthDict;
}
