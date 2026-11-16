# Project memory

## Product intent & audience

- Garage HQ: all-in-one SaaS management platform for independent automotive repair shops (2–3 service bays).
- Flat pricing: $159.99/month single subscription tier ("Garage HQ Standard").
- Landing page goal: convert shop owners to subscribers while preserving existing auth/dashboard/portal flows.
- Primary slogan: "Run Your Shop. Not Your Paperwork."

## Brand personality & voice

- Premium automotive-technology aesthetic; professional, bold, high-converting.
- Confident, direct copy with uppercase punchy headlines.
- Testimonials are clearly labeled illustrative placeholders — never fabricated as real customer reviews.

## Visual design & UX direction

- Palette: dark navy, charcoal, white, electric-blue accents.
- Bold typography, smooth reveal-on-scroll animations, hover lift on cards, sticky animated nav.
- Responsive desktop + mobile; reduced-motion accessibility support.
- Lucide icons for all UI/iconography; reusable component pattern.
- Landing split into cohesive section components for maintainability.
- Interactive dashboard demo with clickable tabs (Dashboard, Appointments, Customers, Repair Orders, Invoices, Financial Reports) using realistic fictional data.
- Avoid non-default Tailwind sizes (e.g. `h-4.5`); prefer standard spacing tokens.

## Decisions, constraints & rationale

- Stack: Vite + React + TypeScript + Tailwind + Lucide; `@/` path alias → `src/`.
- Routing via React Router; public landing at `/`, existing routes untouched (`/login`, `/signup`, `/portal`, `/dashboard` protected).
- Landing wired into router without rebuilding or duplicating auth, DB, or dashboard features.
- CTA buttons link to existing `/login` and `/signup`; signup to connect to existing subscription system when available.
- Images sourced from stock automotive/shop photography; unused image constants removed to keep build clean.
- SEO: page title and meta description updated for landing.

## Open questions & assumptions

- Real customer testimonials and photos pending — currently illustrative placeholders.
- Subscription/billing system integration status beyond signup flow not yet confirmed.
- Contact form submission backend handling not specified (assumed frontend-only for now).