# Email setup — joe@desertopal.shop (Proton + Cloudflare DNS)

Domain `desertopal.shop` is registered at **Cloudflare**, so Cloudflare is also
the DNS host. Mailboxes are hosted by **Proton** (not self-hosted — see note).

## Why not self-host email
Home/business IPs get blocked (port 25), have no sending reputation, and land in
spam. The website is self-hosted on the rack; **email stays with Proton.**

## Checklist

- [ ] **1. Proton plan** — activate a paid plan with custom domain + 2 logins.
      Recommended start: **Proton Duo** (2 users, shared billing). Upgrade to
      **Proton for Business** later if you want an admin panel / more shared boxes.
- [ ] **2. Add domain in Proton** — Settings → Domain names → Add domain →
      `desertopal.shop`. Proton's wizard generates the exact records below.
- [ ] **3. Add records in Cloudflare** — Dashboard → desertopal.shop → DNS →
      Records. Add each record Proton shows:
  - Verification **TXT** (`protonmail-verification=…`)
  - **MX**: `mail.protonmail.ch` (priority 10), `mailsec.protonmail.ch` (priority 20)
  - **SPF** TXT: `v=spf1 include:_spf.protonmail.ch ~all`
  - **DKIM**: 3 × **CNAME** (`protonmail._domainkey`, `protonmail2._domainkey`,
    `protonmail3._domainkey`) → Proton's targets
  - **DMARC** TXT: name `_dmarc`, value `v=DMARC1; p=quarantine`
- [ ] **4. Verify** in Proton (DNS propagates in minutes on Cloudflare).
- [ ] **5. Create addresses** — `joe@desertopal.shop` + girlfriend's address,
      assign each to its user, set as default send-from.
- [ ] **6. Test** — send to an outside Gmail and reply back; confirm not in spam.

## Cloudflare gotchas (important)
- **DKIM CNAMEs must be "DNS only" (grey cloud), not Proxied (orange).** Proxying
  breaks DKIM. Toggle the cloud icon to grey on each of the 3 DKIM records.
- **Do NOT enable Cloudflare Email Routing.** It adds conflicting MX records that
  silently break Proton mail delivery. Leave it off.
- Use the **exact** DKIM/verification values from Proton's wizard (account-specific);
  the MX/SPF/DMARC values above are standard.
