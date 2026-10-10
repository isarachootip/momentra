import type { FastifyRequest, FastifyReply } from 'fastify';
import { pool } from '../../db/pool.js';
import { UnauthorizedError, NotFoundError } from '../../core/errors/app-error.js';
import { personalPageService } from './services/personal-page.service.js';
import { socialLinksService } from './services/social-links.service.js';
import { kmService } from './services/km.service.js';
import { socialDiscoveryService } from './services/social-discovery.service.js';
import { linkParserService } from './services/link-parser.service.js';
import {
  discoverSocialSchema,
  parseLinkSchema,
  updatePageSettingsSchema,
  importLinkItemSchema,
} from './schemas/personal-page.schema.js';
import {
  createSocialLinkSchema,
  updateSocialLinkSchema,
  reorderSocialLinksSchema,
  createKmItemSchema,
  updateKmItemSchema,
  updateProfileSchema,
} from './schemas/personal-hub.schema.js';

export class PersonalController {
  async getPublicPage(req: FastifyRequest<{ Params: { username: string } }>, reply: FastifyReply): Promise<void> {
    const pageData = await personalPageService.getPublicProfile(req.params.username);
    reply.status(200).send({ data: pageData });
  }

  async updateProfile(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!req.user) throw new UnauthorizedError('Authentication required');
    const input = updateProfileSchema.parse(req.body);
    const updated = await personalPageService.updatePageSettings(req.user.id, input);
    reply.status(200).send({ data: updated });
  }

  // Social Links Handlers
  async getLinks(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!req.user) throw new UnauthorizedError('Authentication required');
    const links = await socialLinksService.getUserLinks(req.user.id);
    reply.status(200).send({ data: links });
  }

  async createLink(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!req.user) throw new UnauthorizedError('Authentication required');
    const input = createSocialLinkSchema.parse(req.body);
    const created = await socialLinksService.createLink(req.user.id, input);
    reply.status(201).send({ data: created });
  }

  async updateLink(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> {
    if (!req.user) throw new UnauthorizedError('Authentication required');
    const input = updateSocialLinkSchema.parse(req.body);
    const updated = await socialLinksService.updateLink(req.user.id, req.params.id, input);
    reply.status(200).send({ data: updated });
  }

  async deleteLink(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> {
    if (!req.user) throw new UnauthorizedError('Authentication required');
    await socialLinksService.deleteLink(req.user.id, req.params.id);
    reply.status(200).send({ success: true });
  }

  async reorderLinks(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!req.user) throw new UnauthorizedError('Authentication required');
    const input = reorderSocialLinksSchema.parse(req.body);
    await socialLinksService.reorderLinks(req.user.id, input.linkIds);
    reply.status(200).send({ success: true });
  }

  // KM Items Handlers
  async getKmItems(
    req: FastifyRequest<{ Querystring: { category?: string; sort?: 'asc' | 'desc' } }>,
    reply: FastifyReply
  ): Promise<void> {
    if (!req.user) throw new UnauthorizedError('Authentication required');
    const items = await kmService.getUserKmItems(req.user.id, req.query);
    reply.status(200).send({ data: items });
  }

  async createKmItem(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!req.user) throw new UnauthorizedError('Authentication required');
    const input = createKmItemSchema.parse(req.body);

    let workspaceId = req.headers['x-workspace-id'] as string | undefined;
    if (!workspaceId) {
      const wsRes = await pool.query(
        `SELECT workspace_id FROM workspace_members WHERE user_id = $1 LIMIT 1`,
        [req.user.id]
      );
      if (wsRes.rowCount === 0) throw new NotFoundError('No active workspace found');
      workspaceId = wsRes.rows[0].workspace_id;
    }

    const created = await kmService.createKmItem(req.user.id, workspaceId as string, input);
    reply.status(201).send({ data: created });
  }

  async updateKmItem(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> {
    if (!req.user) throw new UnauthorizedError('Authentication required');
    const input = updateKmItemSchema.parse(req.body);
    const updated = await kmService.updateKmItem(req.user.id, req.params.id, input);
    reply.status(200).send({ data: updated });
  }

  async toggleKmVisibility(
    req: FastifyRequest<{ Params: { id: string }; Body: { visibility: 'public' | 'private' } }>,
    reply: FastifyReply
  ): Promise<void> {
    if (!req.user) throw new UnauthorizedError('Authentication required');
    const { visibility } = req.body;
    const updated = await kmService.toggleVisibility(req.user.id, req.params.id, visibility);
    reply.status(200).send({ data: updated });
  }

  async deleteKmItem(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> {
    if (!req.user) throw new UnauthorizedError('Authentication required');
    await kmService.deleteKmItem(req.user.id, req.params.id);
    reply.status(200).send({ success: true });
  }

  // Social discovery & link parsing handlers
  async discover(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const input = discoverSocialSchema.parse(request.body);
    const results = await socialDiscoveryService.search(input);
    reply.status(200).send({ data: results });
  }

  async parseLink(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const input = parseLinkSchema.parse(request.body);
    const metadata = await linkParserService.parseLink(input.url);
    reply.status(200).send({ data: metadata });
  }

  async updatePageSettings(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!request.user) throw new UnauthorizedError('Authentication required');
    const input = updatePageSettingsSchema.parse(request.body);
    const updated = await personalPageService.updatePageSettings(request.user.id, input);
    reply.status(200).send({ data: updated });
  }

  async importLink(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!request.user) throw new UnauthorizedError('Authentication required');
    const input = importLinkItemSchema.parse(request.body);
    let workspaceId = request.headers['x-workspace-id'] as string | undefined;

    if (!workspaceId) {
      const wsRes = await pool.query(
        `SELECT workspace_id FROM workspace_members WHERE user_id = $1 LIMIT 1`,
        [request.user.id]
      );
      if (wsRes.rowCount === 0) throw new NotFoundError('No active workspace found for user');
      workspaceId = wsRes.rows[0].workspace_id;
    }

    const item = await personalPageService.importLinkItem(request.user.id, workspaceId as string, input);
    reply.status(201).send({ data: item });
  }
}

export const personalController = new PersonalController();
