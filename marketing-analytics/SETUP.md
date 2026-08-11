# GA4 Funnel Dashboard — Setup Guide

## 1. Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| npm / pnpm | latest |
| Google Cloud account | — |

---

## 2. Install dependencies

```bash
cd marketing-analytics
npm install
```

---

## 3. Google Cloud Console setup

### 3a. Create a project & enable APIs

1. Go to <https://console.cloud.google.com>
2. Create a new project (or use an existing one)
3. Enable these two APIs:
   - **Google Analytics Data API** (for reading GA4 reports)
   - **Google Analytics Admin API** (for listing properties)

### 3b. Create OAuth 2.0 credentials

1. Navigate to **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Add authorised redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://your-domain.vercel.app/api/auth/callback/google` (production)
5. Copy the **Client ID** and **Client Secret**

### 3c. OAuth consent screen

1. Go to **APIs & Services → OAuth consent screen**
2. Set User Type to **External** (or Internal for Workspace orgs)
3. Add scopes:
   - `https://www.googleapis.com/auth/analytics.readonly`
4. Add your Google account as a **Test user** while in development

---

## 4. Environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
NEXTAUTH_SECRET=<output of: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000

# Optional: default property (users can switch in the UI)
GA4_PROPERTY_ID=123456789

# Google Tag Manager container ID (optional)
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

---

## 5. Find your GA4 Property ID

1. Open **Google Analytics** → your property
2. Go to **Admin → Property Settings**
3. The **Property ID** is the numeric string shown (e.g. `123456789`)

---

## 6. Run locally

```bash
npm run dev
# → http://localhost:3000
```

1. You'll be redirected to `/login`
2. Click **Continue with Google**
3. Grant analytics read access
4. Select your GA4 property from the dropdown in the header

---

## 7. GTM Integration

### Add events to your storefront

```typescript
import { gtmAddToCart, gtmPurchase } from "@/lib/gtm";

// On Add to Cart button click:
gtmAddToCart({
  item_id: product.sku,
  item_name: product.name,
  price: product.price,
  quantity: 1,
});

// After successful payment:
gtmPurchase({
  transaction_id: order.id,
  value: order.total,
  items: order.lineItems,
});
```

### GTM Container setup

1. Create a container at <https://tagmanager.google.com>
2. Add a **GA4 Configuration** tag pointing to your Measurement ID (`G-XXXXXXXX`)
3. Add triggers for:
   - `page_view` → All Pages trigger
   - `add_to_cart` → Custom Event trigger (event name: `add_to_cart`)
   - `begin_checkout`, `add_payment_info`, `purchase` → same pattern
4. Publish the container

---

## 8. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard or:
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL  # → https://your-domain.vercel.app
vercel env add GA4_PROPERTY_ID
```

Make sure to update the **authorised redirect URI** in Google Cloud Console to your Vercel domain.

---

## 9. Folder structure

```
marketing-analytics/
├── src/
│   ├── app/
│   │   ├── (auth)/login/          # Google OAuth login page
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx         # Auth guard + sidebar
│   │   │   ├── funnel/            # Page 1: Sales Funnel by Channel
│   │   │   ├── countries/         # Page 2: Funnel by Country
│   │   │   ├── items/             # Page 3: Funnel by Item
│   │   │   └── traffic/           # Page 4: Traffic Overview
│   │   └── api/ga4/               # Backend API routes (funnel/countries/items/traffic)
│   ├── components/
│   │   ├── ui/                    # ShadCN primitives
│   │   └── dashboard/             # KPI cards, funnel chart, data table, filters
│   ├── hooks/                     # React Query data-fetching hooks
│   ├── lib/
│   │   ├── ga4/                   # GA4 client + transformers
│   │   ├── auth.ts                # NextAuth config
│   │   ├── gtm.ts                 # GTM dataLayer helpers
│   │   └── utils.ts               # Formatting utilities
│   └── types/                     # Shared TypeScript types
└── .env.example
```

---

## 10. Caching

API responses are cached **in-memory for 5 minutes** by default (see `src/lib/ga4/client.ts`).  
For production with multiple instances, replace with **Redis** or **Vercel KV**:

```typescript
// Replace getCached / setCache in client.ts with:
import { kv } from "@vercel/kv";
const cached = await kv.get(key);
await kv.set(key, data, { ex: 300 }); // 5 min TTL
```
