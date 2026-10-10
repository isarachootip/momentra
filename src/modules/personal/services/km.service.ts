import { pool } from '../../../db/pool.js';
import { NotFoundError } from '../../../core/errors/app-error.js';
import { quotaService } from '../../billing/quota.service.js';
import { personalPageService } from './personal-page.service.js';
import type { CreateKmItemInput, UpdateKmItemInput } from '../schemas/personal-hub.schema.js';

export class KmService {
  public async getUserKmItems(
    userId: string,
    filters?: { category?: string; sort?: 'asc' | 'desc' }
  ): Promise<Array<Record<string, unknown>>> {
    const values: unknown[] = [userId];
    let query = `
      SELECT i.id, i.workspace_id, i.type, i.title, i.description, i.km_category,
             i.event_start, i.event_end, i.date_precision, i.is_circa, i.sort_key,
             i.visibility, i.is_public, i.created_at, i.updated_at,
             l.url AS link_url,
             COALESCE(json_agg(t.name) FILTER (WHERE t.name IS NOT NULL), '[]'::json) AS tags
      FROM items i
      LEFT JOIN links l ON l.item_id = i.id
      LEFT JOIN item_tags it ON it.item_id = i.id
      LEFT JOIN tags t ON t.id = it.tag_id
      WHERE i.created_by = $1 AND i.deleted_at IS NULL
    `;

    if (filters?.category && filters.category !== 'all') {
      values.push(filters.category);
      query += ` AND i.km_category = $${values.length}`;
    }

    const sortOrder = filters?.sort === 'asc' ? 'ASC' : 'DESC';
    query += ` GROUP BY i.id, l.url ORDER BY i.event_start ${sortOrder}, i.created_at DESC`;

    const res = await pool.query(query, values);
    return res.rows;
  }

  public async createKmItem(
    userId: string,
    workspaceId: string,
    input: CreateKmItemInput
  ): Promise<Record<string, unknown>> {
    await quotaService.assertCanCreateKmItem(userId);

    const { start, end } = personalPageService.normalizeDateRange(input.eventDate);
    const isPub = input.visibility === 'public';
    const itemType = input.url && input.url.trim() !== '' ? 'link' : 'note';

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const itemRes = await client.query(
        `INSERT INTO items (
           workspace_id, type, title, description, km_category,
           event_start, event_end, date_precision, is_circa, sort_key,
           visibility, is_public, created_by
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, $10, $11, $12)
         RETURNING *`,
        [
          workspaceId,
          itemType,
          input.title.trim(),
          input.summary?.trim() ?? null,
          input.kmCategory,
          start,
          end,
          input.datePrecision,
          input.isCirca,
          input.visibility,
          isPub,
          userId,
        ]
      );
      const createdItem = itemRes.rows[0];

      if (input.url && input.url.trim() !== '') {
        const domain = new URL(input.url).hostname;
        await client.query(
          `INSERT INTO links (item_id, url, normalized_url, domain, og_title)
           VALUES ($1, $2, $3, $4, $5)`,
          [createdItem.id, input.url.trim(), input.url.trim().toLowerCase(), domain, input.title]
        );
      }

      await client.query('COMMIT');
      return createdItem;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  public async updateKmItem(
    userId: string,
    itemId: string,
    input: UpdateKmItemInput
  ): Promise<Record<string, unknown>> {
    const check = await pool.query(`SELECT id FROM items WHERE id = $1 AND created_by = $2 AND deleted_at IS NULL`, [itemId, userId]);
    if (check.rowCount === 0) {
      throw new NotFoundError('KM item not found');
    }

    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (input.title !== undefined) {
      fields.push(`title = $${idx++}`);
      values.push(input.title.trim());
    }
    if (input.summary !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(input.summary.trim());
    }
    if (input.kmCategory !== undefined) {
      fields.push(`km_category = $${idx++}`);
      values.push(input.kmCategory);
    }
    if (input.visibility !== undefined) {
      const isPub = input.visibility === 'public';
      fields.push(`visibility = $${idx++}`);
      values.push(input.visibility);
      fields.push(`is_public = $${idx++}`);
      values.push(isPub);
    }

    if (fields.length === 0) {
      const current = await pool.query(`SELECT * FROM items WHERE id = $1`, [itemId]);
      return current.rows[0];
    }

    values.push(itemId, userId);
    const sql = `UPDATE items SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx++} AND created_by = $${idx} RETURNING *`;
    const res = await pool.query(sql, values);
    return res.rows[0];
  }

  public async toggleVisibility(
    userId: string,
    itemId: string,
    visibility: 'public' | 'private'
  ): Promise<Record<string, unknown>> {
    const isPub = visibility === 'public';
    const res = await pool.query(
      `UPDATE items 
       SET visibility = $1, is_public = $2, updated_at = NOW()
       WHERE id = $3 AND created_by = $4 AND deleted_at IS NULL
       RETURNING id, title, visibility, is_public, updated_at`,
      [visibility, isPub, itemId, userId]
    );
    if (res.rowCount === 0) {
      throw new NotFoundError('KM item not found');
    }
    return res.rows[0];
  }

  public async deleteKmItem(userId: string, itemId: string): Promise<void> {
    const res = await pool.query(
      `UPDATE items SET deleted_at = NOW() WHERE id = $1 AND created_by = $2 AND deleted_at IS NULL RETURNING id`,
      [itemId, userId]
    );
    if (res.rowCount === 0) {
      throw new NotFoundError('KM item not found');
    }
  }
}

export const kmService = new KmService();
