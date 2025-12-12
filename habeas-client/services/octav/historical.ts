import axios, { AxiosError } from 'axios';
import { TPortfolio } from '@/types/portfolio';

export interface GetHistoricalParams {
  addresses: string[];
  date: string;
}

export interface GetHistoricalRangeParams {
  addresses: string[];
  dates: string[];
}

export interface ApiErrorResponse {
  error: string;
  message?: string;
}

export interface CombinedHistoricalResponse {
  data: Record<string, TPortfolio>;
  errors?: Array<{
    address: string;
    error: string;
  }>;
}

export interface CombinedHistoricalRangeResponse {
  data: Record<string, Record<string, TPortfolio>>;
  progress: {
    loaded: number;
    total: number;
    percentage: number;
  };
  errors?: Array<{
    date: string;
    address?: string;
    error: string;
  }>;
}

/**
 * Get historical portfolio data from server endpoint
 * @param params - Historical portfolio query parameters
 * @returns {Promise<Record<string, TPortfolio>>} Portfolio data keyed by address
 * @throws {Error} Error with message from API response or from response errors array
 */
export const getHistorical = async (params: GetHistoricalParams): Promise<Record<string, TPortfolio>> => {
  const { addresses, date } = params;

  const queryParams = new URLSearchParams({
    addresses: addresses.join(','),
    date: date,
  });

  try {
    const response = await axios.get<CombinedHistoricalResponse>(
      `http://localhost:3001/api/octav/historical?${queryParams.toString()}`,
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
        const errorMessage = apiError.message || apiError.error || 'Failed to fetch historical portfolio data';
        throw new Error(errorMessage);
      }

      // Network or other axios errors
      throw new Error(axiosError.message || 'Network error occurred');
    }

    // Unknown error
    throw error instanceof Error ? error : new Error('Unknown error occurred');
  }
};

/**
 * Get historical portfolio data across multiple dates from server endpoint
 * @param params - Historical range query parameters
 * @returns {Promise<Record<string, Record<string, TPortfolio>>>} Historical range data keyed by date and address
 * @throws {Error} Error with message from API response
 */
export const getHistoricalRange = async (params: GetHistoricalRangeParams): Promise<Record<string, Record<string, TPortfolio>>> => {
  const { addresses, dates } = params;

  const queryParams = new URLSearchParams({
    addresses: addresses.join(','),
    dates: dates.join(','),
  });

  try {
    const response = await axios.get<CombinedHistoricalRangeResponse>(
      `http://localhost:3001/api/octav/historical/range?${queryParams.toString()}`,
      {
        withCredentials: false,
      }
    );

    // Check for errors in the response
    if (response.data.errors && response.data.errors.length > 0) {
      const firstError = response.data.errors[0];
      throw new Error(firstError.error || `Error fetching data for date ${firstError.date}`);
    }

    return response.data.data;
  } catch (error) {
    // Handle axios errors and extract API error message
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiErrorResponse>;

      if (axiosError.response?.data) {
        const apiError = axiosError.response.data;
        const errorMessage = apiError.message || apiError.error || 'Failed to fetch historical range data';
        throw new Error(errorMessage);
      }

      // Network or other axios errors
      throw new Error(axiosError.message || 'Network error occurred');
    }

    // Unknown error
    throw error instanceof Error ? error : new Error('Unknown error occurred');
  }
};
