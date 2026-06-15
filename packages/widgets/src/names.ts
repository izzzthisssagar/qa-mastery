// The canonical widget-name list lives in @qa-mastery/shared so the curriculum
// (content/registry) layer doesn't have to depend on this UI package. Re-export
// it here for the registry and the existing "@qa-mastery/widgets/names" entry.
export { WIDGET_NAMES, isWidgetName, type WidgetName } from "@qa-mastery/shared/widget-names";
