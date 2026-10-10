import { z } from 'zod';

export const discoverSocialSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  category: z
    .enum(['facebook_instagram', 'youtube', 'tiktok', 'other'])
    .optional()
    .default('youtube'),
  keywords: z.string().optional(),
});

export type DiscoverSocialInput = z.infer<typeof discoverSocialSchema>;

export const parseLinkSchema = z.object({
  url: z.string().url('Must be a valid URL'),
});

export type ParseLinkInput = z.infer<typeof parseLinkSchema>;

export const updatePageSettingsSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-z0-9_]+$/, 'Username must be lowercase letters, numbers, and underscores only')
    .optional(),
  isPagePublished: z.boolean().optional(),
  pageTemplate: z.enum(['bento', 'timeline']).optional(),
  pageTheme: z
    .object({
      theme: z.enum(['dark', 'light', 'minimal']).default('dark'),
      accent: z.string().default('#3b82f6'),
    })
    .optional(),
  pageBio: z.string().max(500, 'Bio must be 500 characters or fewer').nullable().optional(),
  socialLinks: z
    .object({
      facebook: z.string().url().or(z.literal('')).optional(),
      instagram: z.string().url().or(z.literal('')).optional(),
      youtube: z.string().url().or(z.literal('')).optional(),
      tiktok: z.string().url().or(z.literal('')).optional(),
      x: z.string().url().or(z.literal('')).optional(),
      github: z.string().url().or(z.literal('')).optional(),
      website: z.string().url().or(z.literal('')).optional(),
    })
    .optional(),
});

export type UpdatePageSettingsInput = z.infer<typeof updatePageSettingsSchema>;

export const importLinkItemSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().nullable().optional(),
  eventDate: z.string().min(4, 'Valid event date is required (YYYY, YYYY-MM, or YYYY-MM-DD)'),
  datePrecision: z.enum(['year', 'month', 'day', 'datetime']).default('day'),
  isCirca: z.boolean().default(false),
  collectionId: z.string().uuid().optional(),
  isPublic: z.boolean().default(true),
  embedMetadata: z.record(z.unknown()).nullable().optional(),
});

export type ImportLinkItemInput = z.infer<typeof importLinkItemSchema>;
