# Frontend (Next.js)

## Version

- Frontend app version: `2.1.0`
- Standalone PWA shell version: `2.1.0`

## Development

`next dev` may log a Serwist + Turbopack notice; the service worker is **disabled** in development anyway (`next.config.ts`). Use `next dev --webpack` if you need a webpack dev server without that warning.

## PWA (installable web app)

- **Manifest**: `app/manifest.ts` (served as `/manifest.webmanifest`).
- **Service worker**: Serwist (`app/sw.ts` → built to `public/sw.js` at build time; file is gitignored).
- **Offline fallback**: `/~offline`.
- **Build**: `npm run build` uses **`next build --webpack`** so `@serwist/next` can inject its webpack config (Next.js 16 defaults to Turbopack otherwise).
- **Icons**: `public/icons/` — `pwa-192.png`, `pwa-512.png`, `apple-touch-icon.png` (member artwork on web gray `#1e1e1e`), plus `shortcut-member-96.png` / `shortcut-trainer-96.png` for manifest shortcuts. Regenerate with:
  `python tools/generate_pwa_icons_from_brand.py --member …/member.png --trainer …/trainer.png`

After deploy, verify install + Lighthouse PWA checks in Chrome (and “Add to Home Screen” on iOS Safari).

## Mobile shell

Member and trainer routes use a shared nav config (`lib/nav/roleNav.ts`), desktop sidebar (`components/ui/Sidebar.tsx`), and a mobile bottom bar (`components/ui/MobileBottomNav.tsx`) plus the existing navbar hamburger for the full drawer.

## Flutter / native apps

Native clients under `../Flutter/gms_mobile` are **not** required for the PWA path. Prefer this Next.js app as the single mobile UI unless you need Play Store TWAs or native-only capabilities (e.g. legacy FCM flows), in which case treat Flutter as optional or archival.
