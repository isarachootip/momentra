import type { FastifyInstance } from 'fastify';
import { workspaceController } from './workspace.controller.js';
import { authGuard } from '../../core/middleware/auth-guard.js';

export async function workspaceRoutes(app: FastifyInstance): Promise<void> {
  const guarded = { preHandler: authGuard };

  // Workspaces CRUD
  app.get('/api/v1/workspaces', guarded, (req, reply) =>
    workspaceController.listWorkspaces(req, reply)
  );
  app.post('/api/v1/workspaces', guarded, (req, reply) =>
    workspaceController.createWorkspace(req, reply)
  );
  app.get('/api/v1/workspaces/:id', guarded, (req, reply) =>
    workspaceController.getWorkspace(req, reply)
  );
  app.patch('/api/v1/workspaces/:id', guarded, (req, reply) =>
    workspaceController.updateWorkspace(req, reply)
  );
  app.delete('/api/v1/workspaces/:id', guarded, (req, reply) =>
    workspaceController.deleteWorkspace(req, reply)
  );

  // Workspace Members Management
  app.get('/api/v1/workspaces/:id/members', guarded, (req, reply) =>
    workspaceController.listMembers(req, reply)
  );
  app.post('/api/v1/workspaces/:id/members/invite', guarded, (req, reply) =>
    workspaceController.inviteMember(req, reply)
  );
  app.patch('/api/v1/workspaces/:id/members/:userId', guarded, (req, reply) =>
    workspaceController.updateMemberRole(req, reply)
  );
  app.delete('/api/v1/workspaces/:id/members/:userId', guarded, (req, reply) =>
    workspaceController.removeMember(req, reply)
  );
}
