-- Migration: 004_personal_hub_and_subscriptions.sql
-- Description: Personal Hub enhancements, User Social Links, Subscription Plans, and Billing Invoices

-- 1. Subscription Plans (Configurable Tiers)
CREATE TABLE IF NOT EXISTS subscription_plans (
    plan_code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price_thb_monthly INT NOT NULL DEFAULT 0,
    max_links INT NOT NULL DEFAULT 5, -- -1 for unlimited
    max_km_items INT NOT NULL DEFAULT 20, -- -1 for unlimited
    max_storage_bytes BIGINT NOT NULL DEFAULT 524288000, -- 500MB
    features JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial plans
INSERT INTO subscription_plans (plan_code, name, price_thb_monthly, max_links, max_km_items, max_storage_bytes, features)
VALUES
('free', 'Free Starter', 0, 5, 20, 524288000, '{"stats": false, "multi_admin": false, "custom_domain": false}'::jsonb),
('pro', 'Pro Personal Hub', 199, -1, -1, 21474836480, '{"stats": true, "multi_admin": false, "custom_domain": false}'::jsonb),
('organization', 'Organization Suite', 990, -1, -1, 214748364800, '{"stats": true, "multi_admin": true, "custom_domain": true}'::jsonb)
ON CONFLICT (plan_code) DO UPDATE SET
    name = EXCLUDED.name,
    price_thb_monthly = EXCLUDED.price_thb_monthly,
    max_links = EXCLUDED.max_links,
    max_km_items = EXCLUDED.max_km_items,
    max_storage_bytes = EXCLUDED.max_storage_bytes,
    features = EXCLUDED.features;

-- 2. User Subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_code VARCHAR(50) NOT NULL REFERENCES subscription_plans(plan_code),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
    payment_provider VARCHAR(50) NOT NULL DEFAULT 'system',
    provider_customer_id VARCHAR(255) NULL,
    provider_subscription_id VARCHAR(255) NULL,
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_subscription UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);

-- 3. Payment Invoices
CREATE TABLE IF NOT EXISTS payment_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NULL REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_thb INT NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'THB',
    payment_method VARCHAR(50) NOT NULL DEFAULT 'promptpay' CHECK (payment_method IN ('card', 'promptpay')),
    status VARCHAR(50) NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'failed')),
    provider_invoice_id VARCHAR(255) NULL,
    paid_at TIMESTAMPTZ NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_invoices_user ON payment_invoices(user_id, created_at DESC);

-- 4. User Social Links (Structured with official/personal grouping & ordering)
CREATE TABLE IF NOT EXISTS user_social_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('facebook', 'instagram', 'tiktok', 'youtube', 'line', 'x', 'linkedin', 'website', 'email', 'other')),
    label VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    link_group VARCHAR(20) NOT NULL DEFAULT 'personal' CHECK (link_group IN ('official', 'personal')),
    visibility VARCHAR(20) NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'private')),
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_social_links_user ON user_social_links(user_id, sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_user_social_links_public ON user_social_links(user_id, visibility) WHERE visibility = 'public';

-- 5. Extend Items with KM Category
ALTER TABLE items 
    ADD COLUMN IF NOT EXISTS km_category VARCHAR(50) NULL 
    CHECK (km_category IN ('article', 'video', 'image', 'document', 'note'));

CREATE INDEX IF NOT EXISTS idx_items_km_category ON items(km_category) WHERE km_category IS NOT NULL;

-- 6. Row Level Security for Anonymous Public Read of Social Links
ALTER TABLE user_social_links ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_social_links' AND policyname = 'social_links_public_read_policy'
    ) THEN
        CREATE POLICY social_links_public_read_policy ON user_social_links
            FOR SELECT
            USING (
                visibility = 'public' 
                AND EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id = user_social_links.user_id 
                    AND users.is_page_published = TRUE
                )
            );
    END IF;
END $$;
