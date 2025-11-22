import { TransactionsResponse, TransactionType } from "@/types/transaction";
import axios, { AxiosError } from "axios";

const PAGE_SIZE = 250;
export interface getTransactionParams {
  addresses: string;
  limit: number;
  offset: number;

  initialSearchText?: string;
  interactingAddresses?: string[];
  networks?: string[];
  txTypes?: TransactionType[];
  protocols?: string[];
  hideSpam?: boolean;

  sort?: 'ASC' | 'DESC';

  startDate?: string;
  endDate?: string;

  nftTokenId?: number;
}

interface ApiErrorResponse {
  error: string;
  message?: string;
}

export const getTransactions = async (params: getTransactionParams): Promise<TransactionsResponse> => {
  const { addresses, limit, offset, initialSearchText, interactingAddresses,
    networks, txTypes, protocols, hideSpam, sort, startDate, endDate, nftTokenId
  } = params;
  
  const queryParams = new URLSearchParams({
    addresses: addresses,
    limit: limit.toString(),
    offset: (offset * PAGE_SIZE).toString(),
  });

  if (initialSearchText) {
    queryParams.append('searchText', initialSearchText);
  }

  if (interactingAddresses && interactingAddresses.length > 0) {
    queryParams.append('interactingAddresses', interactingAddresses.join(','));
  }

  if (networks && networks.length > 0) {
    queryParams.append('networks', networks.join(','));
  }

  if (txTypes && txTypes.length > 0) {
    queryParams.append('txTypes', txTypes.join(','));
  }

  if (protocols && protocols.length > 0) {
    queryParams.append('protocols', protocols.join(','));
  }

  if (hideSpam !== undefined) {
    queryParams.append('hideSpam', String(hideSpam));
  }

  if (sort) {
    queryParams.append('sort', sort);
  }

  // also validate date strings
  if (startDate && !isNaN(Date.parse(startDate))) {
    //convert date to End date in ISO 8601 format
    const isoStartDate = new Date(startDate).toISOString();
    queryParams.append('startDate', isoStartDate);
  }

  if (endDate && !isNaN(Date.parse(endDate))) {
    const isoEndDate = new Date(endDate).toISOString();
    queryParams.append('endDate', isoEndDate);
  }

  if (nftTokenId !== undefined) {
    queryParams.append('tokenId', nftTokenId.toString());
  }

  try {
    const response = await axios.get<TransactionsResponse>(`/api/transactions?${queryParams.toString()}`, {
      withCredentials: true,
    });
    return response.data;
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
}