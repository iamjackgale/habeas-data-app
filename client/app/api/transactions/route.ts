import { TransactionsResponse } from '@/types/transaction';
import { NextRequest, NextResponse } from 'next/server';

const OCTAV_API_BASE_URL = 'https://api.octav.fi/v1';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.OCTAV_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'OCTAV_API_KEY environment variable is not set' }, { status: 500 });
    }

    const searchParams = request.nextUrl.searchParams;
    const addresses = searchParams.get('addresses');
    
    if (!addresses) {
      return NextResponse.json({ error: 'addresses parameter is required' }, { status: 400 });
    }

    const limit = searchParams.get('limit');
    if (!limit || isNaN(Number(limit))) {
      return NextResponse.json({ error: 'limit parameter must be a valid number' }, { status: 400 });
    }

    if (Number(limit) > 250) {
      return NextResponse.json({ error: 'limit parameter must be a valid number' }, { status: 400 });
    }

    const offset = searchParams.get('offset');
    if (!offset || isNaN(Number(offset))) {
      return NextResponse.json({ error: 'offset parameter must be a valid number' }, { status: 400 });
    }

    // Build query parameters
    // Build query parameters
    const queryParams = new URLSearchParams({
      addresses,
      limit,
      offset
    });

    const initialSearchText = searchParams.get('searchText');
    if (initialSearchText !== null) {
      queryParams.append('searchText', initialSearchText);
    }

    const interactingAddresses = searchParams.get('interactingAddresses');
    if (interactingAddresses !== null) {
      queryParams.append('interactingAddresses', interactingAddresses);
    }

    const networks = searchParams.get('networks');
    if (networks !== null) {
      queryParams.append('networks', networks);
    }

    const txTypes = searchParams.get('txTypes');
    if (txTypes !== null) {
      queryParams.append('txTypes', txTypes);
    }

    const protocols = searchParams.get('protocols');
    if (protocols !== null) {
      queryParams.append('protocols', protocols);
    }

    const hideSpam = searchParams.get('hideSpam');
    if (hideSpam !== null) {
      queryParams.append('hideSpam', hideSpam);
    }

    const sort = searchParams.get('sort');
    if (sort !== null) {
      queryParams.append('sort', sort);
    }

    const startDate = searchParams.get('startDate');
    if (startDate !== null) {
      queryParams.append('startDate', startDate);
    }

    const endDate = searchParams.get('endDate');
    if (endDate !== null) {
      queryParams.append('endDate', endDate);
    }

    const nftTokenId = searchParams.get('nftTokenId');
    if (nftTokenId !== null) {
      queryParams.append('nftTokenId', nftTokenId);
    }

    // Call Octav API
    const response = await fetch(`${OCTAV_API_BASE_URL}/transactions?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: errorData.error || 'Failed to fetch portfolio data',
          message: errorData.message || `Octav API returned status ${response.status}`,
        },
        { status: response.status }
      );
    }

    const data: TransactionsResponse = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching Transactions:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
