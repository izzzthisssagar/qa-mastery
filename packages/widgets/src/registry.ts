import type { ComponentType } from "react";
import type { WidgetName } from "./names";
import type { WidgetProps } from "./widget-props";

type WidgetLoader = () => Promise<{ default: ComponentType<WidgetProps> }>;

/**
 * Lazy loaders keep each lesson's bundle limited to the widgets it uses.
 * Lesson frontmatter `widgets:` entries are validated against WIDGET_NAMES
 * by the curriculum sync script, so a typo fails CI instead of a learner.
 */
export const widgetRegistry: Record<WidgetName, WidgetLoader> = {
  "boundary-slider": () => import("./boundary-slider"),
};
