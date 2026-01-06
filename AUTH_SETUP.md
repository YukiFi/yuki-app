# Authentication Setup

## Overview

The Yuki app now supports two authentication methods:
1. **Email/Password** - Traditional authentication with email and password
2. **Wallet Connection** - Connect with MetaMask, Phantom, WalletConnect, Coinbase Wallet, and other Web3 wallets

## Technologies Used

- **wagmi** (v3.1.0) - React hooks for Ethereum
- **viem** (v2.41.2) - TypeScript interface for Ethereum
- **RainbowKit** (v2.2.9) - Wallet connection UI
- **@tanstack/react-query** (v5.90.12) - Data fetching and state management

## Setup Instructions

### 1. Get a WalletConnect Project ID

1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com)
2. Create a new project
3. Copy your Project ID
4. Create a `.env.local` file in the `/app` directory:

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

### 2. Configuration

The wagmi configuration is located in `/lib/wagmi.ts` and includes:
- Mainnet (Ethereum)
- Base
- Arbitrum
- Optimism
- Polygon

You can add or remove chains as needed.

### 3. File Structure

```
app/
├── lib/
│   └── wagmi.ts              # Wagmi configuration
├── app/
│   ├── providers.tsx         # Wagmi, RainbowKit, and React Query providers
│   ├── layout.tsx            # Root layout with providers
│   └── signin/
│       └── page.tsx          # Authentication page
```

## Authentication Flow

### Wallet Authentication
1. User clicks "Connect Wallet" on the auth page
2. RainbowKit modal opens with wallet options
3. User selects their preferred wallet (MetaMask, WalletConnect, etc.)
4. Upon successful connection, user is redirected to dashboard
5. Wallet address is stored in localStorage

### Email/Password Authentication
1. User enters email and password
2. Form validates credentials (currently demo mode)
3. Upon success, user is redirected to dashboard
4. Email is stored in localStorage

## Usage

### Accessing the Auth Page

Users can access the authentication page at `/login` or by clicking "Get Started" or "Sign In" from the dashboard.

### Checking Authentication Status

The app checks for authentication using:
```typescript
localStorage.getItem("yuki_onboarding_complete") === "true"
```

### Wallet Connection Status

Use wagmi hooks to check wallet connection:
```typescript
import { useAccount } from 'wagmi';

const { address, isConnected } = useAccount();
```

## Supported Wallets

- MetaMask
- Coinbase Wallet
- WalletConnect (supports 300+ wallets)
- Rainbow Wallet
- Trust Wallet
- And many more through WalletConnect

## Customization

### Adding More Chains

Edit `/lib/wagmi.ts`:
```typescript
import { mainnet, base, arbitrum, avalanche } from 'wagmi/chains';

export const config = getDefaultConfig({
  // ...
  chains: [mainnet, base, arbitrum, avalanche],
});
```

### Styling RainbowKit

RainbowKit can be customized with themes. See the [RainbowKit documentation](https://www.rainbowkit.com/docs/theming) for more details.

## Security Notes

- Never commit `.env.local` to version control
- Store sensitive data securely (consider using a backend for production)
- Implement proper session management for production
- Add rate limiting for authentication endpoints
- Use HTTPS in production

## Next Steps

For production deployment:
1. Implement backend authentication API
2. Add JWT token management
3. Implement proper session handling
4. Add email verification
5. Add password reset functionality
6. Implement 2FA (Two-Factor Authentication)
7. Add proper error handling and logging

