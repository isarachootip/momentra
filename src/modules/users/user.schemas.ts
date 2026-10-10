import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(1, 'Full name is required').max(255),
  avatar_url: z.string().url('Avatar must be a valid URL').nullable().optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email address format').optional(),
  full_name: z.string().min(1).max(255).optional(),
  avatar_url: z.string().url('Avatar must be a valid URL').nullable().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
});

export const updateMeSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(255).optional(),
  avatar_url: z.string().url('Avatar must be a valid URL').nullable().optional(),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'New password must be at least 8 characters'),
});

export const listUsersQuerySchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  include_deleted: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid('User ID must be a valid UUID'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateMeInput = z.infer<typeof updateMeSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
