/**
 * Profile Validation Schemas
 * 
 * Zod schemas for validating profile data.
 */

import { z } from 'zod';
import { RESERVED_ROUTES } from '@/lib/constants/reserved-routes';

// Username/handle validation
export const usernameSchema = z.string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be at most 20 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
  .refine(val => !RESERVED_ROUTES.has(val.toLowerCase()), {
    message: 'This username is reserved'
  });

// Profile update schema
export const profileUpdateSchema = z.object({
  displayName: z.string()
    .max(50, 'Display name must be at most 50 characters')
    .optional()
    .nullable(),
  bio: z.string()
    .max(160, 'Bio must be at most 160 characters')
    .optional()
    .nullable(),
  avatarUrl: z.string()
    .url('Invalid avatar URL')
    .optional()
    .nullable(),
  bannerUrl: z.string()
    .url('Invalid banner URL')
    .optional()
    .nullable(),
  isPrivate: z.boolean().optional(),
  username: usernameSchema.optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

// Public profile response type
export interface PublicProfile {
  handle: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  isPrivate: boolean;
  createdAt: string;
}

// Full profile (for owner)
export interface FullProfile extends PublicProfile {
  id: string;
  clerkUserId: string;
  usernameLastChanged: string | null;
  canChangeUsername: boolean;
  daysUntilUsernameChange: number;
}
