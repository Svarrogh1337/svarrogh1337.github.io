# hhristov.info

Personal website for Hristo Hristov - Platform Engineer, Project Capsule maintainer,
Kubestronaut. Static single-page site, no build step, deployed to GitHub Pages.

## Structure

```
index.html            # the whole page
assets/style.css      # theme + layout (dark/light via CSS variables)
assets/main.js        # theme toggle + typewriter, no dependencies
assets/badges/        # Credly certification badge images
CNAME                 # custom domain (hhristov.info)
.nojekyll             # serve files as-is (no Jekyll processing)
.github/workflows/pages.yml   # deploys the root to GitHub Pages on push to main
```

## Local preview

Any static file server works, e.g.:

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploying

Push to `main`. In the repo: **Settings → Pages → Source → GitHub Actions**.
The workflow publishes the site and applies the `hhristov.info` custom domain.

### Custom domain DNS

Point `hhristov.info` at GitHub Pages:

- `A` records for the apex → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
- or a `CNAME` for `www` → `svarrogh1337.github.io`
