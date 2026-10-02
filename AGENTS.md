# AGENTS.md — react-address-kit

Reusable React 19 + TypeScript address-capture library (Google-Maps-free) with a Next.js 16 demo shell and a Vite library build.

## Stack

- React 19, TypeScript strict (`jsx: react-jsx`, `target ES6`, `moduleResolution bundler`)
- Next.js 16.3.3 (Turbopack, demo shell in `app/`) + Vite 8 library build (`vite.library.config.ts`, entry `src/index.ts`, formats `es`+`cjs`)
- Tailwind v4 + shadcn `base-nova`, MapLibre GL (optional peer `>=4`, installed `6.10.0`)
- Validation Zod v4, routing OSRM, geocoding LocationIQ (default, keyed) or Photon+Nominatim (keyless fallback)
- No test runner, linter, formatter, or CI. `tsc` exists but `next.config.mjs` sets `ignoreBuildErrors: true`

## Commands

```bash
pnpm install          # install (Node 18+, pnpm; repo pins pnpm, toolchain may skew)
pnpm dev              # demo shell
pnpm build            # next build (needs NEXT_PUBLIC_LOCATIONIQ_KEY in .env.local for prerender)
pnpm build:library    # vite library build
npx tsc --noEmit      # typecheck (manual, no gate)
```

## Env

- `NEXT_PUBLIC_LOCATIONIQ_KEY` — required for default provider (forward `/search`, reverse `/reverse` on `https://us1.locationiq.com/v1`). Lives in `.env.local` (gitignored via `.env*.local`). Never commit it. Vercel: set it in dashboard, `.env.local` does not deploy.
- No other keys required for dev (Photon/Nominatim/OSRM are keyless but rate-limited).

## Conventions

- Components in `src/components/` (`AddressForm`, `AddressPicker`, `MapView`, `LocationButton`, `ManualLocationPicker`); hooks in `src/hooks/`; providers/normalizers/validators in `src/lib/`
- Provider injection: `AddressProvider` implements `forward(query, options)` + `reverse(coords, options)`. Default is `createDefaultAddressProvider()` → LocationIQ. Keyless alternative `createPhotonProvider()`. Routing `createOSRMProvider()`
- `AddressForm` is `'use client'`. Do NOT instantiate the provider at import/render scope in a way that throws during prerender — lazy-init client-side
- MapLibre is optional: never import `MapView` without `maplibre-gl`; import its CSS once in Next apps
- Language default `es`; `region`/`countryRestriction`/`locationBias` prioritize without blocking global fallback
- Public exports via `src/index.ts` (explicit + `export *` for providers/types)
- Commit style: conventional commits, no AI attribution. Single-PR slices (~40-70 lines); reviewer budget 400 lines

## LLM Assist (planned feature)

- Goal: optional server-side helper that re-ranks LocationIQ suggestions and normalizes free text into `AddressData`. Zod validates after. Deterministic fallback wins on any LLM failure.
- Layout: `src/lib/assistant.ts` (types `AssistInput`/`AssistResult`, `deterministicAssist()`, `buildAssistPrompt()`) + `app/api/assist/route.ts` (POST `{text}`, 8s abort, JSON-only reply) + optional `assist` prop in `AddressForm` calling `/api/assist`.
- Env: `LLM_API_KEY` is server-only (Vercel dashboard, never `NEXT_PUBLIC_`). Absent key must fall back to `deterministicAssist()`, never throw.
- Pattern: send only user-typed text + language/country hint; `temperature: 0`; `try/catch` → fallback; `clearTimeout` in `finally`.
- Quick test queries: `Calle Gran Vía 28, Madrid` (city Madrid), `Av. Reforma 222, Ciudad de México` (hint `mx`), `texto roto sin comas madrid` (must fall back, never break).

## Gotchas

- README previously documented Photon default while code defaulted to LocationIQ — source of truth is `src/lib/providers.ts`
- `package.json` metadata (`name`, `license`) must be fixed before publish; verify with `pnpm publish --dry-run`
- Public geocoding endpoints are rate-limited (Nominatim 1 req/s + attribution). Client keys (`NEXT_PUBLIC_*`) are public by design — use a `/api` proxy for production traffic
- `dist/` is committed in this tree; `node_modules`, `.next`, `.env*.local` are ignored
