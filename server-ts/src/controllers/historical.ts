import { Request, Response } from 'express';
import { Portfolio } from '../types/portfolio.js';
import { getCachedData, setCachedData } from '../utils/cache.js';

const OCTAV_API_BASE_URL = 'https://api.octav.fi/v1';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours for historical data (it doesn't change)

interface GetHistoricalParams {
  addresses: string[];
  date: string;
}

interface GetHistoricalRangeParams {
  addresses: string[];
  dates: string[];
}

interface CombinedHistoricalResponse {
  data: Record<string, Portfolio>;
  errors?: Array<{
    address: string;
    error: string;
  }>;
}

interface CombinedHistoricalRangeResponse {
  data: Record<string, Record<string, Portfolio>>;
  errors?: Array<{
    date: string;
    address?: string;
    error: string;
  }>;
}

/**
 * Fetch historical portfolio for a single address from Octav API
 */
async function fetchSingleHistorical(
  address: string,
  date: string,
  apiKey: string
): Promise<Portfolio> {
  const formattedDate = new Date(date).toISOString().split('T')[0];
  const queryParams = new URLSearchParams({
    addresses: address,
    date: formattedDate,
  });

  const response = await fetch(`${OCTAV_API_BASE_URL}/historical?${queryParams.toString()}`, {
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
 * Get historical portfolio data for multiple addresses at a specific date
 */
export async function getHistorical(req: Request, res: Response): Promise<void> {
  try {
    // Create cache key from full URL with query params
    const cacheUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    
    // Check cache first
    const cachedResponse = await getCachedData<CombinedHistoricalResponse>(cacheUrl);
    if (cachedResponse) {
      console.log('Serving historical from cache', cacheUrl);
      res.json(cachedResponse);
      return;
    }
    console.log('Cache historical miss for', cacheUrl);

    const apiKey = process.env.OCTAV_API_KEY;

    if (!apiKey) {
      res.status(500).json({ error: 'OCTAV_API_KEY environment variable is not set' });
      return;
    }

    // Parse addresses from query parameter
    const addressesParam = req.query.addresses as string | string[] | undefined;
    const date = req.query.date as string | undefined;

    if (!addressesParam) {
      res.status(400).json({ error: 'addresses parameter is required' });
      return;
    }

    if (!date || isNaN(Date.parse(date))) {
      res.status(400).json({ error: 'date parameter is required and must be a valid date string' });
      return;
    }

    const addresses = Array.isArray(addressesParam)
      ? addressesParam
      : addressesParam.split(',').map(a => a.trim());

    if (addresses.length === 0) {
      res.status(400).json({ error: 'At least one address is required' });
      return;
    }

    // Fetch historical portfolios for all addresses in parallel
    const historicalPromises = addresses.map(address =>
      fetchSingleHistorical(address, date, apiKey)
        .then(portfolio => ({ success: true as const, portfolio }))
        .catch(error => ({ success: false as const, error, address }))
    );

    const results = await Promise.all(historicalPromises);

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

    const response: CombinedHistoricalResponse = {
      data,
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
    console.error('Error fetching historical portfolio:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
}

/**
 * Get historical portfolio data for multiple addresses across multiple dates
 */
export async function getHistoricalRange(req: Request, res: Response): Promise<void> {
  try {
    // Create cache key from full URL with query params
    const cacheUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    
    // Check cache first
    const cachedResponse = await getCachedData<CombinedHistoricalRangeResponse>(cacheUrl);
    if (cachedResponse) {
      console.log('Cache hit for', cacheUrl);
      res.json(cachedResponse);
      return;
    }
    console.log('Cache miss for', cacheUrl);

    const apiKey = process.env.OCTAV_API_KEY;

    if (!apiKey) {
      res.status(500).json({ error: 'OCTAV_API_KEY environment variable is not set' });
      return;
    }

    // Parse addresses and dates from query parameters
    const addressesParam = req.query.addresses as string | string[] | undefined;
    const datesParam = req.query.dates as string | string[] | undefined;

    if (!addressesParam) {
      res.status(400).json({ error: 'addresses parameter is required' });
      return;
    }

    if (!datesParam) {
      res.status(400).json({ error: 'dates parameter is required' });
      return;
    }

    const addresses = Array.isArray(addressesParam)
      ? addressesParam
      : addressesParam.split(',').map(a => a.trim());

    const dates = Array.isArray(datesParam)
      ? datesParam
      : datesParam.split(',').map(d => d.trim());

    if (addresses.length === 0) {
      res.status(400).json({ error: 'At least one address is required' });
      return;
    }

    if (dates.length === 0) {
      res.status(400).json({ error: 'At least one date is required' });
      return;
    }

    // Validate all dates
    for (const date of dates) {
      if (isNaN(Date.parse(date))) {
        res.status(400).json({ error: `Invalid date: ${date}` });
        return;
      }
    }

    // Fetch historical portfolios for all address-date combinations
    const promises = dates.map(async (date) => {
      const addressPromises = addresses.map(address =>
        fetchSingleHistorical(address, date, apiKey)
          .then(portfolio => ({ success: true as const, portfolio, address, date }))
          .catch(error => ({ success: false as const, error, address, date }))
      );

      const addressResults = await Promise.all(addressPromises);
      return { date, results: addressResults };
    });

    const dateResults = await Promise.all(promises);

    // Build the combined response
    const data: Record<string, Record<string, Portfolio>> = {};
    const errors: Array<{ date: string; address?: string; error: string }> = [];
    let totalLoaded = 0;
    const totalExpected = addresses.length * dates.length;

    dateResults.forEach(({ date, results }) => {
      data[date] = {};
      results.forEach(result => {
        if (result.success) {
          data[date][result.portfolio.address] = result.portfolio;
          totalLoaded++;
        } else {
          errors.push({
            date,
            address: result.address,
            error: result.error instanceof Error ? result.error.message : 'Unknown error',
          });
        }
      });
    });

    const response: CombinedHistoricalRangeResponse = {
      data
    };

    if (errors.length > 0) {
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
    console.error('Error fetching historical range:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
}
