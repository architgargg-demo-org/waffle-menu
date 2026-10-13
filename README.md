# Golden Grid Waffle Co. — Digital Menu

A customer-facing waffle menu built with plain HTML, CSS, and JavaScript (no framework, no backend).
The menu is loaded at runtime from [`data/waffle_menu.csv`](data/waffle_menu.csv), which is the single source of truth.

Features: category-grouped menu cards, category filters, text search, a featured seasonal area,
and clear vegetarian / vegan / gluten-friendly / seasonal badges. Internal columns such as `cost_usd`
are never displayed, and the published site strips that column from its copy of the CSV.

## Run locally

Requires Python 3 (or any static file server). Browsers block `fetch` from `file://`, so serve the folder:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Validate

Requires Node.js 18+:

```sh
node scripts/validate_menu.mjs          # parses the CSV with the app's parser and checks the data
python3 scripts/pii_scan.py data        # confirms no customer PII is in the data folder
```

## Update the menu

Edit `data/waffle_menu.csv` and keep its header columns. Changes appear on the next page load.

## Deploy

Pushing to `main` runs `.github/workflows/pages.yml`, which validates the menu and publishes the site to GitHub Pages
(Settings → Pages → Source: **GitHub Actions**).
