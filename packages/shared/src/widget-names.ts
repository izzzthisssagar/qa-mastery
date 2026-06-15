/**
 * Canonical widget names — the source of truth shared between the curriculum
 * sync (which validates lesson frontmatter `widgets:` entries) and the widgets
 * package (which maps each name to a component). Lives in `shared` so the
 * content/registry layer needn't depend on the UI-widget layer. React-free on
 * purpose: importable under plain Node.
 */
export const WIDGET_NAMES = [
  "partition-picker",
  "boundary-slider",
  "decision-table",
  "triage-grid",
  "state-machine",
  "pairwise-visualizer",
] as const;

export type WidgetName = (typeof WIDGET_NAMES)[number];

export function isWidgetName(value: string): value is WidgetName {
  return (WIDGET_NAMES as readonly string[]).includes(value);
}
