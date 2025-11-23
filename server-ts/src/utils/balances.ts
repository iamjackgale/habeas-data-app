import { generateJwt } from "@coinbase/cdp-sdk/auth";

interface TokenBalance {
  token: {
    contractAddress: string;
  };
  amount: {
    amount: string;
    decimals: number;
  };
}

interface TokenBalancesResponse {
  balances?: TokenBalance[];
}

/**
 * Get token balances for an address using CDP Token Balances API
 */
export async function getTokenBalances(
  address: string,
  network: string,
  apiKeyId: string,
  apiKeySecret: string
): Promise<string> {
  // Generate JWT for auth
  const jwt = await generateJwt({
    apiKeyId: apiKeyId,
    apiKeySecret: apiKeySecret,
    requestMethod: "GET",
    requestHost: "api.cdp.coinbase.com",
    requestPath: `/platform/v2/evm/token-balances/${network}/${address}`,
    expiresIn: 120,
  });

  const response = await fetch(
    `https://api.cdp.coinbase.com/platform/v2/evm/token-balances/${network}/${address}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Token Balances API error:", errorText);
    throw new Error(`Failed to fetch balances: ${response.status}`);
  }

  const data = await response.json() as TokenBalancesResponse;
  
  // Find USDC balance on Base Sepolia
  const usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e".toLowerCase();
  const usdcBalance = data.balances?.find(
    b => b.token.contractAddress.toLowerCase() === usdcAddress
  );
  
  if (usdcBalance) {
    // Convert to decimal format
    const amount = BigInt(usdcBalance.amount.amount);
    const decimals = usdcBalance.amount.decimals;
    const divisor = BigInt(10 ** decimals);
    const balance = Number(amount) / Number(divisor);
    return balance.toString();
  }
  
  return "0";
}
