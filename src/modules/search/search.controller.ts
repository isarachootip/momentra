import type { FastifyRequest, FastifyReply } from 'fastify';
import { searchQuerySchema } from './search.schemas.js';
import { searchService } from './search.service.js';
import type { SearchQueryParams } from './search.types.js';

export class SearchController {
  async search(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const validated = searchQuerySchema.parse(request.query);

    // Extract workspace ID from header, query, or fallback
    const workspaceId =
      (request.headers['x-workspace-id'] as string | undefined) ||
      (request.query as Record<string, string | undefined>)?.workspace_id;

    const searchParams: SearchQueryParams = {
      q: validated.q,
      type: validated.type,
      tags: Array.isArray(validated.tags) ? validated.tags : undefined,
      from_year: validated.from_year,
      to_year: validated.to_year,
      circa: validated.circa,
      sort: validated.sort,
      cursor: validated.cursor,
      limit: validated.limit,
      workspaceId,
    };

    const response = await searchService.search(searchParams);
    reply.status(200).send(response);
  }
}

export const searchController = new SearchController();
