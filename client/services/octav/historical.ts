import axios, { AxiosError } from 'axios';
import { Portfolio } from '@/types/portfolio';

export interface GetHistoricalParams {
  address: string;
  date: string;
}

export interface ApiErrorResponse {
  error: string;
  message?: string;
}

/**
 * Get portfolio data from NextJS API endpoint
 * @param params - Portfolio query parameters
 * @returns {Promise<PortfolioResponse>} Portfolio data
 * @throws {Error} Error with message from API response
 */
export const getHistorical = async (params: GetHistoricalParams): Promise<Portfolio> => {
  const { address, date } = params;

  const queryParams = new URLSearchParams({
    addresses: address,
    date: date
  });

  try {
    const response = await axios.get<Portfolio[]>(`/api/historical?${queryParams.toString()}`, {
      withCredentials: true,
    });

    return response.data[0];
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
