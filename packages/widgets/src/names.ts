/**
 * Canonical widget names. React-free on purpose: the curriculum sync script
 * imports this file under plain Node to validate lesson frontmatter
 * `widgets:` entries without pulling in any JSX.
 */
export const WIDGET_NAMES = ["boundary-slider", "state-machine", "decision-table"] as const;

export type WidgetName = (typeof WIDGET_NAMES)[number];

export function isWidgetName(value: string): value is WidgetName {
  return (WIDGET_NAMES as readonly string[]).includes(value);
}
