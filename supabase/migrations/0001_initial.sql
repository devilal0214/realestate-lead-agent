-- ============================================================
-- Migration: 0001_initial.sql
-- Complete schema with RLS policies for Supabase
-- ============================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Enums ───────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "role" AS ENUM ('owner', 'admin', 'member');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "lead_status" AS ENUM ('new', 'qualified', 'contacted', 'won', 'lost');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "plan" AS ENUM ('free', 'starter', 'pro', 'enterprise');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "tenant_status" AS ENUM ('active', 'suspended', 'deleted');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "message_role" AS ENUM ('user', 'assistant', 'system');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "widget_position" AS ENUM ('bottom-right', 'bottom-left', 'top-right', 'top-left');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ─── Tables ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "profiles" (
  "id" uuid PRIMARY KEY,
  "email" text NOT NULL,
  "full_name" text,
  "avatar_url" text,
  "is_admin" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "tenants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "logo_url" text,
  "plan" "plan" NOT NULL DEFAULT 'free',
  "status" "tenant_status" NOT NULL DEFAULT 'active',
  "custom_domain" text,
  "settings" jsonb NOT NULL DEFAULT '{}',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "tenants_slug_idx" ON "tenants" ("slug");

CREATE TABLE IF NOT EXISTS "memberships" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "role" "role" NOT NULL DEFAULT 'member',
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "memberships_tenant_user_idx" ON "memberships" ("tenant_id", "user_id");

CREATE TABLE IF NOT EXISTS "chatbots" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "description" text,
  "welcome_message" text NOT NULL DEFAULT 'Hi! I''m here to help you find your perfect property. What are you looking for?',
  "system_prompt" text NOT NULL,
  "theme_color" text NOT NULL DEFAULT '#2563eb',
  "font_family" text NOT NULL DEFAULT 'Inter',
  "logo_url" text,
  "widget_position" "widget_position" NOT NULL DEFAULT 'bottom-right',
  "lead_capture_enabled" boolean NOT NULL DEFAULT true,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "conversations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "chatbot_id" uuid NOT NULL REFERENCES "chatbots"("id") ON DELETE CASCADE,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "session_id" text NOT NULL,
  "visitor_id" text,
  "page_url" text,
  "metadata" jsonb NOT NULL DEFAULT '{}',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "conversations_chatbot_idx" ON "conversations" ("chatbot_id");
CREATE INDEX IF NOT EXISTS "conversations_tenant_idx" ON "conversations" ("tenant_id");
CREATE INDEX IF NOT EXISTS "conversations_session_idx" ON "conversations" ("session_id");

CREATE TABLE IF NOT EXISTS "messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "conversation_id" uuid NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
  "role" "message_role" NOT NULL,
  "content" text NOT NULL,
  "tokens_used" integer DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "messages_conversation_idx" ON "messages" ("conversation_id");

CREATE TABLE IF NOT EXISTS "leads" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "chatbot_id" uuid REFERENCES "chatbots"("id") ON DELETE SET NULL,
  "conversation_id" uuid REFERENCES "conversations"("id") ON DELETE SET NULL,
  "name" text,
  "email" text,
  "phone" text,
  "budget" text,
  "property_type" text,
  "location" text,
  "timeline" text,
  "status" "lead_status" NOT NULL DEFAULT 'new',
  "notes" text,
  "metadata" jsonb NOT NULL DEFAULT '{}',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "leads_tenant_idx" ON "leads" ("tenant_id");
CREATE INDEX IF NOT EXISTS "leads_status_idx" ON "leads" ("status");

CREATE TABLE IF NOT EXISTS "usage_tracking" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "chatbot_id" uuid REFERENCES "chatbots"("id") ON DELETE SET NULL,
  "month" text NOT NULL,
  "message_count" integer NOT NULL DEFAULT 0,
  "token_count" integer NOT NULL DEFAULT 0,
  "conversation_count" integer NOT NULL DEFAULT 0,
  "lead_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "usage_tenant_bot_month_idx" ON "usage_tracking" ("tenant_id", "chatbot_id", "month");

CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "plan" "plan" NOT NULL DEFAULT 'free',
  "stripe_customer_id" text,
  "stripe_subscription_id" text,
  "current_period_start" timestamp,
  "current_period_end" timestamp,
  "cancel_at_period_end" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_tenant_idx" ON "subscriptions" ("tenant_id");

-- ─── Functions & Triggers ────────────────────────────────────────────────────

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_chatbots_updated_at
  BEFORE UPDATE ON chatbots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON usage_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbots ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- ─── RLS Policies: profiles ───────────────────────────────────────────────────

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins can see all profiles
CREATE POLICY "profiles_admin_select" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ─── RLS Policies: tenants ────────────────────────────────────────────────────

CREATE POLICY "tenants_select_member" ON tenants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE tenant_id = tenants.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "tenants_insert_authenticated" ON tenants
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "tenants_update_owner_admin" ON tenants
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE tenant_id = tenants.id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "tenants_admin_all" ON tenants
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ─── RLS Policies: memberships ───────────────────────────────────────────────

CREATE POLICY "memberships_select_tenant_member" ON memberships
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM memberships m2
      WHERE m2.tenant_id = memberships.tenant_id AND m2.user_id = auth.uid()
    )
  );

CREATE POLICY "memberships_insert_owner_admin" ON memberships
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE tenant_id = memberships.tenant_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
    OR NOT EXISTS (
      SELECT 1 FROM memberships WHERE tenant_id = memberships.tenant_id
    )
  );

CREATE POLICY "memberships_delete_owner" ON memberships
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM memberships m2
      WHERE m2.tenant_id = memberships.tenant_id
        AND m2.user_id = auth.uid()
        AND m2.role = 'owner'
    )
  );

CREATE POLICY "memberships_admin_all" ON memberships
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ─── RLS Policies: chatbots ──────────────────────────────────────────────────

CREATE POLICY "chatbots_select_tenant_member" ON chatbots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE tenant_id = chatbots.tenant_id AND user_id = auth.uid()
    )
  );

-- Public read for active bots (for widget embedding)
CREATE POLICY "chatbots_public_select_active" ON chatbots
  FOR SELECT USING (is_active = true);

CREATE POLICY "chatbots_insert_owner_admin" ON chatbots
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE tenant_id = chatbots.tenant_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "chatbots_update_owner_admin" ON chatbots
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE tenant_id = chatbots.tenant_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "chatbots_delete_owner" ON chatbots
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE tenant_id = chatbots.tenant_id
        AND user_id = auth.uid()
        AND role = 'owner'
    )
  );

CREATE POLICY "chatbots_admin_all" ON chatbots
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ─── RLS Policies: conversations ─────────────────────────────────────────────

CREATE POLICY "conversations_select_tenant_member" ON conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE tenant_id = conversations.tenant_id AND user_id = auth.uid()
    )
  );

-- Allow anon/service role to insert (widget creates conversations)
CREATE POLICY "conversations_insert_service" ON conversations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "conversations_delete_owner_admin" ON conversations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE tenant_id = conversations.tenant_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "conversations_admin_all" ON conversations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ─── RLS Policies: messages ───────────────────────────────────────────────────

CREATE POLICY "messages_select_via_conversation" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      JOIN memberships m ON m.tenant_id = c.tenant_id
      WHERE c.id = messages.conversation_id AND m.user_id = auth.uid()
    )
  );

-- Allow service role to insert
CREATE POLICY "messages_insert_service" ON messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "messages_admin_all" ON messages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ─── RLS Policies: leads ─────────────────────────────────────────────────────

CREATE POLICY "leads_select_tenant_member" ON leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE tenant_id = leads.tenant_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "leads_insert_service" ON leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "leads_update_tenant_member" ON leads
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE tenant_id = leads.tenant_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "leads_delete_owner_admin" ON leads
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE tenant_id = leads.tenant_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "leads_admin_all" ON leads
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ─── RLS Policies: usage_tracking ────────────────────────────────────────────

CREATE POLICY "usage_select_tenant_member" ON usage_tracking
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE tenant_id = usage_tracking.tenant_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "usage_insert_service" ON usage_tracking
  FOR INSERT WITH CHECK (true);

CREATE POLICY "usage_update_service" ON usage_tracking
  FOR UPDATE USING (true);

CREATE POLICY "usage_admin_all" ON usage_tracking
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ─── RLS Policies: subscriptions ─────────────────────────────────────────────

CREATE POLICY "subscriptions_select_tenant_member" ON subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE tenant_id = subscriptions.tenant_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "subscriptions_admin_all" ON subscriptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ─── Storage Buckets ─────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
CREATE POLICY "logos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'logos');

CREATE POLICY "logos_authenticated_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'logos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "logos_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'logos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
