# hhristov.info

Personal website for Hristo Hristov - Platform Engineer, Project Capsule maintainer,
Kubestronaut. Static single-page site, no build step, deployed to GitHub Pages.

## Structure

```
index.html            # the whole page
assets/style.css      # theme + layout (dark/light via CSS variables)
assets/main.js        # theme toggle, typewriter, fire easter egg, mood section
assets/badges/        # Credly certification badge images
assets/mood.json      # recent Spotify tracks (sample data until connected)
assets/og-card.png    # 1200x630 link-preview image, rendered from scripts/og-card.html
scripts/              # Spotify sync, one-time auth helper, social card source
robots.txt            # allow all crawlers, points at the sitemap
sitemap.xml           # single URL
.nojekyll             # serve files as-is (no Jekyll processing)
.github/workflows/pages.yml          # deploys the root to GitHub Pages on push to main
.github/workflows/spotify-mood.yml   # refreshes mood.json every 3 hours
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

## Link previews and SEO

`index.html` carries Open Graph and Twitter card tags, a canonical URL, and a
schema.org `Person` record. The preview image is `assets/og-card.png`, rendered
from `scripts/og-card.html` with headless Chrome so it uses the site's own type
and colours. To regenerate it after editing the template:

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
  --hide-scrollbars --window-size=1200,630 --virtual-time-budget=8000 \
  --screenshot=assets/og-card.png "file://$PWD/scripts/og-card.html"
```

Messenger, Facebook, and LinkedIn cache previews for weeks. After deploying a
change to the tags or the image, force a re-scrape:

- Facebook and Messenger: https://developers.facebook.com/tools/debug/ (paste the URL, "Scrape Again")
- LinkedIn: https://www.linkedin.com/post-inspector/
- Telegram: send the URL to `@WebpageBot`

## Connecting Spotify ("Current Mood" section)

The Mood section reads `assets/mood.json`, refreshed by the `spotify-mood`
workflow. Until connected it shows sample data. To wire up your real listening:

1. Create an app at https://developer.spotify.com/dashboard and add the
   Redirect URI `http://127.0.0.1:8888/callback`. Note the Client ID + Secret.
2. Get a refresh token once, locally (the token never leaves your machine):
   ```sh
   SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=yyy node scripts/spotify-auth.mjs
   ```
   Approve the consent screen; the terminal prints your refresh token.
3. Add three **repository secrets** (Settings → Secrets and variables → Actions):
   `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`.
4. Run the **Sync Spotify mood** workflow once (Actions tab → Run workflow).
   It then refreshes every 3 hours. Adjust the cron in the workflow to taste.

The scope requested is `user-read-recently-played` only.
