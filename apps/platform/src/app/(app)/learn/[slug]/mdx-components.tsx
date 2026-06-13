import type { ComponentProps } from "react";

/**
 * Prose styling for the lesson MDX body. Plain (server) components — the only
 * interactive node is the widget, which the page injects separately. Kept
 * minimal: the platform has no @tailwindcss/typography, so each element is
 * styled by hand to match the zinc theme.
 */
export const mdxComponents = {
  h2: (props: ComponentProps<"h2">) => (
    <h2 className="mt-10 text-xl font-semibold tracking-tight text-zinc-100" {...props} />
  ),
  h3: (props: ComponentProps<"h3">) => (
    <h3 className="mt-8 text-lg font-semibold text-zinc-100" {...props} />
  ),
  p: (props: ComponentProps<"p">) => <p className="mt-4" {...props} />,
  ul: (props: ComponentProps<"ul">) => (
    <ul className="mt-4 list-disc space-y-1.5 pl-6 marker:text-zinc-600" {...props} />
  ),
  ol: (props: ComponentProps<"ol">) => (
    <ol className="mt-4 list-decimal space-y-1.5 pl-6 marker:text-zinc-600" {...props} />
  ),
  li: (props: ComponentProps<"li">) => <li className="pl-1" {...props} />,
  strong: (props: ComponentProps<"strong">) => (
    <strong className="font-semibold text-zinc-100" {...props} />
  ),
  a: (props: ComponentProps<"a">) => (
    <a className="text-accent underline underline-offset-2 hover:text-emerald-300" {...props} />
  ),
  blockquote: (props: ComponentProps<"blockquote">) => (
    <blockquote
      className="mt-6 border-l-2 border-accent/50 bg-zinc-900/40 px-4 py-2 text-zinc-400"
      {...props}
    />
  ),
  code: (props: ComponentProps<"code">) => (
    <code
      className="rounded bg-zinc-800 px-1.5 py-0.5 text-[0.85em] text-emerald-300"
      {...props}
    />
  ),
};
