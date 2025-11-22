import { Portfolio } from '@/types/portfolio';

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

