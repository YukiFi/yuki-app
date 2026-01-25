/**
 * UploadThing Configuration
 * 
 * File upload configuration for profile images (avatar and banner).
 * 
 * Setup:
 * 1. Create an account at uploadthing.com
 * 2. Get your app ID and secret
 * 3. Add to .env.local:
 *    UPLOADTHING_TOKEN=your_token_here
 */

import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@clerk/nextjs/server";

const f = createUploadthing();

/**
 * File router for profile image uploads
 */
export const uploadRouter = {
  // Avatar upload - smaller size, square aspect ratio recommended
  avatarUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const { userId } = await auth();
      
      if (!userId) {
        throw new Error("Unauthorized");
      }
      
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("[UploadThing] Avatar uploaded for user:", metadata.userId);
      console.log("[UploadThing] File URL:", file.ufsUrl);
      
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),
  
  // Banner upload - larger size, wide aspect ratio recommended
  bannerUploader: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async () => {
      const { userId } = await auth();
      
      if (!userId) {
        throw new Error("Unauthorized");
      }
      
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("[UploadThing] Banner uploaded for user:", metadata.userId);
      console.log("[UploadThing] File URL:", file.ufsUrl);
      
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;

