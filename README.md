# ORION Energy — Website

Solutions de recharge pour véhicules électriques au Cameroun.

## Stack

- **Eleventy (11ty)** — Static site generator with Nunjucks templates
- **Cloudflare Pages** — Hosting, CDN, SSL
- **Sveltia CMS** — Content management at `/admin/`
- **Cloudinary** — Image optimization and delivery
- **Google Apps Script** — Form backend → Google Sheets + email notifications
- **Lucide Icons** — Iconography
- **Google Fonts** — Montserrat + Inter

## Development

```bash
npm install
npm run dev     # Local dev server with hot reload
npm run build   # Production build to _site/
```

## Deployment

Cloudflare Pages auto-builds on every push to `main`.

- **Build command:** `npx @11ty/eleventy`
- **Output directory:** `_site`

## Configuration

Edit `src/_data/site.json` for site-wide settings (phone, email, WhatsApp, form endpoint, analytics).

## CMS

Access at `yoursite.com/admin/`. Requires GitHub OAuth via Cloudflare Worker.

## Structure

```
src/
├── _data/          # JSON data files (site config, services, FAQ, etc.)
├── _includes/      # Nunjucks layouts and partials
├── css/            # Stylesheets
├── js/             # Client-side JavaScript
├── images/         # Static images
├── admin/          # Sveltia CMS
├── services/       # Service pages
└── [pages]/        # Individual page directories
```
