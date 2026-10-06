import { z } from 'zod';

export const timelineQuerySchema = z.object({
  from: z.string().datetime({ message: 'from must be a valid ISO 8601 date-time' }),
  to: z.string().datetime({ message: 'to must be a valid ISO 8601 date-time' }),
  granularity: z.enum(['decade', 'year', 'month', 'day']).default('year'),
  calendar: z.enum(['be', 'ce']).default('be'),
  tag_ids: z
    .union([z.string().transform((val) => [val]), z.array(z.string().uuid())])
    .optional(),
});

export type TimelineQueryInput = z.infer<typeof timelineQuerySchema>;
