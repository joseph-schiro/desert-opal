# Desert Opal Succulents & Cacti

Website + admin for the Desert Opal plant business.

## Structure

- `web/` — the Next.js 16 app (storefront + admin back end).

## Tech stack

- **Next.js 16** (App Router, React 19, Turbopack) + **TypeScript**
- **Tailwind CSS v4** (theme tokens defined in `web/src/app/globals.css`)
- Fonts: **Fraunces** (display) + **Nunito** (body)
- Planned commerce backend: **Shopify (headless)** via the Storefront API —
  gives us checkout, payments, shipping, taxes, and Shop app presence, while we
  keep a fully custom storefront + admin.

## Running locally

```powershell
cd web
npm install   # first time only
npm run dev   # http://localhost:3000
```

## Key routes

| Route                | What it is                                   |
| -------------------- | -------------------------------------------- |
| `/`                  | Storefront home (hero, featured, categories) |
| `/shop`              | Catalog with `?category=` filter             |
| `/products/[slug]`   | Product detail page                          |
| `/admin`             | Admin dashboard (inventory KPIs)             |
| `/admin/products`    | Inventory table                              |
| `/admin/orders`      | Orders (placeholder until checkout is wired) |
| `/admin/settings`    | Store settings (placeholder)                 |

## How the data layer works

All product data flows through `web/src/lib/catalog.ts`. Today it returns
hand-written mock plants; the types mirror Shopify's model (money in cents,
`slug`/handle, stock counts). When the Shopify store is ready, swap the bodies
of those functions to call the Storefront API — pages and components are
untouched.

## Next steps (roughly in order)

1. **Real photos** — replace the emoji `PlantPhoto` placeholder with `next/image`.
2. **Shopify backend** — create the store, connect the Storefront API, point
   `catalog.ts` at it, and add a real cart + checkout.
3. **Admin auth** — the `/admin` section is currently unprotected; add a login
   before deploying.
4. **Deploy** — Vercel is the easiest host for Next.js.
