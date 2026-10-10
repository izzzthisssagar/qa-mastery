# Sprint 03 — Isolated Supabase Test-Environment Attempt

**Run date:** 2026-10-10, Asia/Kathmandu. **Result:** STOPPED SAFELY / AUTHENTICATED ACCEPTANCE BLOCKED.

## Purpose and authorization

The product owner approved running a local Colima/Docker/Supabase setup for a disposable learner so the _real authenticated_ Boundary Value Analysis note could be visually reviewed at mobile, tablet and desktop sizes. Scope: local migrations only, no hosted Supabase/Vercel changes, no production credentials, no existing project-volume reset.

## Before the attempt

- Worktree: `work/v2-sprint03`, base `c1ba7c5`. Original checkout and Sprint 02 kept separate.
- Device: macOS 27.0.1, Apple Silicon, 16 GB RAM.
- Available space was approximately **6.5 GiB** (97% full); Colima default profile was stopped, set to 2 CPU, 4 GiB memory, 20 GiB virtual disk.
- Original Supabase config project ID: `qa-mastery`, normal local API port 54321. No Supabase containers running. The old Docker baseline contained six images, one unrelated portfolio container, and two unrelated local volumes.

## CLI integrity and isolated configuration

The installed Supabase CLI 2.106.0 Mac executable was terminated with SIGKILL by macOS because `codesign --verify` reported an invalid embedded signature. The installed binary SHA-256 was checked against the exact binary in the published npm package, and the downloaded npm tarball SHA-512 exactly matched npm registry `dist.integrity`. Both commands executed only after making **temporary, separately ad-hoc-signed copies** of the verified CLI shim and `supabase-go` companion under `/tmp`. **The installed package and repository were not re-signed or modified.** The temporary binaries were later deleted.

A private temporary copy of the 37 repository migrations and config was created, with unique project ID `qa-mastery-v2-s03-disposable`, API 55321, database 55322 and other isolated 5532x ports, and the site redirect targeting local port 3014. No `supabase link`, `db push`, or remote connection command was executed. The temporary copied config was deleted after the attempt.

## Runtime attempt and disk guard

1. Colima started from the existing local default profile; Docker daemon 29.5.2 became ready.
2. Launched `supabase start` against the **temporary** workdir with nonessential services excluded and a process-based disk guard intended to stop if free space fell below 3 GiB.
3. Docker's image pulls were much larger than the available safe headroom. The available disk fell below 3 GiB and continued down to **under 1 GiB** during the attempted termination. `supabase` launched a `supabase-go` child that outlived termination of the parent process; both **only those owned startup processes** were then stopped. Future runners must supervise the complete process tree rather than only the shim PID.
4. A single **disposable test-only** PostgreSQL container and volume had briefly been created: `supabase_db_qa-mastery-v2-s03-disposable`. It was stopped and removed, together with its newly pulled image and the other images absent from the preflight snapshot.
5. Verified Docker resource inventory returned **exactly to baseline:** six pre-existing images, one unrelated portfolio container, and two original volumes. No original containers/volumes/images were deleted.
6. Ran guest `fstrim -av`, including approximately 4.3 GiB of discarded blocks on the Colima data disk, returning free host storage to ~4.9 GiB; then stopped Colima, removed temporary signed binaries, npm archive and copied project. Final observed free disk **~5.1 GiB**. Colima status: **Stopped**.

**Important correction:** This was not stopped before all disposable DB resources were created. The isolated test DB container and volume did briefly exist and were explicitly removed. No authenticated user, applied migration-success result, or completed database/learner acceptance was recorded.

## Outcome and next gate

- **Real signup / authenticated note render:** **NOT RUN**; no live Supabase/Auth dependency available after cleanup.
- **Hosted database and deployment:** **UNCHANGED**.
- **Production/source data and seed truth:** **UNCHANGED**.
- **Public BuggyShop fallback:** Can be verified without Supabase at localhost:3011; six real Chrome checks were run successfully across 390/768/1440, keyboard operation, route navigation, and visible requirement. See `ACCEPTANCE_LOG.md`, `SCREENSHOT_MANIFEST.md` and `BUG_BACKLOG.md`.
- **Next authorized prerequisite:** At least **12–15 GiB free disk** (or an isolated ephemeral CI runner) before attempting the containerized Auth/database stack again. Rebuild the temporary isolated config; include child-process-tree termination plus ongoing disk/memory monitoring. An independent beginner walkthrough remains a separate human acceptance gate.

This report is an evidence-backed environment incident record, not a completed authentication or lesson acceptance.

## Post-incident process ownership

Following the 6/6 fallback Chrome test run, only the three **Sprint 03-owned** Next preview listeners on ports 3001, 3011, and 3013 were stopped, after confirming their live PIDs matched the processes this session had created. The older listeners on 3000 and 3002 were deliberately not modified. Host free-memory percentage recovered to about 70%; the host still had only ~5.1 GiB free disk and is **not** cleared for another full Supabase startup.
