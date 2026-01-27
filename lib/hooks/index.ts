/**
 * Hooks barrel export
 * 
 * With Alchemy Smart Wallets, wallet management hooks are simplified.
 */

export { useAuth, type UserData, type AuthState } from './useAuth';
export { useRequireAuth, type AuthCheckResult } from './useRequireAuth';
export { useBalance, formatBalance, formatCurrency, type BalanceState } from './useBalance';
export { useDeposits, formatDeposit, type UseDepositsReturn } from './useDeposits';
