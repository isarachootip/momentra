export type SocialPlatform =
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'line'
  | 'x'
  | 'linkedin'
  | 'website'
  | 'email'
  | 'other';

export type KmCategory = 'article' | 'video' | 'image' | 'document' | 'note';

export type VisibilityMode = 'public' | 'private';

export interface SocialLink {
  id: string;
  user_id?: string;
  platform: SocialPlatform;
  label: string;
  url: string;
  link_group: 'official' | 'personal';
  visibility: VisibilityMode;
  sort_order: number;
  created_at?: string;
}

export interface KmItem {
  id: string;
  title: string;
  description?: string | null;
  km_category: KmCategory;
  link_url?: string | null;
  event_start: string;
  event_end: string;
  date_precision: 'year' | 'month' | 'day' | 'datetime';
  is_circa: boolean;
  visibility: VisibilityMode;
  is_public: boolean;
  tags?: string[];
  created_at?: string;
}

export interface SubscriptionPlan {
  plan_code: 'free' | 'pro' | 'organization';
  name: string;
  price_thb_monthly: number;
  max_links: number;
  max_km_items: number;
  max_storage_bytes: number;
  features: {
    stats?: boolean;
    multi_admin?: boolean;
    custom_domain?: boolean;
  };
}

export interface QuotaItem {
  used: number;
  limit: number;
  percentage: number;
  isExceeded: boolean;
}

export interface QuotaStatus {
  plan: SubscriptionPlan;
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  canCreate: boolean;
  links: QuotaItem;
  kmItems: QuotaItem;
  storageBytes: QuotaItem;
}

export interface PublicProfileInfo {
  username: string;
  fullName: string;
  avatarUrl: string | null;
  pageBio: string | null;
  pageTemplate: string;
  pageTheme: { theme: string; accent: string };
  planCode: string;
  officialLinks: SocialLink[];
  personalLinks: SocialLink[];
}

export interface PublicHubData {
  profile: PublicProfileInfo;
  items: KmItem[];
  collections: Array<Record<string, unknown>>;
}

export interface PaymentInvoice {
  id: string;
  amount_thb: number;
  currency: string;
  payment_method: 'card' | 'promptpay';
  status: 'paid' | 'pending' | 'failed';
  paid_at: string | null;
  created_at: string;
}
