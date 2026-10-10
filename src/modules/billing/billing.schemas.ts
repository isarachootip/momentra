import { z } from 'zod';

export const createCheckoutSchema = z.object({
  planCode: z.enum(['free', 'pro', 'organization']),
  paymentMethod: z.enum(['card', 'promptpay']).default('promptpay'),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;

export const billingWebhookSchema = z.object({
  event: z.enum([
    'checkout.session.completed',
    'invoice.payment_succeeded',
    'invoice.payment_failed',
    'customer.subscription.deleted',
    'customer.subscription.updated',
  ]),
  data: z.object({
    userId: z.string().uuid().optional(),
    planCode: z.enum(['free', 'pro', 'organization']).optional(),
    subscriptionId: z.string().optional(),
    invoiceId: z.string().optional(),
    amountThb: z.number().int().nonnegative().optional(),
    paymentMethod: z.enum(['card', 'promptpay']).optional(),
    status: z.enum(['active', 'past_due', 'canceled', 'trialing']).optional(),
    periodEnd: z.string().optional(),
  }),
});

export type BillingWebhookInput = z.infer<typeof billingWebhookSchema>;
