import { Request, Response } from 'express';
import { Transaction, TransactionsResponse, GetTransactionsParams, CombinedTransactionsResponse, TransactionType } from '../types/transaction.js';
import { getCachedData, setCachedData } from '../utils/cache.js';

const OCTAV_API_BASE_URL = 'https://api.octav.fi/v1';
const PAGE_SIZE = 250;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours for transaction data (historical data doesn't change)

/**
 * Fetch all transactions for a single address within a date range
 * Handles pagination automatically
 */
async function fetchAllTransactionsForAddress(
  address: string,
  params: Omit<GetTransactionsParams, 'addresses'>,
  apiKey: string
): Promise<Transaction[]> {
  const allTransactions: Transaction[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const queryParams = new URLSearchParams({
      addresses: address,
      limit: String(PAGE_SIZE),
      offset: String(offset * PAGE_SIZE),
    });

    if (params.initialSearchText) {
      queryParams.append('searchText', params.initialSearchText);
    }

    if (params.interactingAddresses && params.interactingAddresses.length > 0) {
      queryParams.append('interactingAddresses', params.interactingAddresses.join(','));
    }

    if (params.networks && params.networks.length > 0) {
      queryParams.append('networks', params.networks.join(','));
    }

    if (params.txTypes && params.txTypes.length > 0) {
      queryParams.append('txTypes', params.txTypes.join(','));
    }

    if (params.protocols && params.protocols.length > 0) {
      queryParams.append('protocols', params.protocols.join(','));
    }

    if (params.hideSpam !== undefined) {
      queryParams.append('hideSpam', String(params.hideSpam));
    }

    if (params.sort) {
      queryParams.append('sort', params.sort);
    }

    if (params.startDate) {
      const isoStartDate = new Date(params.startDate).toISOString();
      queryParams.append('startDate', isoStartDate);
    }

    if (params.endDate) {
      const isoEndDate = new Date(params.endDate).toISOString();
      queryParams.append('endDate', isoEndDate);
    }

    if (params.nftTokenId !== undefined) {
      queryParams.append('tokenId', String(params.nftTokenId));
    }

    const response = await fetch(`${OCTAV_API_BASE_URL}/transactions?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { message?: string; error?: string };
      throw new Error(
        errorData.message || errorData.error || `Octav API returned status ${response.status}`
      );
    }

    const data = await response.json() as TransactionsResponse;
    allTransactions.push(...data.transactions);
    
    hasMore = data.transactions.length === PAGE_SIZE;
    offset += 1;
  }

  return allTransactions;
}

/**
 * Get transactions for multiple addresses within a date range
 * Handles pagination and combines results by address
 */
export async function getTransactions(req: Request, res: Response): Promise<void> {
  try {
    // Create cache key from full URL with query params
    const cacheUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    
    // Check cache first
    const cachedResponse = await getCachedData<CombinedTransactionsResponse>(cacheUrl);
    if (cachedResponse) {
      console.log('Serving transactions from cache');
      res.json(cachedResponse);
      return;
    }

    const apiKey = process.env.OCTAV_API_KEY;

    if (!apiKey) {
      res.status(500).json({ error: 'OCTAV_API_KEY environment variable is not set' });
      return;
    }

    console.log('Cache miss - fetching transactions from Octav API');

    // Parse addresses from query parameter
    const addressesParam = req.query.addresses as string | string[] | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    if (!addressesParam) {
      res.status(400).json({ error: 'addresses parameter is required' });
      return;
    }

    if (!startDate || isNaN(Date.parse(startDate))) {
      res.status(400).json({ error: 'startDate parameter is required and must be a valid date string' });
      return;
    }

    if (!endDate || isNaN(Date.parse(endDate))) {
      res.status(400).json({ error: 'endDate parameter is required and must be a valid date string' });
      return;
    }

    const addresses = Array.isArray(addressesParam)
      ? addressesParam
      : addressesParam.split(',').map(a => a.trim());

    if (addresses.length === 0) {
      res.status(400).json({ error: 'At least one address is required' });
      return;
    }

    // Parse optional filter parameters
    const params: Omit<GetTransactionsParams, 'addresses'> = {
      startDate,
      endDate,
      initialSearchText: req.query.searchText as string | undefined,
      interactingAddresses: req.query.interactingAddresses 
        ? (req.query.interactingAddresses as string).split(',')
        : undefined,
      networks: req.query.networks
        ? (req.query.networks as string).split(',')
        : undefined,
      txTypes: req.query.txTypes
        ? (req.query.txTypes as string).split(',') as TransactionType[]
        : undefined,
      protocols: req.query.protocols
        ? (req.query.protocols as string).split(',')
        : undefined,
      hideSpam: req.query.hideSpam === 'true',
      sort: req.query.sort as 'ASC' | 'DESC' | undefined,
      nftTokenId: req.query.tokenId ? Number(req.query.tokenId) : undefined,
    };

    // Fetch transactions for all addresses in parallel
    const transactionPromises = addresses.map(address =>
      fetchAllTransactionsForAddress(address, params, apiKey)
        .then(transactions => ({ success: true as const, address, transactions }))
        .catch(error => ({ success: false as const, error, address }))
    );

    const results = await Promise.all(transactionPromises);

    // Separate successful and failed results
    const successfulResults = results.filter(r => r.success);
    const failedResults = results.filter(r => !r.success);

    // Build the combined response
    const dataByAddress: Record<string, Transaction[]> = {};
    const allTransactions: Transaction[] = [];

    successfulResults.forEach(result => {
      if (result.success) {
        dataByAddress[result.address] = result.transactions;
        allTransactions.push(...result.transactions);
      }
    });

    const response: CombinedTransactionsResponse = {
      data: allTransactions,
      dataByAddress,
      progress: {
        completed: successfulResults.length,
        total: addresses.length,
        percentage: Math.round((successfulResults.length / addresses.length) * 100),
      },
    };

    // If some requests failed, include error information
    if (failedResults.length > 0) {
      const errors = failedResults.map(r => {
        if (!r.success) {
          return {
            address: r.address,
            error: r.error instanceof Error ? r.error.message : 'Unknown error',
          };
        }
      }).filter(Boolean) as Array<{ address: string; error: string }>;

      const errorResponse = {
        ...response,
        errors,
      };

      // Cache partial success responses too
      await setCachedData(cacheUrl, errorResponse, CACHE_TTL);

      res.status(207).json(errorResponse);
      return;
    }

    // Cache the successful response
    await setCachedData(cacheUrl, response, CACHE_TTL);

    res.json(response);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
}
