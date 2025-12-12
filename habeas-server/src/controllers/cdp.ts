import { Request, Response } from 'express';
import { requestFaucet } from '../utils/faucet.js';
import { getTokenBalances } from '../utils/balances.js';

/**
 * Get USDC balance for an address
 */
export async function getBalance(req: Request, res: Response): Promise<void> {
  try {
    const { address } = req.params;
    
    if (!address) {
      res.status(400).json({ error: "address required" });
      return;
    }

    const apiKeyId = process.env.CDP_API_KEY_ID;
    const privateKey = process.env.CDP_API_KEY_SECRET;

    if (!apiKeyId || !privateKey) {
      res.status(500).json({ error: "server not configured with CDP API credentials" });
      return;
    }

    const usdcBalance = await getTokenBalances(address, "base-sepolia", apiKeyId, privateKey);
    
    res.json({ 
      balance: usdcBalance,
      address: address,
      network: "base-sepolia",
      token: "USDC"
    });
  } catch (error) {
    console.error("Balance error:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "failed to fetch balance"
    });
  }
}

/**
 * Request test USDC from the faucet
 */
export async function requestFromFaucet(req: Request, res: Response): Promise<void> {
  try {
    const { address } = req.body;
    
    if (!address) {
      res.status(400).json({ error: "address required" });
      return;
    }

    const apiKeyId = process.env.CDP_API_KEY_ID;
    const privateKey = process.env.CDP_API_KEY_SECRET;

    if (!apiKeyId || !privateKey) {
      res.status(500).json({ error: "server not configured with CDP API credentials" });
      return;
    }

    console.log(`Requesting faucet for address: ${address}`);
    const txHash = await requestFaucet(address, apiKeyId, privateKey);
    
    console.log(`Faucet successful! Transaction: ${txHash}`);
    res.json({ 
      success: true, 
      transactionHash: txHash,
      message: "USDC will arrive shortly"
    });
  } catch (error) {
    console.error("Faucet error:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Faucet request failed",
      details: "may be hitting rate limits; try again in a few min"
    });
  }
}
