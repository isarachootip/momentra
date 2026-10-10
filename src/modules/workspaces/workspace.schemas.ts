import { z } from 'zod';

export const workspaceRoleSchema = z.enum(['owner', 'admin', 'contributor', 'viewer']);
export const workspaceTypeSchema = z.enum(['personal', 'organization']);

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required').max(255),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must consist of lowercase letters, numbers, and hyphens')
    .optional(),
  type: workspaceTypeSchema.default('organization'),
  settings: z.record(z.unknown()).default({}),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  settings: z.record(z.unknown()).optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address format'),
  role: z.enum(['admin', 'contributor', 'viewer']),
});

export const updateMemberRoleSchema = z.object({
  role: workspaceRoleSchema,
});

export const workspaceIdParamSchema = z.object({
  id: z.string().uuid('Workspace ID must be a valid UUID'),
});

export const memberParamSchema = z.object({
  id: z.string().uuid('Workspace ID must be a valid UUID'),
  userId: z.string().uuid('User ID must be a valid UUID'),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
