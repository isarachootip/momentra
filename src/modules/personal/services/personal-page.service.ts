import { pool } from '../../../db/pool.js';
import { NotFoundError, ConflictError } from '../../../core/errors/app-error.js';
import type {
  UpdatePageSettingsInput,
  ImportLinkItemInput,
} from '../schemas/personal-page.schema.js';

export interface PublicSocialLinkItem {
  id: string;
  platform: string;
  label: string;
  url: string;
  link_group: 'official' | 'personal';
  sort_order: number;
}

export interface PublicUserProfile {
  username: string;
  fullName: string;
  avatarUrl: string | null;
  pageBio: string | null;
  pageTemplate: string;
  pageTheme: { theme: string; accent: string };
  planCode: string;
  officialLinks: PublicSocialLinkItem[];
  personalLinks: PublicSocialLinkItem[];
  socialLinks: Record<string, string>;
}

export interface PublicPageResponse {
  profile: PublicUserProfile;
  items: Array<Record<string, unknown>>;
  collections: Array<Record<string, unknown>>;
}

export class PersonalPageService {
  public normalizeDateRange(dateStr: string): { start: Date; end: Date } {
    const parts = dateStr.trim().split('-');
    const year = parseInt(parts[0] ?? '2026', 10);

    if (parts.length === 1) {
      return {
        start: new Date(Date.UTC(year, 0, 1, 0, 0, 0)),
        end: new Date(Date.UTC(year, 11, 31, 23, 59, 59)),
      };
    }
    if (parts.length === 2) {
      const month = parseInt(parts[1] ?? '1', 10) - 1;
      const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
      return {
        start: new Date(Date.UTC(year, month, 1, 0, 0, 0)),
        end: new Date(Date.UTC(year, month, lastDay, 23, 59, 59)),
      };
    }
    const month = parseInt(parts[1] ?? '1', 10) - 1;
    const day = parseInt(parts[2] ?? '1', 10);
    return {
      start: new Date(Date.UTC(year, month, day, 0, 0, 0)),
      end: new Date(Date.UTC(year, month, day, 23, 59, 59)),
    };
  }

  public async getPublicProfile(rawUsername: string): Promise<PublicPageResponse> {
    const cleanUsername = rawUsername.replace(/^@/, '').toLowerCase().trim();

    const userRes = await pool.query(
      `SELECT id, full_name, avatar_url, username, custom_domain, page_template, page_theme, page_bio, social_links
       FROM users
       WHERE (LOWER(username) = LOWER($1) OR LOWER(custom_domain) = LOWER($1))
         AND is_page_published = TRUE AND deleted_at IS NULL
       LIMIT 1`,
      [cleanUsername]
    );

    if (userRes.rowCount === 0) {
      throw new NotFoundError(`User @${cleanUsername} not found or page is not published`);
    }

    const user = userRes.rows[0];

    const [itemsRes, collectionsRes, linksRes, subRes] = await Promise.all([
      pool.query(
        `SELECT id, workspace_id, type, km_category, title, description, event_start, event_end,
                date_precision, is_circa, sort_key, embed_metadata, is_public, created_at
         FROM items
         WHERE created_by = $1 AND is_public = TRUE AND deleted_at IS NULL
         ORDER BY event_start ASC, created_at DESC`,
        [user.id]
      ),
      pool.query(
        `SELECT id, workspace_id, title, description, is_public, display_order, created_at
         FROM collections
         WHERE created_by = $1 AND is_public = TRUE
         ORDER BY display_order ASC, created_at ASC`,
        [user.id]
      ),
      pool.query(
        `SELECT id, platform, label, url, link_group, sort_order
         FROM user_social_links
         WHERE user_id = $1 AND visibility = 'public'
         ORDER BY sort_order ASC, created_at ASC`,
        [user.id]
      ),
      pool.query(
        `SELECT plan_code FROM user_subscriptions WHERE user_id = $1 AND status = 'active' LIMIT 1`,
        [user.id]
      ),
    ]);

    const officialLinks = linksRes.rows.filter((l) => l.link_group === 'official');
    const personalLinks = linksRes.rows.filter((l) => l.link_group === 'personal');
    const planCode = subRes.rows[0]?.plan_code ?? 'free';

    return {
      profile: {
        username: user.username,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
        pageBio: user.page_bio,
        pageTemplate: user.page_template,
        pageTheme: user.page_theme,
        planCode,
        officialLinks,
        personalLinks,
        socialLinks: user.social_links ?? {},
      },
      items: itemsRes.rows,
      collections: collectionsRes.rows,
    };
  }

  public async updatePageSettings(
    userId: string,
    input: UpdatePageSettingsInput
  ): Promise<Record<string, unknown>> {
    if (input.username) {
      const clash = await pool.query(
        `SELECT id FROM users WHERE LOWER(username) = LOWER($1) AND id != $2 LIMIT 1`,
        [input.username, userId]
      );
      if ((clash.rowCount ?? 0) > 0) {
        throw new ConflictError(`Username "${input.username}" is already in use`);
      }
    }

    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (input.username !== undefined) {
      fields.push(`username = $${idx++}`);
      values.push(input.username.toLowerCase());
    }
    if (input.isPagePublished !== undefined) {
      fields.push(`is_page_published = $${idx++}`);
      values.push(input.isPagePublished);
    }
    if (input.pageTemplate !== undefined) {
      fields.push(`page_template = $${idx++}`);
      values.push(input.pageTemplate);
    }
    if (input.pageTheme !== undefined) {
      fields.push(`page_theme = $${idx++}`);
      values.push(JSON.stringify(input.pageTheme));
    }
    if (input.pageBio !== undefined) {
      fields.push(`page_bio = $${idx++}`);
      values.push(input.pageBio);
    }
    if (input.socialLinks !== undefined) {
      fields.push(`social_links = $${idx++}`);
      values.push(JSON.stringify(input.socialLinks));
    }

    if (fields.length === 0) {
      const current = await pool.query(`SELECT * FROM users WHERE id = $1`, [userId]);
      return current.rows[0];
    }

    values.push(userId);
    const sql = `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING id, username, is_page_published, page_template, page_theme, page_bio, social_links`;
    const res = await pool.query(sql, values);
    return res.rows[0];
  }

  public async importLinkItem(
    userId: string,
    workspaceId: string,
    input: ImportLinkItemInput
  ): Promise<Record<string, unknown>> {
    const { start, end } = this.normalizeDateRange(input.eventDate);
    const domain = new URL(input.url).hostname;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const itemRes = await client.query(
        `INSERT INTO items (
          workspace_id, type, title, description, event_start, event_end,
          date_precision, is_circa, sort_key, visibility, is_public, embed_metadata, created_by
        ) VALUES (
          $1, 'link', $2, $3, $4, $5, $6, $7, 0, 'workspace', $8, $9, $10
        ) RETURNING *`,
        [
          workspaceId,
          input.title,
          input.description ?? null,
          start,
          end,
          input.datePrecision,
          input.isCirca,
          input.isPublic,
          input.embedMetadata ? JSON.stringify(input.embedMetadata) : null,
          userId,
        ]
      );

      const createdItem = itemRes.rows[0];

      await client.query(
        `INSERT INTO links (
          item_id, url, normalized_url, domain, og_title, og_description
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          createdItem.id,
          input.url,
          input.url.toLowerCase(),
          domain,
          input.title,
          input.description ?? null,
        ]
      );

      if (input.collectionId) {
        await client.query(
          `INSERT INTO collection_items (collection_id, item_id, sort_order)
           VALUES ($1, $2, 0)
           ON CONFLICT DO NOTHING`,
          [input.collectionId, createdItem.id]
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
}

export const personalPageService = new PersonalPageService();
