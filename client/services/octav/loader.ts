import { useQueries, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { getPortfolio, GetPortfolioParams, CombinedPortfolioResponse } from './portfolio';
import { TPortfolio } from '@/types/portfolio';
import { getHistorical, getHistoricalRange, GetHistoricalParams, GetHistoricalRangeParams, CombinedHistoricalResponse, CombinedHistoricalRangeResponse } from './historical';
import { Transaction, TransactionType } from '@/types/transaction';
import { getTransactions, GetTransactionsParams, CombinedTransactionsResponse } from './transactions';

interface UseGetPortfolioParams extends GetPortfolioParams {}

export function useGetPortfolio(
  params: UseGetPortfolioParams,
  options?: Omit<UseQueryOptions<Record<string, TPortfolio>, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['portfolio', params.addresses.join(','), params.includeImages, params.includeExplorerUrls, params.waitForSync],
    queryFn: () => getPortfolio(params),
    ...options,
  });
}

interface UseGetHistoricalParams extends GetHistoricalParams {}

export function useGetHistorical(
  params: UseGetHistoricalParams,
  options?: Omit<UseQueryOptions<Record<string, TPortfolio>, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['historical', params.addresses.join(','), params.date],
    queryFn: () => getHistorical(params),
    ...options,
  });
}

interface UseGetHistoricalRangeParams extends GetHistoricalRangeParams {}

export function useGetHistoricalRange(
  params: UseGetHistoricalRangeParams,
  options?: Omit<UseQueryOptions<CombinedHistoricalRangeResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['historical-range', params.addresses.join(','), params.dates.join(',')],
    queryFn: () => getHistoricalRange(params),
    ...options,
  });
}

// Hook for date range across all addresses
export function useGetTransactionsForDateRange(
  addresses: string[],
  startDate: string,
  endDate: string
) {
  return useQuery({
    queryKey: ['transactions-range', addresses.join(','), startDate, endDate],
    queryFn: async () => {
      const response = await getTransactions({
        addresses,
        startDate,
        endDate,
      });
      return response.data;
    },
    staleTime: 60 * 60 * 1000,
  });
}

export function useGetTransactions(
  params: GetTransactionsParams,
  options?: Omit<UseQueryOptions<CombinedTransactionsResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['transactions', params.addresses.join(','), params.startDate, params.endDate, params],
    queryFn: () => getTransactions(params),
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // Cache for 24 hours
    ...options,
  });
}