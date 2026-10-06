import type { FastifyRequest, FastifyReply } from 'fastify';
import { timelineQuerySchema } from './timeline.schemas.js';
import { timelineService } from './timeline.service.js';
import type { TimelineQueryParams } from './timeline.types.js';

export class TimelineController {
  async getTimeline(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const validated = timelineQuerySchema.parse(request.query);

    const workspaceId =
      (request.headers['x-workspace-id'] as string | undefined) ||
      (request.query as Record<string, string | undefined>)?.workspace_id;

    const params: TimelineQueryParams = {
      from: validated.from,
      to: validated.to,
      granularity: validated.granularity,
      calendar: validated.calendar,
      tag_ids: Array.isArray(validated.tag_ids) ? validated.tag_ids : undefined,
      workspaceId,
    };

    const response = await timelineService.getTimeline(params);
    reply.status(200).send(response);
  }
}

export const timelineController = new TimelineController();
