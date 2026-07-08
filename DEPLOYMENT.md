# Deploying Smart Degree Planner

The app is two pieces that deploy separately: the **backend** (Express API) and the **frontend** (static React build). Both have generous free tiers, so this costs nothing to host as a portfolio demo.

## 1. Backend → Render

1. Push this repo to GitHub (see the main README for the exact commands).
2. Go to [render.com](https://render.com) and sign in with GitHub.
3. **New > Blueprint**, select this repo. Render will detect `render.yaml` at the repo root and configure the service automatically (root dir `backend`, build `npm install`, start `npm start`).
4. Before the first deploy, set the `CORS_ORIGIN` environment variable on the service to your frontend's URL (you'll get this in step 2 below — you can come back and update it after).
5. Deploy. Once live, note the service URL, e.g. `https://smart-degree-planner-api.onrender.com`.
6. Sanity check: visit `https://<your-service>.onrender.com/api/health` — you should see `{"ok":true}`.

**Note on persistence:** Render's free plan uses an ephemeral disk, so the SQLite database (and any saved plans) resets whenever the service restarts or redeploys — the seed data reloads automatically, so the app is never broken, but saved plans won't survive a restart. That's an acceptable tradeoff for a free demo; see `render.yaml` for how to attach a persistent disk if you want saved plans to stick around.

## 2. Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. **Add New > Project**, select this repo.
3. Set **Root Directory** to `frontend` (Vercel auto-detects the Vite framework preset once you do).
4. Add an environment variable: `VITE_API_URL` = your Render backend URL from step 1 (no trailing slash).
5. Deploy. You'll get a URL like `https://smart-degree-planner.vercel.app`.
6. Go back to Render and set `CORS_ORIGIN` on the backend service to this Vercel URL, then redeploy the backend so it accepts requests from it.

## 3. Verify end-to-end

Open the Vercel URL, confirm the program selector loads real data (not a CORS/network error), generate a plan, and try saving it. If you see a CORS error in the browser console, double-check `CORS_ORIGIN` on Render matches your frontend URL exactly (including `https://`, no trailing slash).

## Alternatives

- **Railway** works the same way as Render for the backend (Node service, same env vars).
- **Netlify** works the same way as Vercel for the frontend (set base directory to `frontend`, build command `npm run build`, publish directory `dist`, and the same `VITE_API_URL` env var).
