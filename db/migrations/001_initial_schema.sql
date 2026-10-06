-- ============================================================================
-- Migration: 001_initial_schema.sql
-- Project: Momentra (Historical Digital Asset Management - HDAM)
-- Description: Core Schema with Imprecise Event Dates, Multi-Tenancy RLS, 
--              Dublin Core JSONB, and Full-Text / Range / Trigram Indexes.
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. Generic updated_at Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Workspaces (Tenant Root)
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'personal' CHECK (type IN ('personal', 'organization')),
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

CREATE TRIGGER trg_workspaces_updated_at
BEFORE UPDATE ON workspaces
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Workspace Members (RBAC)
CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'contributor', 'viewer')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_workspace_member UNIQUE (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members (user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_ws_role ON workspace_members (workspace_id, role);

-- 6. Items (Parent Entity for Everything on the Historical Timeline)
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('asset', 'link', 'note', 'event')),
    title VARCHAR(500) NOT NULL,
    description TEXT NULL,
    event_start TIMESTAMPTZ NOT NULL,
    event_end TIMESTAMPTZ NOT NULL,
    event_time_range TSTZRANGE GENERATED ALWAYS AS (tstzrange(event_start, event_end, '[]')) STORED,
    date_precision VARCHAR(10) NOT NULL DEFAULT 'day' CHECK (date_precision IN ('year', 'month', 'day', 'datetime')),
    is_circa BOOLEAN NOT NULL DEFAULT false,
    sort_key BIGINT NOT NULL,
    location JSONB NULL DEFAULT '{}'::jsonb,
    dublin_core JSONB NOT NULL DEFAULT '{}'::jsonb,
    search_vector TSVECTOR NULL,
    embedding VECTOR(1536) NULL,
    visibility VARCHAR(50) NOT NULL DEFAULT 'workspace' CHECK (visibility IN ('private', 'workspace', 'public')),
    created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT chk_event_range CHECK (event_end >= event_start)
);

CREATE TRIGGER trg_items_updated_at
BEFORE UPDATE ON items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Items Trigger: Auto-populate Search Vector & Sort Key fallback
CREATE OR REPLACE FUNCTION items_before_insert_or_update()
RETURNS TRIGGER AS $$
DECLARE
    dc_text TEXT;
    loc_text TEXT;
    prec_weight INT;
BEGIN
    -- 1. Precision weight for deterministic chronological sorting
    prec_weight := CASE NEW.date_precision
        WHEN 'year' THEN 1
        WHEN 'month' THEN 2
        WHEN 'day' THEN 3
        WHEN 'datetime' THEN 4
        ELSE 0
    END;

    -- 2. Calculate sort_key: (Epoch seconds * 100) + precision weight
    IF NEW.sort_key IS NULL OR NEW.sort_key = 0 THEN
        NEW.sort_key := (EXTRACT(EPOCH FROM NEW.event_start)::BIGINT * 100) + prec_weight;
    END IF;

    -- 3. Extract Dublin Core string values if present
    dc_text := COALESCE(NEW.dublin_core->>'creator', '') || ' ' ||
               COALESCE(NEW.dublin_core->>'subject', '') || ' ' ||
               COALESCE(NEW.dublin_core->>'publisher', '') || ' ' ||
               COALESCE(NEW.dublin_core->>'coverage', '');

    loc_text := COALESCE(NEW.location->>'name', '') || ' ' ||
                COALESCE(NEW.location->>'city', '') || ' ' ||
                COALESCE(NEW.location->>'country', '');

    -- 4. Populate search_vector with Weighted Components (A: Title, B: Description, C: DC & Location)
    NEW.search_vector := 
        setweight(to_tsvector('simple', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('simple', TRIM(dc_text || ' ' || loc_text)), 'C');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_items_search_vector_and_sort
BEFORE INSERT OR UPDATE ON items
FOR EACH ROW EXECUTE FUNCTION items_before_insert_or_update();

-- Essential Indexes for Items
CREATE INDEX IF NOT EXISTS idx_items_ws_event_range ON items USING GIST (workspace_id, event_time_range);
CREATE INDEX IF NOT EXISTS idx_items_ws_event_start ON items (workspace_id, event_start) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_items_ws_sort_key ON items (workspace_id, sort_key) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_items_search_vector ON items USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_items_trgm_title ON items USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_items_dublin_core ON items USING GIN (dublin_core);
CREATE INDEX IF NOT EXISTS idx_items_deleted_at ON items (deleted_at) WHERE deleted_at IS NOT NULL;

-- 7. Assets (Child Table for Binary Files)
CREATE TABLE IF NOT EXISTS assets (
    item_id UUID PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
    storage_key TEXT NOT NULL,
    original_filename VARCHAR(500) NOT NULL,
    mime_type VARCHAR(150) NOT NULL,
    size_bytes BIGINT NOT NULL CHECK (size_bytes >= 0),
    checksum_sha256 CHAR(64) NOT NULL,
    width INT NULL CHECK (width >= 0),
    height INT NULL CHECK (height >= 0),
    duration_sec NUMERIC(10, 2) NULL CHECK (duration_sec >= 0),
    exif_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading', 'processing', 'ready', 'failed', 'quarantined'))
);

CREATE INDEX IF NOT EXISTS idx_assets_checksum ON assets (checksum_sha256);
CREATE INDEX IF NOT EXISTS idx_assets_mime_type ON assets (mime_type);
CREATE INDEX IF NOT EXISTS idx_assets_exif_json ON assets USING GIN (exif_json);

-- 8. Asset Derivatives (Thumbnails, Video HLS Previews, Audio Waveforms)
CREATE TABLE IF NOT EXISTS asset_derivatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_item_id UUID NOT NULL REFERENCES assets(item_id) ON DELETE CASCADE,
    derivative_type VARCHAR(50) NOT NULL CHECK (derivative_type IN ('thumbnail_sm', 'thumbnail_md', 'thumbnail_lg', 'preview_hls', 'waveform')),
    storage_key TEXT NOT NULL,
    mime_type VARCHAR(150) NOT NULL,
    width INT NULL CHECK (width >= 0),
    height INT NULL CHECK (height >= 0),
    size_bytes BIGINT NOT NULL CHECK (size_bytes >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asset_derivatives_parent ON asset_derivatives (asset_item_id, derivative_type);

-- 9. Asset Versions (File History Tracking)
CREATE TABLE IF NOT EXISTS asset_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_item_id UUID NOT NULL REFERENCES assets(item_id) ON DELETE CASCADE,
    version_number INT NOT NULL CHECK (version_number >= 1),
    storage_key TEXT NOT NULL,
    checksum_sha256 CHAR(64) NOT NULL,
    size_bytes BIGINT NOT NULL CHECK (size_bytes >= 0),
    change_summary TEXT NULL,
    created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_asset_version UNIQUE (asset_item_id, version_number)
);

-- 10. Links (External URLs with OpenGraph Ingestion)
CREATE TABLE IF NOT EXISTS links (
    item_id UUID PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    normalized_url TEXT NOT NULL,
    domain VARCHAR(255) NOT NULL,
    og_title VARCHAR(500) NULL,
    og_description TEXT NULL,
    og_image TEXT NULL,
    last_checked_at TIMESTAMPTZ NULL,
    http_status INT NULL,
    is_broken BOOLEAN NOT NULL DEFAULT false,
    archived_snapshot_key TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_links_domain ON links (domain);
CREATE INDEX IF NOT EXISTS idx_links_broken ON links (is_broken) WHERE is_broken = true;

-- 11. Tags & Item Tags
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#64748B',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_workspace_tag UNIQUE (workspace_id, name)
);

CREATE TABLE IF NOT EXISTS item_tags (
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (item_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_item_tags_tag ON item_tags (tag_id);

-- 12. Collections & Collection Items (Curated Thematic Sets)
CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    description TEXT NULL,
    cover_item_id UUID NULL REFERENCES items(id) ON DELETE SET NULL,
    created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

CREATE TRIGGER trg_collections_updated_at
BEFORE UPDATE ON collections
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS collection_items (
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    sort_order INT NOT NULL DEFAULT 0,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (collection_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_collection_items_sort ON collection_items (collection_id, sort_order ASC);

-- 13. Entities (People, Organizations, Places) & Item Entities
CREATE TABLE IF NOT EXISTS entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(300) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('person', 'organization', 'location', 'event_concept')),
    description TEXT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entities_ws_type ON entities (workspace_id, type);
CREATE INDEX IF NOT EXISTS idx_entities_name_trgm ON entities USING GIN (name gin_trgm_ops);

CREATE TABLE IF NOT EXISTS item_entities (
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    role_in_event VARCHAR(100) NOT NULL DEFAULT 'subject',
    PRIMARY KEY (item_id, entity_id, role_in_event)
);

CREATE INDEX IF NOT EXISTS idx_item_entities_entity ON item_entities (entity_id);

-- 14. Milestones (Visual Highlighting on Historical Timeline)
CREATE TABLE IF NOT EXISTS milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    description TEXT NULL,
    item_id UUID NULL REFERENCES items(id) ON DELETE SET NULL,
    target_date_start TIMESTAMPTZ NOT NULL,
    target_date_end TIMESTAMPTZ NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#E11D48',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_milestone_range CHECK (target_date_end >= target_date_start)
);

CREATE INDEX IF NOT EXISTS idx_milestones_ws_date ON milestones (workspace_id, target_date_start);

-- 15. Custom Fields & Dynamic Values (Flexible Metadata)
CREATE TABLE IF NOT EXISTS custom_field_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    field_type VARCHAR(50) NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'select', 'json')),
    options JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_required BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_workspace_custom_field UNIQUE (workspace_id, field_name)
);

CREATE TABLE IF NOT EXISTS item_custom_values (
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    field_definition_id UUID NOT NULL REFERENCES custom_field_definitions(id) ON DELETE CASCADE,
    value_json JSONB NOT NULL,
    PRIMARY KEY (item_id, field_definition_id)
);

CREATE INDEX IF NOT EXISTS idx_item_custom_values_json ON item_custom_values USING GIN (value_json);

-- 16. Shares (Passcode-Protected External Access Links)
CREATE TABLE IF NOT EXISTS shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    collection_id UUID NULL REFERENCES collections(id) ON DELETE CASCADE,
    item_id UUID NULL REFERENCES items(id) ON DELETE CASCADE,
    share_token VARCHAR(64) UNIQUE NOT NULL,
    passcode_hash VARCHAR(255) NULL,
    permission VARCHAR(50) NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'download')),
    expires_at TIMESTAMPTZ NULL,
    max_uses INT NULL,
    use_count INT NOT NULL DEFAULT 0,
    created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shares_token ON shares (share_token);

-- 17. Immutable Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    actor_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    old_values JSONB NULL,
    new_values JSONB NULL,
    ip_address INET NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_ws_date ON audit_logs (workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity_type, entity_id);

-- ============================================================================
-- 18. Row-Level Security (RLS) Policies
-- Enforcing workspace isolation via session parameter: app.current_workspace_id
-- ============================================================================

-- Function to read current tenant context safely
CREATE OR REPLACE FUNCTION current_workspace_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_workspace_id', true), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Enable RLS on Tenant-specific tables
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Items RLS Policy
CREATE POLICY items_tenant_policy ON items
    FOR ALL
    USING (workspace_id = current_workspace_id())
    WITH CHECK (workspace_id = current_workspace_id());

-- Tags RLS Policy
CREATE POLICY tags_tenant_policy ON tags
    FOR ALL
    USING (workspace_id = current_workspace_id())
    WITH CHECK (workspace_id = current_workspace_id());

-- Collections RLS Policy
CREATE POLICY collections_tenant_policy ON collections
    FOR ALL
    USING (workspace_id = current_workspace_id())
    WITH CHECK (workspace_id = current_workspace_id());

-- Entities RLS Policy
CREATE POLICY entities_tenant_policy ON entities
    FOR ALL
    USING (workspace_id = current_workspace_id())
    WITH CHECK (workspace_id = current_workspace_id());

-- Milestones RLS Policy
CREATE POLICY milestones_tenant_policy ON milestones
    FOR ALL
    USING (workspace_id = current_workspace_id())
    WITH CHECK (workspace_id = current_workspace_id());

-- Custom Fields RLS Policy
CREATE POLICY custom_field_definitions_tenant_policy ON custom_field_definitions
    FOR ALL
    USING (workspace_id = current_workspace_id())
    WITH CHECK (workspace_id = current_workspace_id());

-- Shares RLS Policy
CREATE POLICY shares_tenant_policy ON shares
    FOR ALL
    USING (workspace_id = current_workspace_id())
    WITH CHECK (workspace_id = current_workspace_id());

-- Audit Logs RLS Policy
CREATE POLICY audit_logs_tenant_policy ON audit_logs
    FOR ALL
    USING (workspace_id = current_workspace_id())
    WITH CHECK (workspace_id = current_workspace_id());
