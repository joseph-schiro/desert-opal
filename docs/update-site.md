# Updating the live site (desertopal.shop)

How to ship a change from your laptop to the live site.

**Hosting model:** the site runs on a DigitalOcean **Droplet** (VM), served by
**pm2** and fronted by a **Cloudflare tunnel**. A `git push` alone does **not**
update the site — you must pull and rebuild on the droplet.

There are two halves: **(A) push your code from your laptop**, then
**(B) pull + rebuild + restart on the droplet**.

---

## A. On your laptop (push the code)

From the project root (`.../Projects/DesertOpal`):

```bash
git add web/                      # stage your app changes
git commit -m "Describe the change"
git push origin main
```

> The site deploys from the `main` branch, so commit to `main`.

---

## B. On the droplet (make it live)

SSH in:

```bash
ssh root@<droplet-ip>            # credentials are in DesertOpal.kdbx
```

Then run the deploy cycle. **The app lives in the `web/` subfolder:**

```bash
cd ~/desert-opal/web
git pull origin main
npm ci                           # installs deps; strictly needed only when
                                 # package-lock.json changed, but safe to run
npm run build                    # production build — must succeed before restart
pm2 restart desertopal           # restart just the app (leave the tunnels alone)
```

That's it — the change is live.

### Verify it worked

```bash
pm2 list                         # 'desertopal' should be 'online'
pm2 logs desertopal --lines 50   # check for runtime errors (Ctrl+C to exit)
```

Then hard-refresh https://desertopal.shop in the browser (Ctrl+Shift+R) to get
the new bundle.

---

## Notes & gotchas

- **Build before restart.** If `npm run build` errors, **do not** restart — the
  old build keeps serving, so the live site stays up while you fix the problem.
- **Process name is `desertopal`** (one word). The two `tunnel` pm2 processes are
  the Cloudflare tunnel — don't restart those unless the site is unreachable.
  Avoid `pm2 restart all` so you don't bounce the tunnels needlessly.
- **Node version:** Next 16 / React 19 need Node 20+. If the build fails right
  after a fresh droplet setup, check `node -v` first.
- **Env vars** live in `web/.env.local` on the droplet (e.g. Shopify keys). That
  file is git-ignored, so changes to it must be made directly on the droplet.

---

## Quick reference (copy/paste)

Laptop:
```bash
git add web/ && git commit -m "…" && git push origin main
```

Droplet:
```bash
cd ~/desert-opal/web && git pull origin main && npm ci && npm run build && pm2 restart desertopal
```
