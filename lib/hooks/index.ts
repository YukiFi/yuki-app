/**
 * Hooks barrel export
 */

export { useAuth, type UserData, type AuthState } from './useAuth';
export { useEmbeddedWallet, type WalletState, type UseEmbeddedWalletReturn } from './useEmbeddedWallet';
export { useRequireAuth, type AuthCheckResult } from './useRequireAuth';
export { useBalance, formatBalance, formatCurrency, type BalanceState } from './useBalance';
export { useDeposits, formatDeposit, type UseDepositsReturn } from './useDeposits';
