// Fetches recently played tracks from Spotify and writes assets/mood.json.
//
// Runs in CI (see .github/workflows/spotify-mood.yml). Reads three secrets
// from the environment; if any are missing it exits cleanly without touching
// mood.json, so the site keeps its existing (or sample) data.
//
//   SPOTIFY_CLIENT_ID
//   SPOTIFY_CLIENT_SECRET
//   SPOTIFY_REFRESH_TOKEN   (obtained once via scripts/spotify-auth.mjs)
//
// Requires Node 18+ (global fetch).

import { writeFile } from "node:fs/promises";

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } = process.env;
const OUT = "assets/mood.json";

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
  console.log("Spotify secrets not set - skipping (mood.json left unchanged).");
  process.exit(0);
}

async function accessToken() {
  const basic = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64");
  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: SPOTIFY_REFRESH_TOKEN }),
  });
  if (!r.ok) throw new Error(`token request ${r.status}: ${await r.text()}`);
  return (await r.json()).access_token;
}

async function main() {
  const token = await accessToken();
  const r = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=12", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`recently-played ${r.status}: ${await r.text()}`);
  const data = await r.json();

  const seen = new Set();
  const tracks = [];
  for (const item of data.items || []) {
    const t = item.track;
    if (!t || seen.has(t.id)) continue;
    seen.add(t.id);
    const imgs = t.album?.images || [];
    tracks.push({
      name: t.name,
      artist: (t.artists || []).map((a) => a.name).join(", "),
      url: t.external_urls?.spotify || null,
      image: (imgs[imgs.length - 1] || imgs[0] || {}).url || null, // smallest thumbnail
      played_at: item.played_at,
    });
    if (tracks.length >= 6) break;
  }

  if (!tracks.length) {
    console.log("No recent tracks returned - leaving mood.json unchanged.");
    return;
  }

  const payload = { updated: new Date().toISOString(), sample: false, tracks };
  await writeFile(OUT, JSON.stringify(payload, null, 2) + "\n");
  console.log(`Wrote ${tracks.length} tracks to ${OUT}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
