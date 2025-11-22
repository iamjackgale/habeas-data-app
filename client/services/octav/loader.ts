import { useQueries, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { getPortfolio, GetPortfolioParams } from './portfolio';
import { Portfolio } from '@/types/portfolio';
import { getHistorical, GetHistoricalParams, GetHistoricalRangeParams } from './historical';
import { Transaction, TransactionType } from '@/types/transaction';
import { getTransactions } from './transactions';

interface UseGetPortfolioParams extends Omit<GetPortfolioParams, 'address'> {
  addresses: string[];
}

export function useGetPortfolio(
  params: UseGetPortfolioParams,
  options?: Omit<UseQueryOptions<Portfolio, Error, Portfolio, (string | boolean | undefined)[]>, 'queryKey' | 'queryFn'>
) {
  return useQueries({
    queries: 
      params.addresses.map(address => ({
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
  })
}

// params for useGetHistorical should be GetHistoricalParams without address and with addresses instead
interface UseGetHistoricalParams extends Omit<GetHistoricalParams, 'address'> {
  addresses: string[];
}

export function useGetHistorical(
  params: UseGetHistoricalParams,
  options?: Omit<UseQueryOptions<Portfolio, Error, Portfolio, (string | boolean | undefined)[]>, 'queryKey' | 'queryFn'>
) {
    return useQueries({
    queries: 
      params.addresses.map(address => ({
        queryKey: ['portfolio', address, params.date],
        queryFn: () => getHistorical({ ...params, address: address }),
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
        progress: {
          loaded: results.filter(r => r.isSuccess).length,
          total: results.length,
          percentage: Math.round(
            (results.filter(r => r.isSuccess).length / results.length) * 100
          ),
        },
      };
    }
  })
}

// params for useGetHistoricalRange should be GetHistoricalRangeParams without address and with addresses instead
interface UseGetHistoricalRangeParams extends Omit<GetHistoricalRangeParams, 'address'> {
  addresses: string[];
}
export function useGetHistoricalRange(
  params: UseGetHistoricalRangeParams,
  options?: Omit<UseQueryOptions<Record<string, Portfolio>, Error>, 'queryKey' | 'queryFn'>
) {
  return useQueries({
    queries: params.dates.map(date => ({
      queryKey: ['portfolio-batch', date],
      queryFn: async () => {
        // Fetch all addresses for this date in parallel
        const results = await Promise.all(
          params.addresses.map(address =>
            getHistorical({ date, address })
          )
        );
        
        // Return as object keyed by address
        return results.reduce((acc, portfolio) => {
          acc[portfolio.address] = portfolio;
          return acc;
        }, {} as Record<string, Portfolio>);
      },
      ...options,
    })),
    combine: (results) => {
      const dataByDate = results.reduce((acc, result, index) => {
        if (result.data) {
          acc[params.dates[index]] = result.data;
        }
        return acc;
      }, {} as Record<string, Record<string, Portfolio>>);

      return {
        data: dataByDate,
        isLoading: results.some(result => result.isLoading),
        error: results.find(result => result.error)?.error || null,
        // Helpful for progress indicators
        progress: {
          loaded: results.filter(r => r.isSuccess).length,
          total: results.length,
          percentage: Math.round(
            (results.filter(r => r.isSuccess).length / results.length) * 100
          ),
        },
      };
    }
  });
}

// // Hook for date range across all addresses (most granular caching)
// export function useGetTransactionsForDateRange(
//   addresses: string[],
//   startDate: string,
//   endDate: string,
//   filters: TransactionFilters = {}
// ) {
//   const dates = generateDateRange(startDate, endDate);
//   const normalizedFilters = normalizeFilters(filters);

//   // Create a query for each address-date combination
//   return useQueries({
//     queries: addresses.flatMap(address =>
//       dates.map(date => ({
//         queryKey: [
//           'transactions-address-day',
//           address,
//           date,
//           normalizedFilters,
//         ],
//         queryFn: async () => {
//           const allTransactions: Transaction[] = [];
//           let offset = 0;
//           const limit = 250;
//           let hasMore = true;

//           const dayStart = `${date}T00:00:00Z`;
//           const dayEnd = `${date}T23:59:59Z`;

//           // Fetch all pages for this address and day
//           while (hasMore) {
//             const response = await getTransactions({
//               addresses: address, // Single address
//               limit,
//               offset,
//               startDate: dayStart,
//               endDate: dayEnd,
//               ...normalizedFilters,
//             });

//             allTransactions.push(...response.transactions);
//             hasMore = response.transactions.length === limit;
//             offset += limit;
//           }

//           return {
//             address,
//             date,
//             transactions: allTransactions,
//           };
//         },
//         staleTime: 60 * 60 * 1000,
//         // Cache past days longer
//         gcTime: date < new Date().toISOString().split('T')[0]
//           ? 24 * 60 * 60 * 1000
//           : 60 * 60 * 1000,
//       }))
//     ),
//     combine: (results) => {
//       // Group by date, then by address
//       const dataByDate: Record<string, Record<string, Transaction[]>> = {};
      
//       results.forEach(result => {
//         if (result.data) {
//           const { address, date, transactions } = result.data;
//           if (!dataByDate[date]) {
//             dataByDate[date] = {};
//           }
//           dataByDate[date][address] = transactions;
//         }
//       });

//       // Also provide flat array of all transactions
//       const allTransactions = results.flatMap(r => r.data?.transactions ?? []);

//       // Group by address across all dates
//       const dataByAddress: Record<string, Transaction[]> = {};
//       results.forEach(result => {
//         if (result.data) {
//           const { address, transactions } = result.data;
//           if (!dataByAddress[address]) {
//             dataByAddress[address] = [];
//           }
//           dataByAddress[address].push(...transactions);
//         }
//       });

//       return {
//         data: allTransactions,
//         // dataByDate,           // { '2024-01-01': { '0x123': [...], '0x456': [...] } }
//         // dataByAddress,        // { '0x123': [...], '0x456': [...] }
//         // allTransactions,      // Flat array of all transactions
//         isLoading: results.some(r => r.isLoading),
//         error: results.find(r => r.error)?.error || null,
//         progress: {
//           completed: results.filter(r => r.isSuccess).length,
//           total: results.length,
//           percentage: Math.round(
//             (results.filter(r => r.isSuccess).length / results.length) * 100
//           ),
//         },
//       };
//     },
//   });
// }

export function useGetTransactionsForDateRange(
  addresses: string[],
  startDate: string,
  endDate: string,
  filters: TransactionFilters = {}
) {
  const normalizedFilters = normalizeFilters(filters);
  const sortedAddresses = [...addresses].sort();

  return useQueries({
    queries: addresses.map(address => ({
      queryKey: [
        'transactions-address-range',
        address,
        startDate,
        endDate,
        normalizedFilters,
      ],
      queryFn: async () => {
        const allTransactions: Transaction[] = [];
        let offset = 0;
        const limit = 250; // Use max limit to minimize requests
        let hasMore = true;

        // ONE request per address for ENTIRE date range (not per-day!)
        while (hasMore) {
          const response = await getTransactions({
            addresses: address,
            limit,
            offset,
            startDate: `${startDate}T00:00:00Z`,
            endDate: `${endDate}T23:59:59Z`,
            ...normalizedFilters,
          });

          allTransactions.push(...response.transactions);
          hasMore = response.transactions.length === limit;
          offset += 1;
        }

        return { address, transactions: allTransactions };
      },
      staleTime: 60 * 60 * 1000, // 1 hour
      gcTime: 24 * 60 * 60 * 1000, // Cache for 24 hours
    })),
    combine: (results) => {
      const dataByAddress: Record<string, Transaction[]> = {};
      results.forEach(result => {
        if (result.data) {
          dataByAddress[result.data.address] = result.data.transactions;
        }
      });

      const allTransactions = results.flatMap(r => r.data?.transactions ?? []);

      return {
        data: allTransactions,
        dataByAddress,
        allTransactions,
        isLoading: results.some(r => r.isLoading),
        error: results.find(r => r.error)?.error || null,
        progress: {
          completed: results.filter(r => r.isSuccess).length,
          total: results.length,
          percentage: Math.round(
            (results.filter(r => r.isSuccess).length / results.length) * 100
          ),
        },
      };
    },
  });
}

interface TransactionFilters {
  initialSearchText?: string;
  interactingAddresses?: string | string[];
  networks?: string | string[];
  txTypes?: string | string[];
  protocols?: string | string[];
  hideSpam?: boolean;
  sort?: 'DESC' | 'ASC';
  tokenId?: string;
}

interface NormalizedFilters {
  initialSearchText?: string;
  interactingAddresses?: string[];
  networks?: string[];
  txTypes?: TransactionType[];
  protocols?: string[];
  hideSpam?: boolean;
  sort?: 'DESC' | 'ASC';
  tokenId?: string;
}

function normalizeFilters(filters: TransactionFilters): NormalizedFilters {
  return {
    initialSearchText: filters.initialSearchText,
    interactingAddresses: filters.interactingAddresses
      ? (Array.isArray(filters.interactingAddresses)
        ? filters.interactingAddresses
        : filters.interactingAddresses.split(','))
      : undefined,
    networks: filters.networks
      ? (Array.isArray(filters.networks)
        ? filters.networks
        : filters.networks.split(','))
      : undefined,
    txTypes: filters.txTypes
      ? (Array.isArray(filters.txTypes)
        ? filters.txTypes as TransactionType[]
        : filters.txTypes.split(',') as TransactionType[])
      : undefined,
    protocols: filters.protocols
      ? (Array.isArray(filters.protocols)
        ? filters.protocols
        : filters.protocols.split(','))
      : undefined,
    hideSpam: filters.hideSpam,
    sort: filters.sort,
    tokenId: filters.tokenId,
  };
}

function generateDateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const current = new Date(start);
  const endDate = new Date(end);

  while (current <= endDate) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}