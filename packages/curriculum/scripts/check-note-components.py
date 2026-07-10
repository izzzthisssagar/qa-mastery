#!/usr/bin/env python3
"""Gate: components must be used with the props they actually accept.

The <Term> component takes `define` (the tooltip definition) and `children`
(the vocabulary word shown inline). Writing `<Term term="X">long definition</Term>`
compiles and renders WITHOUT error -- the unknown `term` prop is ignored and the
whole definition becomes an underlined wall of inline text with an empty tooltip.
The anatomy audit (which only greps for `<Term`) and the Playwright sweep (which
only checks for pageerror) both pass it. 26 notes shipped this way before anyone
opened one and looked. Never again.
"""
import glob, re, sys

fails = []
for f in glob.glob("content/notes/**/*.mdx", recursive=True):
    s = open(f).read()
    for m in re.finditer(r"<Term\b([^>]*)>", s):
        attrs = m.group(1)
        if "term=" in attrs and "define=" not in attrs:
            fails.append(f"{f}: <Term term=...> — component takes `define`, not `term`")

for x in fails:
    print("  FAIL", x)
print(f"{'ok — every <Term> uses define=' if not fails else str(len(fails))+' <Term> misuse(s)'}")
sys.exit(1 if fails else 0)
