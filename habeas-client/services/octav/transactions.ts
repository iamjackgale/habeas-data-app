import { Transaction, TransactionsResponse, TransactionType } from "@/types/transaction";
import axios, { AxiosError } from "axios";

export interface GetTransactionsParams {
  addresses: string[];
  startDate: string;
  endDate: string;
  initialSearchText?: string;
  interactingAddresses?: string[];
  networks?: string[];
  txTypes?: TransactionType[];
  protocols?: string[];
  hideSpam?: boolean;
  sort?: 'ASC' | 'DESC';
  nftTokenId?: number;
}

export interface CombinedTransactionsResponse {
  data: Transaction[];
  dataByAddress: Record<string, Transaction[]>;
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
  errors?: Array<{
    address: string;
    error: string;
  }>;
}

interface ApiErrorResponse {
  error: string;
  message?: string;
}

/**
 * Get transactions from server endpoint
 * Server handles pagination automatically
 */
export const getTransactions = async (params: GetTransactionsParams): Promise<CombinedTransactionsResponse> => {
  const { 
    addresses, 
    startDate, 
    endDate,
    initialSearchText,
    interactingAddresses,
    networks,
    txTypes,
    protocols,
    hideSpam,
    sort,
    nftTokenId 
  } = params;

  const queryParams = new URLSearchParams({
    addresses: addresses.join(','),
    startDate: new Date(startDate).toISOString(),
    endDate: new Date(endDate).toISOString(),
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

  if (nftTokenId !== undefined) {
    queryParams.append('tokenId', nftTokenId.toString());
  }

  try {
    const response = await axios.get<CombinedTransactionsResponse>(
      `${process.env.NEXT_PUBLIC_API_URL}/api/octav/transactions?${queryParams.toString()}`,
      {
        withCredentials: false,
      }
    );
    return response.data;
  } catch (error) {
    // Handle axios errors and extract API error message
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiErrorResponse>;

      if (axiosError.response?.data) {
        const apiError = axiosError.response.data;
        const errorMessage = apiError.message || apiError.error || 'Failed to fetch transactions';
        throw new Error(errorMessage);
      }

      // Network or other axios errors
      throw new Error(axiosError.message || 'Network error occurred');
    }

    // Unknown error
    throw error instanceof Error ? error : new Error('Unknown error occurred');
  }
}