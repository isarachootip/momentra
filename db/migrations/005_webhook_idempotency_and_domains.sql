-- Migration: 005_webhook_idempotency_and_domains.sql
-- Description: Webhook Idempotency Tracking and Custom Domains for Organization Tier

-- 1. Processed Webhook Events Table (Prevents Replay Attacks & Duplicate Billing)
CREATE TABLE IF NOT EXISTS processed_webhook_events (
    event_id VARCHAR(255) PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    payment_provider VARCHAR(50) NOT NULL DEFAULT 'stripe',
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_processed_events_type ON processed_webhook_events(event_type, processed_at DESC);

-- 2. Add Custom Domain to Users (Organization Tier Feature)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(255) UNIQUE NULL;

CREATE INDEX IF NOT EXISTS idx_users_custom_domain ON users(custom_domain) WHERE custom_domain IS NOT NULL;
