/**
 * yUSD Transaction Builder
 * 
 * Utilities for building and sending yUSD ERC20 transfers.
 */

import { parseUnits, encodeFunctionData, formatUnits } from 'viem';
import { erc20Abi } from 'viem';
import { createPublicViemClient } from '@/lib/wagmi';
import { base } from 'viem/chains';

// yUSD token address on Base (placeholder - update with actual address)
export const YUSD_ADDRESS = (process.env.NEXT_PUBLIC_YUSD_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`;

// USDC address on Base for Coinbase integration
export const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;

// Token decimals
export const YUSD_DECIMALS = 18;
export const USDC_DECIMALS = 6;

/**
 * Build a yUSD transfer transaction
 * 
 * @param to - Recipient address
 * @param amount - Human-readable amount (e.g., "100.50")
 * @returns Transaction data for signing
 */
export function buildYUSDTransfer(
  to: `0x${string}`,
  amount: string
) {
  const value = parseUnits(amount, YUSD_DECIMALS);
  
  return {
    to: YUSD_ADDRESS,
    data: encodeFunctionData({
      abi: erc20Abi,
      functionName: 'transfer',
      args: [to, value],
    }),
    value: 0n,
  };
}

/**
 * Build a USDC transfer transaction (for withdrawals to Coinbase)
 */
export function buildUSDCTransfer(
  to: `0x${string}`,
  amount: string
) {
  const value = parseUnits(amount, USDC_DECIMALS);
  
  return {
    to: USDC_ADDRESS,
    data: encodeFunctionData({
      abi: erc20Abi,
      functionName: 'transfer',
      args: [to, value],
    }),
    value: 0n,
  };
}

/**
 * Build an ERC20 approval transaction
 */
export function buildERC20Approval(
  tokenAddress: `0x${string}`,
  spender: `0x${string}`,
  amount: bigint
) {
  return {
    to: tokenAddress,
    data: encodeFunctionData({
      abi: erc20Abi,
      functionName: 'approve',
      args: [spender, amount],
    }),
    value: 0n,
  };
}

/**
 * Check if the yUSD address is configured (not the zero address placeholder)
 */
export function isYUSDConfigured(): boolean {
  return YUSD_ADDRESS !== '0x0000000000000000000000000000000000000000';
}

/**
 * Get yUSD balance for an address
 * Returns '0' if yUSD contract is not configured (placeholder address)
 */
export async function getYUSDBalance(address: `0x${string}`): Promise<string> {
  // Skip if yUSD address is the zero address placeholder
  if (!isYUSDConfigured()) {
    return '0';
  }
  
  const client = createPublicViemClient(base.id);
  
  try {
    const balance = await client.readContract({
      address: YUSD_ADDRESS,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [address],
    });
    
    return formatUnits(balance, YUSD_DECIMALS);
  } catch (error) {
    console.error('Failed to get yUSD balance:', error);
    return '0';
  }
}

/**
 * Get USDC balance for an address
 */
export async function getUSDCBalance(address: `0x${string}`): Promise<string> {
  const client = createPublicViemClient(base.id);
  
  try {
    const balance = await client.readContract({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [address],
    });
    
    return formatUnits(balance, USDC_DECIMALS);
  } catch (error) {
    console.error('Failed to get USDC balance:', error);
    return '0';
  }
}

/**
 * Get native ETH balance for gas payments
 */
export async function getETHBalance(address: `0x${string}`): Promise<string> {
  const client = createPublicViemClient(base.id);
  
  try {
    const balance = await client.getBalance({ address });
    return formatUnits(balance, 18);
  } catch (error) {
    console.error('Failed to get ETH balance:', error);
    return '0';
  }
}

/**
 * Estimate gas for a transaction
 */
export async function estimateGas(
  from: `0x${string}`,
  to: `0x${string}`,
  data: `0x${string}`,
  value: bigint = 0n
): Promise<bigint> {
  const client = createPublicViemClient(base.id);
  
  try {
    const gas = await client.estimateGas({
      account: from,
      to,
      data,
      value,
    });
    
    // Add 20% buffer for safety
    return (gas * 120n) / 100n;
  } catch (error) {
    console.error('Failed to estimate gas:', error);
    // Return a reasonable default
    return 100000n;
  }
}

/**
 * Get current gas price
 */
export async function getGasPrice(): Promise<bigint> {
  const client = createPublicViemClient(base.id);
  
  try {
    return await client.getGasPrice();
  } catch (error) {
    console.error('Failed to get gas price:', error);
    // Return a reasonable default (0.001 gwei)
    return 1000000n;
  }
}

/**
 * Validate Ethereum address format
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Format amount for display (add commas, limit decimals)
 */
export function formatAmount(amount: string, decimals: number = 2): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return '0.00';
  
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

