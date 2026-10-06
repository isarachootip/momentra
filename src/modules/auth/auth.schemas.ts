import { z } from 'zod';

export const loginSchema = z
  .object({
    provider: z.enum(['oidc', 'local']),
    id_token: z.string().optional(),
    email: z.string().email('Invalid email format').optional(),
    password: z.string().min(1, 'Password is required').optional(),
  })
  .superRefine((data, ctx) => {
    if (data.provider === 'local') {
      if (!data.email) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Email is required for local authentication',
          path: ['email'],
        });
      }
      if (!data.password) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Password is required for local authentication',
          path: ['password'],
        });
      }
    } else if (data.provider === 'oidc') {
      if (!data.id_token) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'id_token is required for OIDC authentication',
          path: ['id_token'],
        });
      }
    }
  });

export const refreshSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required'),
});

export const logoutSchema = z.object({
  refresh_token: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
