import { z } from 'zod';

export const socialPlatformEnum = z.enum([
  'facebook',
  'instagram',
  'tiktok',
  'youtube',
  'line',
  'x',
  'linkedin',
  'website',
  'email',
  'other',
]);

export const createSocialLinkSchema = z.object({
  platform: socialPlatformEnum,
  label: z.string().trim().min(1, 'Label is required').max(100),
  url: z.string().trim().min(1, 'URL is required').max(1000),
  linkGroup: z.enum(['official', 'personal']).default('personal'),
  visibility: z.enum(['public', 'private']).default('private'),
  sortOrder: z.number().int().optional(),
});

export type CreateSocialLinkInput = z.infer<typeof createSocialLinkSchema>;

export const updateSocialLinkSchema = createSocialLinkSchema.partial();
export type UpdateSocialLinkInput = z.infer<typeof updateSocialLinkSchema>;

export const reorderSocialLinksSchema = z.object({
  linkIds: z.array(z.string().uuid()),
});

export type ReorderSocialLinksInput = z.infer<typeof reorderSocialLinksSchema>;

export const kmCategoryEnum = z.enum(['article', 'video', 'image', 'document', 'note']);

export const createKmItemSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(500),
  kmCategory: kmCategoryEnum.default('note'),
  eventDate: z.string().min(4, 'Valid event date required (YYYY, YYYY-MM, or YYYY-MM-DD)'),
  datePrecision: z.enum(['year', 'month', 'day', 'datetime']).default('day'),
  isCirca: z.boolean().default(false),
  url: z.string().url().or(z.literal('')).optional(),
  summary: z.string().max(2000).optional(),
  tags: z.array(z.string().trim().max(50)).default([]),
  visibility: z.enum(['public', 'private']).default('private'),
});

export type CreateKmItemInput = z.infer<typeof createKmItemSchema>;

export const updateKmItemSchema = createKmItemSchema.partial();
export type UpdateKmItemInput = z.infer<typeof updateKmItemSchema>;

export const updateProfileSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-z0-9_-]+$/, 'Username must only contain lowercase letters, numbers, underscores, or hyphens')
    .optional(),
  fullName: z.string().trim().min(1).max(255).optional(),
  pageBio: z.string().max(500).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  isPagePublished: z.boolean().optional(),
  pageTemplate: z.enum(['bento', 'timeline']).optional(),
  pageTheme: z
    .object({
      theme: z.enum(['dark', 'light', 'minimal']).default('dark'),
      accent: z.string().default('#3b82f6'),
    })
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
