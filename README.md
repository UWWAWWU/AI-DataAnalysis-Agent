# AI Data Analysis Agent

An adaptive dashboard for uploaded CSV and XLSX files, with automatic analysis planning, isolated Python calculations, instant local filters, AI chat, data review and JSON/CSV/PDF exports.

## Deploy to Vercel

Import this repository into Vercel as a Next.js project. Use Node.js 22 or 24, `npm install`, and `npm run build`.

Configure server-only environment variables: `GEMINI_API_KEY` (optional if the compatible provider is configured), `RELINK_API_KEY`, `RELINK_BASE_URL`, and `E2B_API_KEY`. Never prefix these with `NEXT_PUBLIC_` or commit their values.

The website is publicly accessible, as requested. API requests use the server's configured provider accounts.

Uploaded files up to 40 MB go directly from the browser to an isolated E2B sandbox through a short-lived signed URL. Computed dashboard data returns through a signed download URL, avoiding Vercel's 4.5 MB function payload limit. The sandbox closes after retrieval, or automatically expires after five minutes. Only validated dashboard specifications run through trusted Python code.

Set the production project domain to `aiagent.wawutriambodo.my.id` and apply the DNS record Vercel specifies. A suitable generated domain is `aiagent-wawutriambodo.vercel.app`, subject to availability.

## Local development

Copy `.env.example` to `.env.local`, fill in the server keys, then run `npm install` and `npm run dev`.

## Verification

Run `npm run typecheck`, `node scripts/check-sandbox-ticket.mjs`, and the applicable `scripts/check-*.mjs` checks. Build with `npm run build`. Live provider tests require configured accounts; a successful build does not verify their availability.
