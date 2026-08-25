# Standalone version (Live Server friendly)

This `index.html` is the **entire app in one file** — questions, scoring logic, and the UI are
all embedded directly, using React/Babel/jsPDF loaded from a CDN. There is **nothing to install
and no backend to run.**

## How to open it

**Option A — VS Code Live Server (what you were already trying):**
1. Right-click `standalone/index.html` in the VS Code file explorer.
2. Click **"Open with Live Server."**
3. It should open in your browser and work immediately.

**Option B — just double-click it:**
Double-click `index.html` in File Explorer and it opens directly in your browser. No server
needed at all for this version (a couple of browser features like the microphone may require
`http://` instead of `file://` in some browsers — if so, use Live Server instead of double-click).

> ⚠️ Requires an internet connection the **first time** you open it, since it loads React,
> Babel, and jsPDF from a CDN. After that, your browser caches them.

## What's different from the full project

| | Standalone (`standalone/index.html`) | Full project (`backend/` + `frontend/`) |
|---|---|---|
| Setup | Open one file | `npm install` + `npm run dev` ×2 |
| Scoring | Local heuristic (technical/communication/confidence) | Same heuristic **or** real Claude AI (with an API key) |
| Question generation | Fixed built-in bank | Built-in bank **or** fresh AI-generated questions |
| History storage | Browser `localStorage` (this device/browser only) | Backend `sessions.json` (shared across devices hitting the same server) |
| All other features (timer, hints, voice, camera, PDF, streaks, study mode, light/dark) | ✅ Same | ✅ Same |

If this version works for you, great — it's genuinely a complete, working project on its own.
If you later want real AI-graded feedback from Claude, move on to the full backend + frontend
setup described in the main `README.md`.
