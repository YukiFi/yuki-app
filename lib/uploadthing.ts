/**
 * UploadThing Configuration (Server)
 * 
 * File upload configuration for profile images (avatar and banner).
 * 
 * With Alchemy Smart Wallets, we use a simpler approach:
 * - Upload API handles authentication via wallet address header
 * - This file just defines the file router for type safety
 * 
 * Setup:
 * 1. Create an account at uploadthing.com
 * 2. Get your app ID and secret
 * 3. Add to .env.local:
 *    UPLOADTHING_TOKEN=your_token_here
 */

import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

/**
 * File router for profile image uploads
 * 
 * Note: With Alchemy Smart Wallets, authentication is handled
 * via wallet address headers in the upload API route.
 * The middleware here is simplified.
 */
export const uploadRouter = {
  // Avatar upload - smaller size, square aspect ratio recommended
  avatarUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      // Auth is handled by the API route via x-wallet-address header
      // This middleware just passes through
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      console.log("[UploadThing] Avatar uploaded");
      console.log("[UploadThing] File URL:", file.ufsUrl);
      
      return { url: file.ufsUrl };
    }),
  
  // Banner upload - larger size, wide aspect ratio recommended
  bannerUploader: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async () => {
      // Auth is handled by the API route via x-wallet-address header
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      console.log("[UploadThing] Banner uploaded");
      console.log("[UploadThing] File URL:", file.ufsUrl);
      
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
