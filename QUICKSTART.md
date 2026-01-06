# Quick Start Guide - New Authentication System

## What Changed

Your Yuki app now has a complete authentication system with:

✅ **Email/Password Authentication** - Users can sign up and sign in with email
✅ **Wallet Authentication** - Connect with MetaMask, WalletConnect, Coinbase, and more
✅ **Smart Provider Detection** - Automatically detects injected wallets
✅ **Multi-Chain Support** - Ethereum, Base, Arbitrum, Optimism, Polygon
✅ **Beautiful UI** - Integrated with your existing design system
✅ **Responsive** - Works on all devices

## Getting Started

### 1. Install Dependencies (Already Done ✓)

```bash
bun add wagmi viem @tanstack/react-query @rainbow-me/rainbowkit
```

### 2. Get a WalletConnect Project ID

1. Go to https://cloud.walletconnect.com
2. Create a new project
3. Copy your Project ID
4. Create `.env.local` in the `/app` directory:

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

### 3. Run the App

```bash
cd /home/haruxe/Projects/Yuki/app
bun dev
```

### 4. Test the Authentication

1. Navigate to `http://localhost:3000`
2. Click "Get Started" or "Sign In"
3. Choose your authentication method:
   - **Wallet Tab**: Connect with MetaMask, WalletConnect, etc.
   - **Sign In Tab**: Use email/password (demo mode)
   - **Sign Up Tab**: Create a new account (demo mode)

## File Structure

```
app/
├── lib/
│   └── wagmi.ts                    # Wagmi configuration
├── app/
│   ├── providers.tsx               # Wagmi + RainbowKit providers
│   ├── layout.tsx                  # Updated with providers
│   ├── page.tsx                    # Dashboard with new auth flow
│   └── auth/
│       └── page.tsx                # New authentication page
├── components/
│   └── Navbar.tsx                  # Updated with wallet info
└── AUTH_SETUP.md                   # Detailed documentation
```

## Key Features

### Wallet Connection
- Supports 300+ wallets through WalletConnect
- Auto-detects injected wallets (MetaMask, Coinbase, etc.)
- Shows connected wallet address in navbar
- Easy disconnect functionality

### Email/Password
- Sign up with email and password
- Sign in with existing credentials
- Remember me functionality
- Password confirmation on signup

### User Experience
- Seamless tab switching between auth methods
- Loading states and animations
- Error handling
- Responsive design
- Persistent sessions

## Navbar Updates

The navbar now shows:
- User's wallet address (if connected via wallet)
- User's email (if signed in via email)
- Authentication method icon (wallet or email)
- Profile dropdown with logout option

## Dashboard Updates

The dashboard now:
- Redirects to `/login` instead of `/onboarding`
- Shows "Get Started" and "Sign In" buttons
- Works with both auth methods

## Next Steps

### For Development
1. Get your WalletConnect Project ID
2. Add it to `.env.local`
3. Test wallet connections
4. Test email authentication

### For Production
1. Implement backend authentication API
2. Add JWT token management
3. Implement email verification
4. Add password reset
5. Add 2FA support
6. Implement proper session management
7. Add rate limiting

## Troubleshooting

### Wallet Not Connecting
- Make sure you have a WalletConnect Project ID
- Check that your wallet extension is installed
- Try refreshing the page

### Email Auth Not Working
- Currently in demo mode
- Implement backend API for production

### Styling Issues
- RainbowKit theme matches your accent color (#0F52FB)
- Custom theme in `app/providers.tsx`

## Support

For more details, see:
- `AUTH_SETUP.md` - Complete authentication documentation
- [Wagmi Docs](https://wagmi.sh)
- [RainbowKit Docs](https://rainbowkit.com)
- [Viem Docs](https://viem.sh)

## Demo Mode

The current implementation uses localStorage for demo purposes:
- Email/password validation is simulated
- Wallet connections are real (requires WalletConnect ID)
- Session management is client-side only

For production, implement proper backend authentication!

