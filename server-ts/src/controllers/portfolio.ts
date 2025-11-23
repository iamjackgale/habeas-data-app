import { Request, Response } from 'express';
import { Portfolio, GetPortfolioParams, CombinedPortfolioResponse } from '../types/portfolio.js';
import { getCachedData, setCachedData } from '../utils/cache.js';

const OCTAV_API_BASE_URL = 'https://api.octav.fi/v1';
const CACHE_TTL = 24 * 60 * 1000; // 5 minutes for portfolio data

/**
 * Fetch portfolio for a single address from Octav API
 */
async function fetchSinglePortfolio(
  address: string,
  params: Omit<GetPortfolioParams, 'addresses'>,
  apiKey: string
): Promise<Portfolio> {
  const queryParams = new URLSearchParams({ addresses: address });

  if (params.includeImages !== undefined) {
    queryParams.append('includeImages', String(params.includeImages));
  }
  if (params.includeExplorerUrls !== undefined) {
    queryParams.append('includeExplorerUrls', String(params.includeExplorerUrls));
  }
  if (params.waitForSync !== undefined) {
    queryParams.append('waitForSync', String(params.waitForSync));
  }
  if (params.includeNFTs !== undefined) {
    queryParams.append('includeNFTs', String(params.includeNFTs));
  }

  const response = await fetch(`${OCTAV_API_BASE_URL}/portfolio?${queryParams.toString()}`, {
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

  const data = await response.json() as Portfolio[];
  return data[0];
}

/**
 * Get combined portfolio data for multiple addresses
 * Handles making individual requests for each address and combining the results
 */
export async function getPortfolio(req: Request, res: Response): Promise<void> {
  try {
    // Create cache key from full URL with query params (exclude waitForSync from cache key)
    const url = new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`);
    url.searchParams.delete('waitForSync'); // Don't include waitForSync in cache key
    const cacheUrl = url.toString();
    
    // Check cache first (skip if waitForSync is true and we want fresh data)
    if (req.query.waitForSync !== 'true') {
      const cachedResponse = await getCachedData<CombinedPortfolioResponse>(cacheUrl);
      if (cachedResponse) {
        console.log('Serving portfolio from cache');
        res.json(cachedResponse);
        return;
      }
    } else {
      console.log('Skipping cache due to waitForSync=true');
    }

    const apiKey = process.env.OCTAV_API_KEY;

    if (!apiKey) {
      res.status(500).json({ error: 'OCTAV_API_KEY environment variable is not set' });
      return;
    }

    // Parse addresses from query parameter (comma-separated string or array)
    const addressesParam = req.query.addresses as string | string[] | undefined;
    
    if (!addressesParam) {
      res.status(400).json({ error: 'addresses parameter is required' });
      return;
    }

    const addresses = Array.isArray(addressesParam)
      ? addressesParam
      : addressesParam.split(',').map(a => a.trim());

    if (addresses.length === 0) {
      res.status(400).json({ error: 'At least one address is required' });
      return;
    }

    // Parse optional parameters
    const params: Omit<GetPortfolioParams, 'addresses'> = {
      includeImages: req.query.includeImages === 'true',
      includeExplorerUrls: req.query.includeExplorerUrls === 'true',
      waitForSync: req.query.waitForSync === 'true',
      includeNFTs: req.query.includeNFTs === 'true',
    };

    // Fetch portfolios for all addresses in parallel
    const portfolioPromises = addresses.map(address =>
      fetchSinglePortfolio(address, params, apiKey)
        .then(portfolio => ({ success: true as const, portfolio }))
        .catch(error => ({ success: false as const, error, address }))
    );

    const results = await Promise.all(portfolioPromises);

    // Separate successful and failed results
    const successfulResults = results.filter(r => r.success);
    const failedResults = results.filter(r => !r.success);

    // Build the combined response
    const data: Record<string, Portfolio> = {};
    successfulResults.forEach(result => {
      if (result.success) {
        data[result.portfolio.address] = result.portfolio;
      }
    });

    const response: CombinedPortfolioResponse = {
      data,
      progress: {
        loaded: successfulResults.length,
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
      });

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
    console.error('Error fetching portfolio:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
}
