-- Migration: 003_personal_portal.sql
-- Description: Personal Social Portal, Link Ingestion, and Public Bento/Timeline Engine

-- 1. Extend Users table for Public Profile and Template Customization
ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE,
    ADD COLUMN IF NOT EXISTS is_page_published BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS page_template VARCHAR(50) NOT NULL DEFAULT 'bento',
    ADD COLUMN IF NOT EXISTS page_theme JSONB NOT NULL DEFAULT '{"theme": "dark", "accent": "#3b82f6"}'::jsonb,
    ADD COLUMN IF NOT EXISTS page_bio TEXT NULL,
    ADD COLUMN IF NOT EXISTS social_links JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 2. Extend Items table for Public Access and Social Embeds
ALTER TABLE items 
    ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS embed_metadata JSONB NULL;

-- 3. Extend Collections table for Public Showcase Grouping
ALTER TABLE collections 
    ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS display_order INT NOT NULL DEFAULT 0;

-- 4. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_items_public ON items(created_by, is_public) WHERE is_public = TRUE AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_collections_public ON collections(created_by, is_public) WHERE is_public = TRUE;

-- 5. RLS Policies for Anonymous Public Read
-- Allows reading items marked as public if the author's personal page is published
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'items' AND policyname = 'items_public_read_policy'
    ) THEN
        CREATE POLICY items_public_read_policy ON items
            FOR SELECT
            USING (
                is_public = TRUE 
                AND deleted_at IS NULL 
                AND EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id = items.created_by 
                    AND users.is_page_published = TRUE
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'collections' AND policyname = 'collections_public_read_policy'
    ) THEN
        CREATE POLICY collections_public_read_policy ON collections
            FOR SELECT
            USING (
                is_public = TRUE 
                AND EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id = collections.created_by 
                    AND users.is_page_published = TRUE
                )
            );
    END IF;
END $$;
