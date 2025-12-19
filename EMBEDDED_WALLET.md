# Yuki Embedded EOA Wallet

A non-custodial embedded wallet implementation with password-first authentication and optional passkey upgrade.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (Client)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │  Key Generation  │  │   Encryption     │  │   Signing     │  │
│  │   (crypto.ts)    │  │  (Argon2+AES)    │  │    (viem)     │  │
│  └──────────────────┘  └──────────────────┘  └───────────────┘  │
│                               │                                   │
│                    Only ciphertext sent down                     │
└───────────────────────────────┼─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                         Server (Backend)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │   Auth (email/   │  │  Wallet Storage  │  │   Sessions    │  │
│  │    password)     │  │  (ciphertext)    │  │   (cookies)   │  │
│  └──────────────────┘  └──────────────────┘  └───────────────┘  │
│                                                                   │
│  Server NEVER sees: plaintext keys, decrypted material           │
└─────────────────────────────────────────────────────────────────┘
```

## Non-Custodial Invariants

These invariants MUST always be true:

1. ✅ Private key is generated in the browser (client-only)
2. ✅ Private key is encrypted before it leaves the browser
3. ✅ Server stores only ciphertext + metadata, never plaintext
4. ✅ Decryption happens only in the browser
5. ✅ Transaction signing happens only in the browser
6. ✅ On-ramp sends funds to user's EOA, not Yuki

**If any invariant fails, you've become custodial.**

## Cryptographic Details

### Key Derivation Function (KDF)
- **Algorithm**: PBKDF2 with SHA-256
- **Iterations**: 600,000 (OWASP recommended minimum)
- **Hash Length**: 32 bytes (256 bits)
- **Implementation**: Native WebCrypto API (no WASM/external dependencies)

### Encryption
- **Algorithm**: AES-256-GCM
- **Key Size**: 256 bits
- **IV Size**: 96 bits (12 bytes)
- **Authentication**: Built-in GCM tag

### Password-Only Mode
```
Password → Argon2id(password, salt) → KEK → AES-GCM-Encrypt(privateKey) → ciphertext
```

### Passkey-Enabled Mode (DEK wrapping)
```
                    ┌─────────────────────────────────┐
                    │           DEK (random)           │
                    └─────────────────────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
┌──────────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  wrapped_DEK_password │ │   cipher_priv    │ │ wrapped_DEK_passkey│
│  (KEK_password)       │ │   (DEK)          │ │ (KEK_passkey)      │
└──────────────────────┘ └──────────────────┘ └──────────────────┘
```

## File Structure

```
lib/
├── crypto.ts           # Cryptographic operations (client-side only)
├── auth.ts             # Password hashing for auth
├── db.ts               # Database operations (SQLite)
├── session.ts          # Session management (iron-session)
├── constants.ts        # Contract addresses, ABIs
├── wagmi.ts            # Wagmi configuration
├── context/
│   └── WalletContext.tsx   # React context for wallet state
└── hooks/
    ├── useAuth.ts          # Authentication hook
    └── useEmbeddedWallet.ts # Wallet management hook

app/api/
├── auth/
│   ├── signup/route.ts     # User registration
│   ├── login/route.ts      # User login
│   ├── logout/route.ts     # User logout
│   └── me/route.ts         # Get current user
└── wallet/
    ├── route.ts            # Get/Create wallet
    └── upgrade/route.ts    # Passkey upgrade

components/wallet/
├── CreateWalletModal.tsx      # Wallet creation flow
├── UnlockModal.tsx            # Password unlock prompt
├── DepositFlow.tsx            # USDC deposit with on-ramp
├── PasskeyUpgradeBanner.tsx   # Passkey upgrade prompt
├── WalletSecurityIndicator.tsx # Security level display
├── ExportPrivateKey.tsx       # Private key export (high-risk)
├── WalletSettings.tsx         # Wallet settings modal
└── index.ts                   # Barrel export
```

## Security Levels

| Level | Authentication | Description |
|-------|---------------|-------------|
| Basic | Password only | Single factor, lower security |
| Strong | Password + Passkey | Two factors, recommended |

## API Endpoints

### Authentication

#### POST /api/auth/signup
Create a new user account.
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

#### POST /api/auth/login
Authenticate and create session.
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

#### POST /api/auth/logout
Destroy the current session.

#### GET /api/auth/me
Get current authenticated user info.

### Wallet

#### GET /api/wallet
Get encrypted wallet data for decryption client-side.

#### POST /api/wallet
Store encrypted wallet data after client-side creation.
```json
{
  "encryptedWallet": {
    "address": "0x...",
    "chainId": 1,
    "version": 1,
    "cipherPriv": "base64...",
    "ivPriv": "base64...",
    "kdfSalt": "base64...",
    "kdfParams": {...},
    "securityLevel": "password_only"
  }
}
```

#### POST /api/wallet/upgrade
Upgrade wallet to passkey-enabled mode.

## Environment Variables

```bash
# Required
SESSION_SECRET=your_session_secret_at_least_32_characters_long

# Optional
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_COINBASE_PAY_APP_ID=your_coinbase_pay_app_id
```

## Usage Examples

### Creating a Wallet

```typescript
import { useWalletContext } from '@/lib/context/WalletContext';

function CreateWallet() {
  const { createWallet, isCreating } = useWalletContext();
  
  const handleCreate = async () => {
    const result = await createWallet('SecurePassword123');
    if (result.success) {
      console.log('Wallet created:', result.address);
    }
  };
  
  return <button onClick={handleCreate}>Create Wallet</button>;
}
```

### Unlocking for Signing

```typescript
import { useWalletContext } from '@/lib/context/WalletContext';

function SignTransaction() {
  const { unlockWallet, signTransaction, isUnlocked, account } = useWalletContext();
  
  const handleSign = async () => {
    if (!isUnlocked) {
      await unlockWallet('password');
    }
    
    const signature = await signTransaction({
      to: '0x...',
      value: 0n,
      data: '0x...',
    });
  };
}
```

### Deposit Flow

```tsx
import { DepositFlow } from '@/components/wallet';

function VaultPage() {
  const [showDeposit, setShowDeposit] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowDeposit(true)}>Deposit</button>
      <DepositFlow
        isOpen={showDeposit}
        onClose={() => setShowDeposit(false)}
        vaultName="Safe Vault"
      />
    </>
  );
}
```

## High-Risk Actions

The following actions require step-up authentication:

1. **Export Private Key** - Password + Passkey (if enabled)
2. **Change Password** - Not implemented (would need old password + passkey)
3. **Add/Remove Passkey** - Password + existing passkey
4. **Change Email** - Not implemented (would need password + passkey)

## Recovery

⚠️ **Important**: This is a non-custodial wallet. If the user loses both:
- Their password
- Their passkey (if enabled)

**Their funds cannot be recovered.** This is the trade-off for true self-custody.

### Mitigation Options

1. **Passkey Syncing**: Passkeys sync across devices (iCloud, Google, etc.)
2. **Recovery Kit** (Future): Downloadable encrypted backup
3. **Social Recovery** (Future): Multi-sig guardians

## Database Schema

```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT,
  locked_until TEXT,
  failed_attempts INTEGER DEFAULT 0
);

-- Wallets table (one per user)
CREATE TABLE wallets (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE REFERENCES users(id),
  address TEXT NOT NULL,
  chain_id INTEGER DEFAULT 1,
  version INTEGER DEFAULT 1,
  
  -- Encrypted private key
  cipher_priv TEXT NOT NULL,
  iv_priv TEXT NOT NULL,
  
  -- KDF parameters
  kdf_salt TEXT NOT NULL,
  kdf_params TEXT NOT NULL,
  
  -- Security level
  security_level TEXT DEFAULT 'password_only',
  
  -- Passkey fields (nullable)
  passkey_meta TEXT,
  wrapped_dek_password TEXT,
  iv_dek_password TEXT,
  wrapped_dek_passkey TEXT,
  iv_dek_passkey TEXT
);
```

## Security Considerations

### What we DO store on server:
- Email (for login)
- Password hash (PBKDF2, for auth only)
- Encrypted private key (AES-256-GCM ciphertext)
- KDF salt and parameters
- Passkey credential ID (if upgraded)

### What we NEVER store or see:
- Plaintext private key
- Password (only hash)
- Decrypted wallet data
- Signing operations

### Rate Limiting
- Login: 10 attempts per 15 minutes
- Signup: 10 attempts per 15 minutes
- Account lockout after 5 failed attempts (15 min)

### Session Security
- httpOnly cookies
- Secure flag in production
- SameSite: Lax
- 7-day expiration

## Production Checklist

- [ ] Set strong `SESSION_SECRET` environment variable
- [ ] Use PostgreSQL instead of SQLite
- [ ] Enable HTTPS
- [ ] Configure proper CORS
- [ ] Set up monitoring and alerting
- [ ] Implement backup/disaster recovery
- [ ] Add email verification
- [ ] Add account lockout notifications
- [ ] Security audit of crypto implementation
