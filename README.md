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
scripts/              # Spotify sync + one-time auth helper
CNAME                 # custom domain (hhristov.info)
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
