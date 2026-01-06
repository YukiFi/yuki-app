# Clerk Custom Phone & Email Authentication Setup

## ✅ Completed Implementation

Your app now uses **Clerk** with a **custom phone & email authentication UI** that matches your design system.

### What's Been Done:

1. **Installed** `@clerk/nextjs` package
2. **Created** `middleware.ts` with `clerkMiddleware()` protecting all routes except `/login`
3. **Wrapped** app with `<ClerkProvider>` in `app/layout.tsx`
4. **Built custom login page** at `/app/login/[[...login]]/page.tsx` using:
   - `useSignIn()` hook for sign-in flow
   - `useSignUp()` hook for sign-up flow
   - Custom UI with your exact styling (no borders, backgrounds only, left-aligned)
5. **Updated Navbar** with Clerk's `useUser()` and `useClerk()` hooks
6. **Configured environment variables** for Clerk redirects

## 📂 File Structure

```
app/
├── middleware.ts                    # Route protection with clerkMiddleware()
├── app/
│   ├── layout.tsx                  # Wrapped with <ClerkProvider>
│   └── login/
│       └── [[...login]]/
│           └── page.tsx            # Custom phone auth UI
└── components/
    └── Navbar.tsx                  # Uses useUser() and useClerk()
```

## 🔧 Environment Variables

All set in `.env.local`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

## 📱 How It Works

Users can choose between **Phone** or **Email** authentication via a toggle.

### Phone Sign Up Flow:
1. User visits `/login?su`
2. Selects "Phone" tab
3. Enters phone number → `signUp.create({ phoneNumber })`
4. Clerk sends SMS code → `signUp.preparePhoneNumberVerification()`
5. User enters 6-digit code → `signUp.attemptPhoneNumberVerification({ code })`
6. Session activated → Redirects to `/`

### Phone Sign In Flow:
1. User visits `/login`
2. Selects "Phone" tab
3. Enters phone number → `signIn.create({ identifier })`
4. Clerk sends SMS code → `signIn.prepareFirstFactor({ strategy: "phone_code" })`
5. User enters code → `signIn.attemptFirstFactor({ strategy: "phone_code", code })`
6. Session activated → Redirects to `/`

### Email Sign Up Flow:
1. User visits `/login?su`
2. Selects "Email" tab
3. Enters email → `signUp.create({ emailAddress })`
4. Clerk sends email with code → `signUp.prepareEmailAddressVerification()`
5. User enters 6-digit code → `signUp.attemptEmailAddressVerification({ code })`
6. Session activated → Redirects to `/`

### Email Sign In Flow:
1. User visits `/login`
2. Selects "Email" tab
3. Enters email → `signIn.create({ identifier })`
4. Clerk sends email with code → `signIn.prepareFirstFactor({ strategy: "email_code" })`
5. User enters code → `signIn.attemptFirstFactor({ strategy: "email_code", code })`
6. Session activated → Redirects to `/`

## 🎨 Custom Styling

Your login page maintains:
- ✅ Phone/Email toggle with segmented control
- ✅ No borders/outlines (backgrounds only)
- ✅ Left-aligned content
- ✅ Top-positioned layout
- ✅ Gray-100 container backgrounds
- ✅ Smooth framer-motion animations
- ✅ Phone number auto-formatting `(555) 123-4567`
- ✅ Country code selector with 200+ countries
- ✅ Searchable dropdown with flags

## 🔐 Clerk Dashboard Configuration

### **REQUIRED: Enable Authentication Methods**

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Navigate to **User & Authentication** → **Email, Phone, Username**

### Enable Phone Authentication:
3. **Enable "Phone number"** as an authentication method
4. In **Messaging** → **SMS**:
   - Development: Uses Clerk's test SMS (no setup needed)
   - Production: Connect your Twilio account

### Enable Email Authentication:
5. **Enable "Email address"** as an authentication method
6. Toggle **"Verification required"** ON (users will receive a 6-digit code)
7. **Uncheck "Require"** for any fields you're NOT collecting (like username, name, etc.)
8. Click **Save** at the bottom of the page

**⚠️ Important:** 
- If you don't enable email authentication, users will see an error when trying to use email sign-in.
- If you get "Verification successful. Please try signing in again" - this means Clerk requires additional fields. Go to the Email/Phone/Username settings and make sure ONLY phone number and email are marked as required, not username or other fields.

## 🔧 Troubleshooting

### "Too many verification code requests" Error

Clerk has built-in rate limiting to prevent abuse. If you're testing repeatedly, you'll hit these limits:

**Default Limits:**
- **10 SMS/email per hour** per phone/email address
- **5 requests per minute** per IP address

**Solutions:**

1. **Wait it out** - The app now shows a cooldown timer (60s after each request, 2 minutes if rate limited)
2. **Use different test accounts** - Test with different phone numbers/emails
3. **Adjust limits in Clerk Dashboard**:
   - Go to [Clerk Dashboard](https://dashboard.clerk.com/)
   - Navigate to **User & Authentication** → **Attack Protection**
   - Adjust **Rate Limiting** settings for development

The UI now prevents spam by:
- ✅ Showing "Resend in Xs" countdown
- ✅ Disabling button during cooldown
- ✅ Automatically setting 2-minute cooldown on rate limit errors

### CAPTCHA Warning in Console

If you see "Cannot initialize Smart CAPTCHA widget" warning, that's normal. The app now includes the `clerk-captcha` div element and Clerk will show CAPTCHA when needed (typically for suspicious sign-up attempts).

To disable CAPTCHA in development:
1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Navigate to **User & Authentication** → **Attack Protection**
3. Under **Bot Sign-up Protection**, toggle it OFF for development
4. Re-enable for production

### Sign Up Not Redirecting / "Please sign in again" Message

This happens when Clerk requires additional fields that we're not collecting. **IMPORTANT FIX:**

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Navigate to **User & Authentication** → **Email, Phone, Username**
3. **CRITICAL**: Under **Contact information**:
   - **Username**: Set to **"Don't require"** (NOT "Optional" or "Require")
   - Only enable **Phone number** and **Email address**
4. Under **Personal information**:
   - **First name**: Set to **"Don't require"** 
   - **Last name**: Set to **"Don't require"**
5. **Click Save** at the bottom
6. Clear your browser cookies/cache or try in incognito mode
7. Try signing up again

**Why this happens:** Our app only collects phone/email during sign-up. If Clerk is configured to require username, first name, or last name, users will get stuck after verification because we don't collect those fields.

**After fixing settings:** Sign-ups will work smoothly and users will be redirected directly to the app!

## 🚀 Testing

```bash
cd /home/haruxe/Projects/Yuki/app
bun run dev
```

Visit:
- `http://localhost:3000/login` - Sign in
- `http://localhost:3000/login?su` - Sign up

Test phone number in development: Use any valid US phone number format, Clerk will show you the code in the console/logs.

## 📊 User Data Access

```typescript
// In any client component
import { useUser } from "@clerk/nextjs";

const { isSignedIn, user } = useUser();

// Access phone number
user?.primaryPhoneNumber?.phoneNumber  // "+15551234567"

// Access email
user?.primaryEmailAddress?.emailAddress  // "user@example.com"

// Access name if set
user?.firstName
user?.lastName
user?.fullName
```

## 🔗 Routes

- **Public**: `/login`, `/login?su` (and anything under `/login/*`)
- **Protected**: Everything else (redirects to `/login` if not authenticated)

## 📚 Resources

- [Clerk Custom Sign-In](https://clerk.com/docs/custom-flows/use-sign-in)
- [Clerk Custom Sign-Up](https://clerk.com/docs/custom-flows/use-sign-up)
- [Phone Authentication](https://clerk.com/docs/authentication/phone-number)
- [Email Authentication](https://clerk.com/docs/authentication/email-password)
- [useSignIn Hook](https://clerk.com/docs/references/react/use-sign-in)
- [useSignUp Hook](https://clerk.com/docs/references/react/use-sign-up)
- [Configure Email/Phone/Username](https://dashboard.clerk.com/last-active?path=/user-authentication/email-phone-username)
