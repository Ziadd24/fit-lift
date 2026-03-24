# README.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server (Next.js)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:migrate   # Run database migrations (Supabase)
```

## Architecture

**Stack**: Next.js 14 (App Router), TypeScript, Supabase (PostgreSQL + Auth + Storage), TailwindCSS, React Query, Zustand

### App Structure

```
app/
  page.tsx              # Member portal landing page (pricing, about, login modal)
  admin/
    login/page.tsx      # Admin authentication
    page.tsx            # Dashboard
    members/            # Member CRUD + profile
    announcements/      # Announcement management
    photos/             # Media gallery
    bundles/            # Membership plan management
  api/
    admin/login         # Admin auth (env-based credentials)
    members/*           # Member CRUD + lookup
    photos/*            # Photo CRUD (Supabase Storage)
    announcements/*     # Announcement CRUD
    upload              # Photo upload handler
    bundles/*           # Membership plans CRUD
```

### Data Layer

- **Supabase** handles database, auth, and file storage
- Admin operations use `getSupabaseAdmin()` (service role key)
- Public operations use anon key with RLS policies
- Database migrations in `supabase/migrations/`

### Auth System

- **Admin**: Simple env-based credentials (`ADMIN_USERNAME`/`ADMIN_PASSWORD`)
- **Members**: Lookup by `membership_code` (e.g., "FL-1234")
- Session management via Zustand with persistence (24h member / 8h admin)

### Key Patterns

- Custom API hooks in `lib/api-hooks.ts` wrap React Query for all CRUD operations
- `AdminLayout` provides sidebar navigation with route protection
- Member portal uses tabbed interface (overview/announcements/photos)
- Pricing section supports dynamic bundles from DB or static fallback

### Environment Variables

Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`
