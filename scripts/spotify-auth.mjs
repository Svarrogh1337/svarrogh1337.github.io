// ONE-TIME local helper to obtain a Spotify refresh token.
//
// Prerequisites:
//   1. Create an app at https://developer.spotify.com/dashboard
//   2. In the app settings, add this Redirect URI exactly:
//        http://127.0.0.1:8888/callback
//   3. Copy the app's Client ID and Client Secret.
//
// Run (from the repo root):
//   SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=yyy node scripts/spotify-auth.mjs
//
// It opens the Spotify consent screen, catches the redirect locally, and prints
// your refresh token. Add these three as GitHub repository secrets:
//   SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN
// The refresh token never leaves your machine except as a GitHub secret.

import http from "node:http";
import { exec } from "node:child_process";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT = "http://127.0.0.1:8888/callback";
const SCOPE = "user-read-recently-played";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in your environment first.");
  process.exit(1);
}

const authUrl = "https://accounts.spotify.com/authorize?" + new URLSearchParams({
  client_id: CLIENT_ID, response_type: "code", redirect_uri: REDIRECT, scope: SCOPE,
});

console.log("\nOpening the Spotify consent screen. If it does not open, visit:\n" + authUrl + "\n");
exec(`open "${authUrl}" 2>/dev/null || xdg-open "${authUrl}" 2>/dev/null`);

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith("/callback")) { res.end(); return; }
  const code = new URL(req.url, REDIRECT).searchParams.get("code");
  if (!code) { res.end("No authorization code received."); return; }
  try {
    const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
    const r = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: REDIRECT }),
    });
    const j = await r.json();
    if (j.refresh_token) {
      res.end("Success. Return to your terminal for the refresh token, then close this tab.");
      console.log("\n=== SPOTIFY_REFRESH_TOKEN (add as a GitHub repo secret) ===\n");
      console.log(j.refresh_token);
      console.log("\nKeep it secret. Do not commit it.\n");
    } else {
      res.end("Token exchange failed - see terminal.");
      console.error("Token exchange failed:", j);
    }
  } catch (e) {
    res.end("Error - see terminal.");
    console.error(e);
  } finally {
    server.close();
  }
});

server.listen(8888, () => console.log("Waiting for the Spotify redirect on " + REDIRECT + " ...\n"));
