# 🏋️ FitGym — Deployment Guide (Supabase + Vercel)

## Overview

This is a **Next.js 14** app with:
- **Database + Auth**: Supabase (PostgreSQL + Storage)
- **Hosting**: Vercel (serverless, zero config)
- **No separate backend** — Express replaced by Next.js API routes

---

## Step 1 — Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Choose a name, region, and database password
3. Wait for provisioning (~1 min)

### Run the Database Migration

1. In your Supabase dashboard → **SQL Editor** → **New Query**
2. Paste the contents of `supabase/migrations/001_initial.sql`
3. Click **Run**

This creates:
- `members` table
- `photos` table  
- `announcements` table
- Row Level Security policies
- `gym-photos` storage bucket

### Get Your API Keys

In Supabase → **Settings** → **API**:
- Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- Copy `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copy `service_role secret` key → `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 2 — Deploy to Vercel

### Option A: Deploy via GitHub (Recommended)

1. Push this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your GitHub repository
4. Vercel auto-detects Next.js — click **Deploy**

### Option B: Deploy via Vercel CLI

```bash
npm i -g vercel
cd fitgym
vercel
```

---

## Step 3 — Set Environment Variables in Vercel

In Vercel → your project → **Settings** → **Environment Variables**, add:

| Variable | Value | Where |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | All environments |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | All environments |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | All environments |
| `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` | `gym-photos` | All environments |
| `ADMIN_USERNAME` | Your chosen admin username | All environments |
| `ADMIN_PASSWORD` | Your chosen secure password | All environments |

> ⚠️ **Never commit real values to git.** The `.env.example` file is a template only.

---

## Step 4 — Redeploy

After setting env vars, trigger a redeploy in Vercel:
- **Deployments** → latest → **Redeploy**

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy .env.example to .env.local and fill in your values
cp .env.example .env.local

# 3. Start dev server
npm run dev
```

App runs at `http://localhost:3000`

---

## App Structure

```
/                    → Member portal (landing page + member login)
/admin/login         → Admin login
/admin               → Admin dashboard
/admin/members       → Members directory
/admin/members/:id   → Member profile (renew, photos, notes)
/admin/announcements → Post announcements
/admin/photos        → Media gallery
```

### API Routes

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/admin/login` | None | Admin login |
| `GET` | `/api/members` | Admin | List all members |
| `POST` | `/api/members` | Admin | Create member |
| `GET` | `/api/members/:id` | Admin | Get member |
| `PUT` | `/api/members/:id` | Admin | Update member |
| `DELETE` | `/api/members/:id` | Admin | Delete member |
| `POST` | `/api/members/lookup` | None | Member login by code |
| `GET` | `/api/photos` | None | List photos |
| `POST` | `/api/upload` | Admin | Upload photo to Supabase Storage |
| `DELETE` | `/api/photos/:id` | Admin | Delete photo |
| `GET` | `/api/announcements` | None | List announcements |
| `POST` | `/api/announcements` | Admin | Create announcement |
| `DELETE` | `/api/announcements/:id` | Admin | Delete announcement |

---

## What Changed vs. Original (Replit)

| Original | This Version |
|---|---|
| Express.js server | Next.js API Routes (serverless) |
| Local disk uploads (multer) | Supabase Storage |
| Drizzle ORM + node-postgres | Supabase JS client |
| Replit-specific vite plugins | Clean Next.js config |
| pnpm monorepo workspace | Single Next.js app |
| `PORT` / `BASE_PATH` env required | Standard Next.js (none needed) |
| `wouter` router | Next.js `app/` router |
| React Query with custom API client | React Query with native fetch hooks |

**Design is identical** — same dark theme, same CSS variables, same components, same pages.
