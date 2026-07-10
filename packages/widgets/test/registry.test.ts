import { describe, expect, it } from "vitest";
import { WIDGET_NAMES, isWidgetName } from "../src/names";
import { widgetRegistry } from "../src/registry";
import {
  BoundarySlider,
  DecisionTable,
  PairwiseVisualizer,
  PartitionPicker,
  StateMachine,
  TriageGrid,
} from "../src/index";

describe("widget registry wiring", () => {
  it("every canonical name has a loader (typo here fails a learner's lesson)", () => {
    for (const name of WIDGET_NAMES) {
      expect(widgetRegistry[name], `no loader for "${name}"`).toBeTypeOf("function");
    }
  });

  it("every loader resolves to a renderable component", async () => {
    for (const name of WIDGET_NAMES) {
      const mod = await widgetRegistry[name]();
      expect(mod.default, `loader for "${name}" has no default export`).toBeTypeOf("function");
    }
  });

  it("each loader points at ITS widget, not a copy-paste neighbour", async () => {
    // The registry's Record type can't catch a loader wired to the wrong
    // module — every loader has the same shape. Identity with the barrel
    // export can.
    const expected = {
      "boundary-slider": BoundarySlider,
      "state-machine": StateMachine,
      "decision-table": DecisionTable,
      "triage-grid": TriageGrid,
      "partition-picker": PartitionPicker,
      "pairwise-visualizer": PairwiseVisualizer,
    } as const;
    for (const name of WIDGET_NAMES) {
      const mod = await widgetRegistry[name]();
      expect(mod.default, `loader for "${name}" resolves to the wrong component`).toBe(
        expected[name],
      );
    }
  });
});

describe("isWidgetName", () => {
  it("accepts every canonical name and rejects junk", () => {
    for (const name of WIDGET_NAMES) expect(isWidgetName(name)).toBe(true);
    expect(isWidgetName("")).toBe(false);
    expect(isWidgetName("boundary_slider")).toBe(false);
    expect(isWidgetName("Boundary-Slider")).toBe(false);
  });
});
