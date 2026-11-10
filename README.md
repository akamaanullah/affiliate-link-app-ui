# Northline

Private affiliate desk. People with an issued login generate Amazon and Walmart links on the house tracking IDs. They do not connect their own affiliate accounts.

The site is static HTML, CSS, and vanilla JavaScript. There is no build step. All figures are sample data in `js/data.js`.

## Run

```bash
python3 -m http.server 43117
```

Open http://127.0.0.1:43117

Use a local server. The service worker that makes the app installable does not register from a `file://` URL.

Paths are relative, including the manifest and the service worker, so the same files load at the server root and under a project subpath such as `/affiliate-link-app-ui/` on GitHub Pages. `.nojekyll` keeps Pages from running the site through Jekyll. `.github/workflows/pages.yml` publishes the repository root.

## Demo accounts

Every issued account uses the password `desk-2041`.

| Email | What you can do |
| --- | --- |
| `mara.chen@northline.test` | Affiliate. Generate links and read your own reports. |
| `amelia.brooks@northline.test` | Analyst. Reports only. Generating and sharing are off. |
| `admin@northline.test` | Admin. Users, tracking IDs, branding, compliance. |
| `luis.ortega@northline.test` | Pending. Sign-in is refused until an admin approves it. |
| `hannah.vogel@northline.test` | Suspended. Sign-in is refused. |

There is no signup. Request access on the sign-in screen. The request appears under Admin → Users.

## Pages

Sign in is `index.html`.

Affiliate desk, `app.html`:

- `#/dashboard` — clicks, orders, earnings, assigned tracking IDs
- `#/generate` — Amazon or Walmart link from a URL, ASIN, or item id
- `#/search` — keyword search, then create a link
- `#/sellers` — search by the listing’s seller name
- `#/history` — links created in this desk
- `#/whatsapp` — `wa.me` share with the disclosure locked on
- `#/bot` — local preview of a WhatsApp helper. Nothing is sent
- `#/activity` — views, outbound clicks, orders
- `#/reports` — orders, earnings, category rates, CSV export
- `#/countries` — marketplace split
- `#/tags` — tracking-ID clicks, orders, earnings, OneLink
- `#/seo` — search engines, keywords, landing pages, referrers

Admin, `admin.html`:

- `#/overview` — house totals and approvals
- `#/users` — create, approve, suspend, roles, assign tracking IDs
- `#/tags` — house tracking IDs
- `#/links` — every generated link. Archive hides it here only
- `#/reports` — per-person performance
- `#/integrations` — Amazon and Walmart connected. Others marked coming soon
- `#/settings` — branding, compliance checklist, workspace

## Change the name

Defaults live in `js/config.js`: `name`, `accent`, `disclosure`, `walmartDisclosure`, `domain`, `supportEmail`.

`css/app.css` sets `--link` to the same accent so the first paint matches. If you change the default accent, change both.

An administrator can override the name, accent, and domain under Settings → Branding. That override stays in this browser.

The installed app name is separate. Edit `name` and `short_name` in `manifest.json`. Icons are in `icons/`. Rebuild the PNGs with `python3 tools/make-icons.py` if you redraw the mark.

## How links are built

Amazon: `https://www.amazon.<marketplace>/dp/<ASIN>?tag=<tracking-id>`

The tracking ID is the one an administrator assigned for that country. A pasted `tag` is replaced. `amzn.to`, `a.co`, and other shorteners are rejected.

Walmart stays on `www.walmart.com` with the item id in the path and the house Impact parameters in the query. `sharedid` is the desk user, so the house can tell links apart. The shopper still lands on Walmart.

OneLink is a flag on the tracking ID. The URL does not change. When it is on, Amazon may send a shopper to their local store.

Share text always ends with: `As an Amazon Associate I earn from qualifying purchases.`

Prices, when shown, include the date they were recorded and are labeled as samples.

## What is not live

There is no backend. Sign-in, new users, generated links, and branding edits are stored in this browser. Clearing site data, or Settings → Workspace → Clear demo edits, removes those edits. The sample catalog stays.

The WhatsApp screen builds a real `wa.me` link, but the bot page is only a preview. The custom domain field does not attach DNS. Earnings use sample category rates, not a file from Amazon Associates.
