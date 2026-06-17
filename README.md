# RealEstate AI — Multi-Tenant AI Chat Widget SaaS

A complete, production-ready AI-powered chat widget SaaS platform for multi-industry lead generation. Built with Next.js 15, Prisma, NextAuth, OpenAI, and Stripe.

## 🚀 Features

- **Multi-Tenant Architecture** — Full organization isolation with role-based access control
- **AI Chat Widget** — Embeddable JavaScript widget (zero dependencies)
- **Industry Templates** — Pre-configured for Real Estate, Legal, Healthcare, Restaurants, and more
- **Smart Lead Capture** — Automatic extraction of name, email, phone, and industry-specific fields
- **Dynamic Pricing** — Admin-controlled pricing per industry with monthly/yearly plans
- **Payment Gateway** — Stripe integration with subscriptions, trials, and webhooks
- **Dashboard** — Leads, conversations, analytics, chatbot management
- **Admin Panel** — Platform-wide management (industries, pricing, users, revenue)
- **Plan Enforcement** — Message limits, chatbot limits, lead limits per subscription
- **File Storage** — Logo upload support

## 🏗️ Tech Stack

| Layer       | Technology                    |
|-------------|-------------------------------|
| Frontend    | Next.js 15 App Router, TypeScript, React 19 |
| Styling     | Tailwind CSS + shadcn/ui      |
| Database    | SQLite (Prisma ORM)           |
| Auth        | NextAuth.js v5 (Auth.js)      |
| Payments    | Stripe                        |
| AI          | OpenAI GPT-4o-mini            |
| Testing     | Playwright, Vitest            |
| Deployment  | Vercel/VPS                    |

## 📋 Prerequisites

- Node.js 20+
- An [OpenAI](https://platform.openai.com) API key
- A [Stripe](https://stripe.com) account (for payments)
- A [Vercel](https://vercel.com) account (for deployment)

---

## ⚡ Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/realestate-ai-agent
cd realestate-ai-agent
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env.local
```

Fill in your `.env.local`:

```env
# Database (SQLite)
DATABASE_URL="file:./dev.db"

# OpenAI
OPENAI_API_KEY=sk-proj-...

# NextAuth.js
NEXTAUTH_SECRET=your-secret-key-min-32-chars
NEXTAUTH_URL=http://localhost:3000

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Admin
ADMIN_EMAIL=your@email.com

# Stripe (optional, for payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 3. Run Database Migrations

```bash
npx prisma generate
npx prisma migrate dev
```

This creates the SQLite database (`dev.db`) and all tables.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign up.

### 5. Build the Widget

```bash
npm run widget:build
```

This outputs the widget to `public/widget.js` (a pre-built version is already included).

---

## 🔧 Configuration

### Admin Access

The system has an admin dashboard at `/admin`. Access is controlled by the `isAdmin` field in the `User` table.



When you sign up with the email specified in `ADMIN_EMAIL` env variable, you automatically get admin access.

To manually grant admin access to other users, update the database:

```bash
npx prisma studio
# Navigate to User table → find your user → set isAdmin = true
```

Admin dashboard includes:
- `/admin` — Overview and platform stats
- `/admin/users` — User management
- `/admin/tenants` — Organization management
- `/admin/usage` — Platform usage statistics
- `/admin/industries` — Industry templates and pricing management

### Plan Limits (src/lib/feature-gates.ts)

| Feature          | Free  | Starter | Pro   | Enterprise |
|-----------------|-------|---------|-------|------------|
| Chatbots        | 1     | 3       | 10    | Unlimited  |
| Messages/mo     | 100   | 1,000   | 10,000 | Unlimited |
| Leads/mo        | 50    | 500     | 5,000 | Unlimited  |
| Custom Colors   | ✗     | ✓       | ✓     | ✓          |
| Logo Upload     | ✗     | ✓       | ✓     | ✓          |
| Remove Branding | ✗     | ✗       | ✓     | ✓          |
| CSV Export      | ✗     | ✓       | ✓     | ✓          |

---

## 📦 Embedding the Widget

After creating a chatbot in the dashboard, copy the embed code:

```html
<!-- Add before </body> on your website -->
<script
  src="https://yourdomain.com/widget.js"
  data-bot-id="YOUR_BOT_ID"
  async>
</script>
```

The widget will:
1. Load bot configuration (theme, welcome message, etc.)
2. Create a floating chat button
3. Open a chat window when clicked
4. Send messages to the AI
5. Capture lead information automatically
6. Persist conversation in localStorage

---

## 🗄️ Database Schema

The project uses Prisma ORM with SQLite (easily switched to PostgreSQL or MySQL).

**Core Models:**
```
User              — User accounts (NextAuth.js)
Organization      — Tenants/companies
Membership        — User ↔ Organization with roles (owner/admin/manager/member/viewer)
Chatbot           — Bot configurations per organization
Conversation      — Chat sessions
Message           — Individual messages
Lead              — Captured lead records
Industry          — Industry templates (Real Estate, Legal, etc.)
IndustryPricing   — Dynamic pricing per industry
Subscription      — Active subscriptions
Payment           — Payment records
UsageTracking     — Monthly usage per organization
```

**Schema location:** `prisma/schema.prisma`

---

## 🌐 API Endpoints

### Public (no auth required)

| Method | Endpoint                    | Description              |
|--------|----------------------------|--------------------------|
| GET    | `/api/bots/:id`             | Get public bot config    |
| POST   | `/api/chat`                 | Send chat message        |
| GET    | `/widget.js`                | Widget JavaScript        |

### Authenticated (requires session)

| Method | Endpoint                                | Description              |
|--------|-----------------------------------------|--------------------------|
| GET    | `/api/organizations`                    | List your organizations  |
| POST   | `/api/organizations`                    | Create organization      |
| GET    | `/api/organizations/:id`                | Get organization details |
| PUT    | `/api/organizations/:id`                | Update organization      |
| DELETE | `/api/organizations/:id`                | Delete organization      |
| GET    | `/api/organizations/:id/chatbots`       | List chatbots            |
| POST   | `/api/organizations/:id/chatbots`       | Create chatbot           |
| GET    | `/api/organizations/:id/leads`          | List leads (+ CSV export)|
| GET    | `/api/organizations/:id/conversations`  | List conversations       |
| GET    | `/api/organizations/:id/members`        | List members             |
| POST   | `/api/organizations/:id/members`        | Invite member            |

### Admin (requires isAdmin = true)

| Method | Endpoint                    | Description              |
|--------|----------------------------|--------------------------|
| GET    | `/api/admin/users`          | List all users           |
| GET    | `/api/admin/organizations`  | List all organizations   |
| GET    | `/api/admin/stats`          | Platform statistics      |
| GET    | `/api/industries`           | List industries          |
| POST   | `/api/industries`           | Create industry          |
| PUT    | `/api/industries/:id`       | Update industry          |
| DELETE | `/api/industries/:id`       | Delete industry          |
| PATCH  | `/api/leads/:id`            | Update lead              |
| DELETE | `/api/conversations/:id`    | Delete conversation      |
| POST   | `/api/upload`               | Upload file              |

### Admin Only

| Method | Endpoint                    | Description              |
|--------|----------------------------|--------------------------|
| GET    | `/api/admin/tenants`        | List all tenants         |
| PATCH  | `/api/admin/tenants/:id`    | Suspend/activate/delete  |
| GET    | `/api/admin/users`          | List all users           |
| GET    | `/api/admin/stats`          | Platform statistics      |

---

## 🚀 Deploying to Vercel

1. Push your code to GitHub
2. Import the project at [vercel.com](https://vercel.com)
3. Add all environment variables from `.env.local`
4. Set `NEXT_PUBLIC_APP_URL` to your Vercel domain
5. Deploy!

```bash
# Or via CLI
npx vercel --prod
```

---

## 📁 Project Structure

```
realestate-ai-agent/
├── src/
│   ├── app/
│   │   ├── (auth)/           # Login, signup, password reset
│   │   ├── (dashboard)/      # Protected dashboard routes
│   │   │   └── dashboard/
│   │   │       ├── chatbots/ # Chatbot CRUD
│   │   │       ├── leads/    # Lead management
│   │   │       ├── conversations/ # Chat history
│   │   │       └── settings/ # Plan & workspace
│   │   ├── admin/            # Platform admin (owner only)
│   │   ├── api/              # API routes
│   │   └── page.tsx          # Landing page
│   ├── components/
│   │   ├── ui/               # shadcn/ui components
│   │   ├── dashboard/        # Dashboard components
│   │   ├── chatbot/          # Chatbot form, card, embed
│   │   ├── leads/            # Leads table, detail drawer
│   │   ├── conversations/    # Conversation viewer
│   │   └── admin/            # Admin components
│   ├── db/
│   │   ├── schema.ts         # Drizzle schema
│   │   └── index.ts          # DB connection
│   ├── lib/
│   │   ├── supabase/         # Client, server, admin
│   │   ├── openai.ts         # AI integration
│   │   ├── feature-gates.ts  # Plan limits
│   │   ├── lead-extractor.ts # Lead extraction logic
│   │   ├── rate-limit.ts     # Rate limiting
│   │   └── utils.ts          # Utilities
│   ├── middleware.ts          # Auth middleware
│   └── types/                # TypeScript types
├── widget/
│   ├── src/index.ts          # Widget SDK source
│   ├── tsup.config.ts        # Build config
│   └── package.json
├── public/
│   └── widget.js             # Pre-built widget (also output of widget:build)
├── supabase/
│   └── migrations/
│       └── 0001_initial.sql  # Complete DB migration + RLS
└── .env.example
```

---

## 🛡️ Security

- **Row Level Security** on all tables — tenants can only access their own data
- **Rate limiting** on chat API (20 msg/min per IP) and upload endpoint
- **Input validation** with Zod on all API routes
- **CORS headers** restricted to same-origin for dashboard, wildcard for widget/chat
- **Service role key** never exposed to client
- **Secure headers** (X-Frame-Options, X-Content-Type-Options, XSS-Protection)

---

## 🤖 AI System Prompt

The default system prompt qualifies real estate leads by asking about:
- Property type (house, condo, apartment, etc.)
- Location preferences
- Budget range
- Timeline
- Must-have features

You can customize the prompt per bot in the chatbot settings.

---

## 📄 License

MIT — See LICENSE file.
