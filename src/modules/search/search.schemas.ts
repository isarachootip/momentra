import { z } from 'zod';

export const searchQuerySchema = z.object({
  q: z.string().optional(),
  type: z.enum(['asset', 'link', 'note', 'event']).optional(),
  tags: z
    .union([z.string().transform((val) => [val]), z.array(z.string())])
    .optional(),
  from_year: z.coerce.number().int().optional(),
  to_year: z.coerce.number().int().optional(),
  circa: z
    .string()
    .transform((val) => val === 'true' || val === '1')
    .or(z.boolean())
    .optional(),
  sort: z
    .enum(['event_date_asc', 'event_date_desc', 'created_at_desc', 'relevance'])
    .default('event_date_asc'),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
