import { pool } from '../../db/pool.js';
import type { ItemResponse } from '../items/item.types.js';
import type { MilestoneItem } from './timeline.types.js';

export class TimelineRepository {
  async fetchItemsForRange(
    workspaceId: string | undefined,
    from: string,
    to: string,
    tagIds?: string[] | undefined,
    limit = 500
  ): Promise<ItemResponse[]> {
    const conditions: string[] = [
      'deleted_at IS NULL',
      'event_time_range && tstzrange($1, $2, \'[]\')',
    ];
    const values: unknown[] = [from, to];
    let paramIdx = 3;

    if (workspaceId) {
      conditions.push(`workspace_id = $${paramIdx++}`);
      values.push(workspaceId);
    }

    if (tagIds && tagIds.length > 0) {
      conditions.push(`id IN (SELECT item_id FROM item_tags WHERE tag_id = ANY($${paramIdx++}))`);
      values.push(tagIds);
    }

    values.push(limit);

    const query = `
      SELECT 
        id, workspace_id, type, title, description,
        event_start, event_end, date_precision, is_circa, sort_key,
        dublin_core, created_at, updated_at
      FROM items
      WHERE ${conditions.join(' AND ')}
      ORDER BY sort_key ASC
      LIMIT $${paramIdx};
    `;

    const res = await pool.query<ItemResponse>(query, values);
    return res.rows;
  }

  async fetchMilestonesForRange(
    workspaceId: string | undefined,
    from: string,
    to: string
  ): Promise<MilestoneItem[]> {
    const conditions: string[] = [
      'target_date_start <= $2 AND target_date_end >= $1',
    ];
    const values: unknown[] = [from, to];
    let paramIdx = 3;

    if (workspaceId) {
      conditions.push(`workspace_id = $${paramIdx++}`);
      values.push(workspaceId);
    }

    const query = `
      SELECT 
        id, title, target_date_start, target_date_end, color, description
      FROM milestones
      WHERE ${conditions.join(' AND ')}
      ORDER BY target_date_start ASC;
    `;

    const res = await pool.query<MilestoneItem>(query, values);
    return res.rows;
  }
}

export const timelineRepository = new TimelineRepository();
