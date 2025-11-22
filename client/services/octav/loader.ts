import { useQueries, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { getPortfolio, GetPortfolioParams } from './portfolio';
import { Portfolio } from '@/types/portfolio';

const PORTFOLIO_ADDRESSES = [
  "0x3f5eddad52c665a4aa011cd11a21e1d5107d7862",
  // "0x26de4ebffbe8d3d632a292c972e3594efc2eceed",
  // "0x1a07dceefeebba3d1873e2b92bef190d2f11c3cb",
  // "0x7c780b8a63ee9b7d0f985e8a922be38a1f7b2141",
  // "0xc9c61194682a3a5f56bf9cd5b59ee63028ab6041",
  // "0x37ed06d71dffb97b6e89469ebf29552da46e52fa",
  // "0x008f84b4f7b625636dd3e75045704b077d8db445",
  // "0x4aba01fb8e1f6bfe80c56deb367f19f35df0f4ae",
  // "0xe37dd9a535c1d3c9fc33e3295b7e08bd1c42218d",
  // "0x10e13f11419165beb0f456ec8a230899e4013bbd"
];

export function useGetPortfolio(
  params: GetPortfolioParams,
  options?: Omit<UseQueryOptions<Portfolio, Error, Portfolio, (string | boolean | undefined)[]>, 'queryKey' | 'queryFn'>
) {
  return useQueries({
    queries: 
      PORTFOLIO_ADDRESSES.map(address => ({
        queryKey: ['portfolio', address, params.includeImages, params.includeExplorerUrls, params.waitForSync],
        queryFn: () => getPortfolio({ ...params, address: address }),
        ...options,
      })),
    combine: (results) => {
      return {
        data: results.reduce((acc, result) => {
          if (result.data) {
            acc[result.data.address] = result.data;
          }
          return acc;
        }, {} as Record<string, Portfolio>),
        isLoading: results.some(result => result.isLoading),
        error: results.find(result => result.error)?.error || null,
      };
    }
  });
  // return useQuery({
  //   queryKey: ['portfolio', params.address, params.includeImages, params.includeExplorerUrls, params.waitForSync],
  //   queryFn: () => getPortfolio(params),
  //   ...options,
  // });
}