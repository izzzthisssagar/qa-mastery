# Finish Remaining Curriculum Modules — Multi-Agent Design

## Goal

Finish every approved-map module that is not fully backed by notes while preserving the existing
rich-note quality bar, avoiding cross-agent collisions, and keeping every change local until Sajan
separately approves integration or push operations.

The authoritative map contains 48 modules. Current source evidence shows 33 complete modules and 15
unfinished modules: partial M24–M26 plus unstarted M37–M48. Earlier `32/48` state text is stale and
must be corrected when the first new module completion updates durable state.

## Ownership Model

- One fresh Codex subagent owns one module from its first unfinished chapter through module completion.
- Claude1 and Claude2 are unavailable because of weekly limits; their paused M24 and M25 ownership is
  transferred to Codex workers by Sajan's explicit instruction.
- Root is the only orchestrator. Root owns claims, worktree creation, cross-module sequencing, final
  taxonomy review, task review, durable state, and Git integration decisions.
- Maximum active capacity is three module workers plus root. When one module is accepted, that worker
  stops and a fresh agent claims the next queued module.
- No agent may claim a second module, edit another module, modify shared coordination history, push,
  merge, publish, deploy, or delete another lane's work.

## Queue

| Order | Map module | Current state | Assigned when slot opens |
|---:|---|---:|---|
| 1 | M24 Non-functional testing (intro) | 8/20 | fresh module agent |
| 2 | M25 Automation foundations | 8/16 | fresh module agent |
| 3 | M26 Selenium WebDriver | 4/16 on existing isolated branch | fresh module agent |
| 4 | M37 Performance testing | 0/12 | fresh module agent |
| 5 | M38 Security testing — web | 0/20 | fresh module agent |
| 6 | M39 API & modern security | 0/20 | fresh module agent |
| 7 | M40 Accessibility testing | 0/16 | fresh module agent |
| 8 | M41 Mobile testing | 0/16 | fresh module agent |
| 9 | M42 Agile & DevOps for testers | 0/12 | fresh module agent |
| 10 | M43 Test management & reporting | 0/20 | fresh module agent |
| 11 | M44 AI & the modern tester | 0/16 | fresh module agent |
| 12 | M45 A portfolio that gets interviews | 0/12 | fresh module agent |
| 13 | M46 Résumé & applications | 0/12 | fresh module agent |
| 14 | M47 Interviews | 0/16 | fresh module agent |
| 15 | M48 Your first 90 days | 0/16 | fresh module agent |

This is a rolling queue, not five rigid batches. Completion of any active module opens the next slot.

## Isolation and Git

- M24 and M25 start from current clean integration commit `b7c2f6a` in separate project-local
  `.worktrees/` branches.
- M26 continues from existing isolated branch `codex/selenium-webdriver-ch1`, which already contains
  the verified chapter-1 commit `4d34d20`.
- M37–M48 each receive a separate branch/worktree from the latest human-approved local integration
  base available when claimed.
- Each module agent commits one chapter at a time. One chapter is one Loop cycle: claim exact paths,
  author, verify, commit, update its report, then continue to the next chapter in the same module.
- Root reviews the complete module commit range. Critical or Important findings return to the same
  module agent before the slot is released.
- Completed branches remain local and unmerged. Merge, push, publication, deployment, and destructive
  worktree cleanup remain human gates.

## Note Quality Contract

Every new topic must follow the established rich-note anatomy:

1. Valid frontmatter with stable three-part related links.
2. Hook, distinct real-life analogy, `<Term define=...>`, explanation, tip, and mistake callouts.
3. One visually inspected, license-verified image with exact credit/source and meaningful hotspot pins.
4. One flow animation tied to the lesson's central model.
5. Exactly one runnable Python and one runnable Java playground using standard libraries only.
6. Failure-sensitive assertions, predicate-derived result labels, and semantic output parity.
7. First-time checklist, break/fix guide, where-to-check evidence, and worked example.
8. Quiz, flashcards, challenge, community prompt, live primary resources, exact-title embeddable video,
   takeaways, and `<Complete xp={10} />`.

Technical topics require current primary documentation. Medical, legal, security, accessibility,
privacy, AI, and employment claims require scope-safe language and current authoritative sources.
Unsafe security examples must use authorized local/test/training targets, synthetic data, minimal proof,
and explicit authorization boundaries.

## Verification Contract

Each topic pair of playgrounds is extracted from final MDX and executed with `python3` and
`javac`/`java`; outputs must match semantically. Agents must run mutation checks proving assertions
fail when the modeled defect is accepted. Every image is viewed after download and every video is
checked through YouTube oEmbed/embed metadata.

Each chapter must pass focused MDX, component, image, related-link, placeholder/conflict-marker,
whitespace, playground, and source checks before its local commit. Each complete module must pass:

```text
pnpm test
pnpm typecheck
pnpm --filter @qa-mastery/curriculum sync
node packages/curriculum/scripts/check-note-mdx-compile.mjs
python3 packages/curriculum/scripts/check-note-components.py
python3 packages/curriculum/scripts/check-note-images.py
git diff --check
```

Root then performs independent spec and quality review. A module is complete only when its taxonomy
has zero planned leaves, every expected MDX/media pair exists, gates pass, review has no open Critical
or Important findings, local commits exist, and durable coordination state records the result.

## Collision and Failure Handling

- Root records an exact module claim before an agent writes files.
- Agents receive exact allowed content, media, taxonomy, report, and branch paths.
- Agents never share a worktree or Git index.
- Network or dependency failures are retried through approved escalation; invented sources, videos,
  licenses, or technical claims are prohibited.
- If an agent stops or hits a limit, its files are treated as untrusted. A recovery agent inherits only
  that module after a fresh claim and re-verifies every inherited artifact.
- Repeated unresolved gate failures or cross-lane conflicts stop that module without blocking other
  independent workers.

## Completion

The program finishes when all M1–M48 modules are complete in source, final whole-curriculum tests and
content gates pass, state reports `48/48`, all module branches and commit hashes are recorded, and no
module is actively claimed. Integration and remote publication remain separate human-approved work.
