// Central plans configuration for frontend
// Reads Stripe price IDs from NEXT_PUBLIC env vars and exposes price cents
export type PlanKey = 'free' | 'starter' | 'pro' | 'enterprise';

export const PLANS: Array<{ key: PlanKey; title: string; priceDisplay: string; priceCents: number; price?: string; per?: string; features?: string[] }> = [
  { key: 'free', title: 'Free', priceDisplay: '£0', priceCents: 0, price: '£0', per: '/mo', features: ['3 tenants'] },
  { key: 'starter', title: 'Starter', priceDisplay: process.env.NEXT_PUBLIC_PLAN_DISPLAY_STARTER || '£29', priceCents: Number(process.env.NEXT_PUBLIC_PLAN_PRICE_STARTER_CENTS || 2900), price: process.env.NEXT_PUBLIC_PLAN_DISPLAY_STARTER || '£29', per: '/mo', features: ['20 tenants', 'CSV export'] },
  { key: 'pro', title: 'Pro', priceDisplay: process.env.NEXT_PUBLIC_PLAN_DISPLAY_PRO || '£79', priceCents: Number(process.env.NEXT_PUBLIC_PLAN_PRICE_PRO_CENTS || 7900), price: process.env.NEXT_PUBLIC_PLAN_DISPLAY_PRO || '£79', per: '/mo', features: ['150 tenants', 'CSV export', 'Xero/QuickBooks'] },
  { key: 'enterprise', title: 'Enterprise', priceDisplay: process.env.NEXT_PUBLIC_PLAN_DISPLAY_ENTERPRISE || '£199+', priceCents: Number(process.env.NEXT_PUBLIC_PLAN_PRICE_ENTERPRISE_CENTS || 19900), price: process.env.NEXT_PUBLIC_PLAN_DISPLAY_ENTERPRISE || '£199+', per: '/mo', features: ['Unlimited tenants', 'CSV export', 'Xero export'] },
];

// Map priceId for Stripe Checkout (from public envs)
export const PRICE_ID_MAP: Record<string, string> = {
  starter: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER || '',
  pro: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || '',
  enterprise: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE || '',
};

export const PLAN_PRICE_CENTS: Record<string, number> = PLANS.reduce((acc, p) => {
  acc[p.key] = p.priceCents;
  return acc;
}, {} as Record<string, number>);

export default {
  PLANS,
  PRICE_ID_MAP,
  PLAN_PRICE_CENTS,
};
