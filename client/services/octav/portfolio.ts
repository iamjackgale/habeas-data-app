import axios, { AxiosError } from 'axios';
import { TPortfolio } from '@/types/portfolio';

export interface GetPortfolioParams {
  addresses: string[];
  includeImages?: boolean;
  includeExplorerUrls?: boolean;
  waitForSync?: boolean;
}

export interface ApiErrorResponse {
  error: string;
  message?: string;
}

export interface CombinedPortfolioResponse {
  data: Record<string, TPortfolio>;
  progress: {
    loaded: number;
    total: number;
    percentage: number;
  };
  errors?: Array<{
    address: string;
    error: string;
  }>;
}

/**
 * Get combined portfolio data from server endpoint
 * @param params - Portfolio query parameters
 * @returns {Promise<Record<string, TPortfolio>>} Portfolio data keyed by address
 * @throws {Error} Error with message from API response or from response errors array
 */
export const getPortfolio = async (params: GetPortfolioParams): Promise<Record<string, TPortfolio>> => {
  const { addresses, includeImages, includeExplorerUrls, waitForSync } = params;

  const queryParams = new URLSearchParams({
    addresses: addresses.join(','),
  });

  if (includeImages !== undefined) {
    queryParams.append('includeImages', String(includeImages));
  }

  if (includeExplorerUrls !== undefined) {
    queryParams.append('includeExplorerUrls', String(includeExplorerUrls));
  }

  if (waitForSync !== undefined) {
    queryParams.append('waitForSync', String(waitForSync));
  }

  try {
    const response = await axios.get<CombinedPortfolioResponse>(
      `http://localhost:3001/api/octav/portfolio?${queryParams.toString()}`,
      {
        withCredentials: false,
      }
    );

    // Check for errors in the response
    if (response.data.errors && response.data.errors.length > 0) {
      const firstError = response.data.errors[0];
      throw new Error(firstError.error || `Error fetching data for address ${firstError.address}`);
    }

    return response.data.data;
  } catch (error) {
    // Handle axios errors and extract API error message
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiErrorResponse>;

      if (axiosError.response?.data) {
        const apiError = axiosError.response.data;
        const errorMessage = apiError.message || apiError.error || 'Failed to fetch portfolio data';
        throw new Error(errorMessage);
      }

      // Network or other axios errors
      throw new Error(axiosError.message || 'Network error occurred');
    }

    // Unknown error
    throw error instanceof Error ? error : new Error('Unknown error occurred');
  }
};
