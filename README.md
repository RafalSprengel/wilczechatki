<img width="1898" height="1665" alt="Zrzut ekranu 2026-01-31 233105" src="https://github.com/user-attachments/assets/f382cc75-d156-43e1-8208-890d539aa009" />

# Wilcze Chatki - Booking and Admin System

A Next.js application for the Wilcze Chatki accommodation property (Szumles Krolewski, Kaszuby).

Project scope:
- public website with availability search and booking flow,
- online payments via Stripe,
- transactional and contact emails via Resend,
- admin panel for bookings, pricing, and settings,
- backend powered by MongoDB + Mongoose.

## 🛠️ Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- MongoDB + Mongoose
- Better Auth (MongoDB adapter)
- Stripe (Checkout + webhook)
- Resend + React Email Components
- CSS Modules + global CSS
- Biome (lint + format)

## ✨ Core Features

### Public Website
- Landing page (hero, about, services, gallery, attractions, contact).
- Contact form that sends:
   - an admin notification,
   - an automatic reply to the customer.
- Booking flow:
   - date and guest selection,
   - validation and availability search,
   - summary and Stripe Checkout redirect,
   - success/cancel/failure pages.

### Admin Panel
- Booking management:
   - add bookings,
   - list and detail view,
   - date blocking,
   - calendar view.
- Property and pricing management.
- Payment management (online/offline).
- System settings and booking settings.
- Dev/debug section.

### Backend and Security
- Admin route protection via proxy + Better Auth session:
   - unauthenticated user -> redirect to /admin-login,
   - non-admin user -> redirect to /.
- Input validation with Zod in API endpoints.
- Booking status updates based on Stripe webhooks.

## 📁 Project Structure (Short)

- src/app/(root) - public website and booking routes
- src/app/admin - admin panel
- src/app/api - API endpoints
- src/actions - server actions
- src/db - MongoDB connection and Mongoose models
- src/emails - email templates
- src/lib - integrations (auth, stripe, email)
- src/scripts - seed scripts

## 🔌 API Endpoints

- GET/POST /api/auth/[...all] - Better Auth
- GET /api/checkout-status - Stripe session status by session_id
- POST /api/webhooks/stripe - Stripe webhook for booking updates and transactional emails
- POST /api/contact - contact form handler using Resend

## ✅ Local Requirements

- Node.js 20+
- MongoDB access
- Stripe and Resend keys

## ⚙️ Environment Setup

Copy .env.example to .env.local and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:

```env
# Stripe
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# MongoDB
MONGODB_URI=

# Resend
RESEND_API_KEY=

# Better Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
```



## 🚀 Local Run

```bash
npm install
npm run dev
```

The app starts on http://localhost:3000 by default.

## 📜 NPM Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run format
npm run seed:initial
npm run seed:reset
```

## 🌱 Database Seeding

### seed:initial (non-destructive)

```bash
npm run seed:initial
```

Creates missing starter data without clearing existing collections:
- system configuration,
- seasons,
- properties,
- base and seasonal pricing records.

### seed:reset (destructive, dev only)

```bash
npm run seed:reset
```

Clears core collections and rebuilds data from scratch.

## 💳 Payment Flow (Short)

1. A server action creates bookings with pending and unpaid statuses.
2. Stripe Checkout session is created with metadata (bookingIds, orderId, etc.).
3. Stripe webhook confirms payment or marks it as failed.
4. Booking records are updated in MongoDB.
5. Transactional emails are sent via Resend.

## 🧪 Code Quality

- Lint: Biome (npm run lint)
- Format: Biome (npm run format)
- Type safety: TypeScript

## 🧭 Developer Notes

- When you change models, verify related server actions and API endpoints.
- For payment flow changes, always test Stripe webhook handling locally.
- For email changes, test both admin notifications and customer autoresponder emails.
