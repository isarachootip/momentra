export type SubscriptionPlanCode = 'free' | 'pro' | 'organization';

export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing';

export type PaymentMethodType = 'card' | 'promptpay';

export type InvoiceStatus = 'paid' | 'pending' | 'failed';

export interface SubscriptionPlan {
  plan_code: SubscriptionPlanCode;
  name: string;
  price_thb_monthly: number;
  max_links: number; // -1 for unlimited
  max_km_items: number; // -1 for unlimited
  max_storage_bytes: number; // e.g. 524288000 for 500MB
  features: {
    stats?: boolean;
    multi_admin?: boolean;
    custom_domain?: boolean;
  };
  created_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_code: SubscriptionPlanCode;
  status: SubscriptionStatus;
  payment_provider: string;
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentInvoice {
  id: string;
  subscription_id: string | null;
  user_id: string;
  amount_thb: number;
  currency: string;
  payment_method: PaymentMethodType;
  status: InvoiceStatus;
  provider_invoice_id: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface QuotaItemStatus {
  used: number;
  limit: number; // -1 is unlimited
  percentage: number; // 0 - 100
  isExceeded: boolean;
}

export interface QuotaStatus {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  canCreate: boolean; // false if status is past_due or canceled or limits exceeded
  links: QuotaItemStatus;
  kmItems: QuotaItemStatus;
  storageBytes: QuotaItemStatus;
}
