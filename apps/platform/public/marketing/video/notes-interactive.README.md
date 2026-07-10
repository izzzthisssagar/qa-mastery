# notes-interactive.mp4 — not in the working tree

The 28 MB "Notes That Fight Back" reel was removed from `public/` because
everything under `apps/platform/public/` is bundled into every Vercel build,
and nothing in the codebase references this file.

- **Recover it:** `git show eb30574:apps/platform/public/marketing/video/notes-interactive.mp4 > notes-interactive.mp4`
- **Before using it in the product:** host it externally (Vercel Blob, S3, YouTube)
  and reference the URL. Do not re-add a video of this size to `public/`.

Smaller reels (`intro.mp4`, `why-different.mp4`, etc.) remain here; they predate
this branch and are each a few MB.
