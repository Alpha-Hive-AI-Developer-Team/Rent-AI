# RentAi Frontend

Next.js app for RentAi — landlord portfolio, bank reconciliation, subscriptions, partner referrals, and Super Admin tools.

## Stack

- **Framework:** Next.js 14 (App Router)
- **UI:** React 18, Tailwind CSS, Radix UI, Framer Motion, Lucide
- **State / data:** Redux Toolkit, TanStack Query, Axios
- **Auth:** Firebase client SDK + backend JWT (httpOnly cookie / bearer)
- **Payments:** Stripe.js
- **Open Banking:** `react-plaid-link`

## Prerequisites

- Node.js 18+
- Running RentAi backend (default `http://localhost:5000`)
- Firebase web app config
- Stripe publishable key (for payment UI)

## Setup

```bash
cd Rent-AI
npm install
cp .env.local.example .env.local   # or create .env.local from the variables below
npm run dev
```

Dev server: **http://localhost:3000** (Next may fall back to `3001` if 3000 is busy).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js development server |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run lint` | ESLint |

## Environment variables

Create `.env.local` in `Rent-AI/`. Only `NEXT_PUBLIC_*` values are exposed to the browser.

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base, e.g. `http://localhost:5000/api` |
| `NEXT_PUBLIC_API_BASE` | Alternate/base API host if used by callbacks |
| `NEXT_PUBLIC_API_BASE_CALLBACK` | OAuth / callback-related API base |
| `NEXT_PUBLIC_APP_URL` | Frontend origin, e.g. `http://localhost:3000` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `NEXT_PUBLIC_STRIPE_PRICE_STARTER` | Optional display / legacy price ids |
| `NEXT_PUBLIC_STRIPE_PRICE_PRO` | |
| `NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE` | |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Optional Analytics |

Plan prices and tenant limits for checkout are primarily driven by the backend plan catalog (`GET /api/plans`).

## App areas

| Path | Audience | Notes |
|------|----------|--------|
| `/` / `/landing-page` | Public | Marketing |
| `/auth/*` | Public | Sign-in, sign-up, OTP, password reset |
| `/user/dashboard` | Landlord | Overview |
| `/user/tenants` | Landlord | Portfolio, rooms, rent ledger, plan slots |
| `/user/transactions` | Landlord | Bank feed, multi-bank Plaid, reconcile |
| `/user/payment` | Landlord | Subscription plans / billing |
| `/user/finances` | Landlord | Finances |
| `/user/arrears` | Landlord | Arrears |
| `/user/referrals` | Landlord / partner | Partner programme |
| `/admin/*` | Admin / Super Admin | Landlords, tenants, plans, referrals, management |
| `/join` | Public | Partner join flows |

### Notable product behavior (UI)

- **Plan slots:** vacant rooms do not consume tenant slots; occupied tenancies do.
- **Locked tenants:** over-limit tenants cannot open the ledger modal (upgrade required).
- **Multi-bank:** landlords can add multiple Plaid banks; Sync Feed / webhooks sync all Items.
- **Admin plans:** disabling a paid plan schedules subscribers to cancel at period end.

## Project layout

```
Rent-AI/
├── app/                 # App Router pages (user, admin, auth)
├── components/          # UI + feature components
├── hooks/               # React Query / feature hooks
├── lib/
│   ├── api/             # Axios API clients
│   └── utils.ts
├── redux/               # Auth / app store
└── public/
```

## Talking to the backend

- API client: [`lib/api/api-client.ts`](lib/api/api-client.ts)
- Set `NEXT_PUBLIC_API_URL` to the backend `/api` root
- Ensure backend CORS allows `http://localhost:3000` (and `3001` if used)

## Related apps

- Backend: [`../RentAi-backend`](../RentAi-backend)
