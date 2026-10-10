import { pool } from '../../../db/pool.js';
import { NotFoundError } from '../../../core/errors/app-error.js';
import { quotaService } from '../../billing/quota.service.js';
import type {
  CreateSocialLinkInput,
  UpdateSocialLinkInput,
} from '../schemas/personal-hub.schema.js';

export interface SocialLinkRecord {
  id: string;
  user_id: string;
  platform: string;
  label: string;
  url: string;
  link_group: 'official' | 'personal';
  visibility: 'public' | 'private';
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export class SocialLinksService {
  public async getUserLinks(userId: string): Promise<SocialLinkRecord[]> {
    const res = await pool.query(
      `SELECT * FROM user_social_links WHERE user_id = $1 ORDER BY sort_order ASC, created_at ASC`,
      [userId]
    );
    return res.rows;
  }

  public async createLink(userId: string, input: CreateSocialLinkInput): Promise<SocialLinkRecord> {
    await quotaService.assertCanCreateLink(userId);

    const orderRes = await pool.query(
      `SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM user_social_links WHERE user_id = $1`,
      [userId]
    );
    const nextOrder = input.sortOrder ?? orderRes.rows[0].next_order;

    const res = await pool.query(
      `INSERT INTO user_social_links (user_id, platform, label, url, link_group, visibility, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userId,
        input.platform,
        input.label.trim(),
        input.url.trim(),
        input.linkGroup,
        input.visibility,
        nextOrder,
      ]
    );

    return res.rows[0];
  }

  public async updateLink(
    userId: string,
    linkId: string,
    input: UpdateSocialLinkInput
  ): Promise<SocialLinkRecord> {
    const check = await pool.query(
      `SELECT id FROM user_social_links WHERE id = $1 AND user_id = $2`,
      [linkId, userId]
    );
    if (check.rowCount === 0) {
      throw new NotFoundError('Social link not found');
    }

    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (input.platform !== undefined) {
      fields.push(`platform = $${idx++}`);
      values.push(input.platform);
    }
    if (input.label !== undefined) {
      fields.push(`label = $${idx++}`);
      values.push(input.label.trim());
    }
    if (input.url !== undefined) {
      fields.push(`url = $${idx++}`);
      values.push(input.url.trim());
    }
    if (input.linkGroup !== undefined) {
      fields.push(`link_group = $${idx++}`);
      values.push(input.linkGroup);
    }
    if (input.visibility !== undefined) {
      fields.push(`visibility = $${idx++}`);
      values.push(input.visibility);
    }
    if (input.sortOrder !== undefined) {
      fields.push(`sort_order = $${idx++}`);
      values.push(input.sortOrder);
    }

    if (fields.length === 0) {
      const current = await pool.query(`SELECT * FROM user_social_links WHERE id = $1`, [linkId]);
      return current.rows[0];
    }

    values.push(linkId, userId);
    const sql = `UPDATE user_social_links SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx++} AND user_id = $${idx} RETURNING *`;
    const res = await pool.query(sql, values);
    return res.rows[0];
  }

  public async deleteLink(userId: string, linkId: string): Promise<void> {
    const res = await pool.query(
      `DELETE FROM user_social_links WHERE id = $1 AND user_id = $2 RETURNING id`,
      [linkId, userId]
    );
    if (res.rowCount === 0) {
      throw new NotFoundError('Social link not found');
    }
  }

  public async reorderLinks(userId: string, linkIds: string[]): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (let i = 0; i < linkIds.length; i++) {
        await client.query(
          `UPDATE user_social_links SET sort_order = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3`,
          [i, linkIds[i], userId]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

export const socialLinksService = new SocialLinksService();
