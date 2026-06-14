"use client";

import {
  BoundarySlider,
  StateMachine,
  DecisionTable,
  TriageGrid,
  PartitionPicker,
} from "@qa-mastery/widgets";
import { useLessonProgress } from "./progress-context";

/**
 * The lesson's "See it" widget, mapped into the MDX as `<BoundarySlider />`.
 * Renders the Boundary Hunter and marks the `see` step done once the learner
 * discovers the seeded off-by-one bug by walking the edge.
 */
export function SeeWidget() {
  const { slug, markStep } = useLessonProgress();
  return (
    <div className="my-6">
      <BoundarySlider
        lessonSlug={slug}
        onMilestone={(milestone) => {
          if (milestone === "found-boundary-bug") markStep("see");
        }}
      />
    </div>
  );
}

/** The order-lifecycle state machine, mapped into the MDX as `<StateMachine />`. */
export function StateMachineWidget() {
  const { slug, markStep } = useLessonProgress();
  return (
    <div className="my-6">
      <StateMachine
        lessonSlug={slug}
        onMilestone={(milestone) => {
          if (milestone === "found-invalid-transition") markStep("see");
        }}
      />
    </div>
  );
}

/** The free-shipping decision table, mapped into the MDX as `<DecisionTable />`. */
export function DecisionTableWidget() {
  const { slug, markStep } = useLessonProgress();
  return (
    <div className="my-6">
      <DecisionTable
        lessonSlug={slug}
        onMilestone={(milestone) => {
          if (milestone === "explored-decision-table") markStep("see");
        }}
      />
    </div>
  );
}

/** The severity x priority triage grid, mapped into the MDX as `<TriageGrid />`. */
export function TriageGridWidget() {
  const { slug, markStep } = useLessonProgress();
  return (
    <div className="my-6">
      <TriageGrid
        lessonSlug={slug}
        onMilestone={(milestone) => {
          if (milestone === "triaged-divergent") markStep("see");
        }}
      />
    </div>
  );
}

/** The equivalence-partition picker, mapped into the MDX as `<PartitionPicker />`. */
export function PartitionPickerWidget() {
  const { slug, markStep } = useLessonProgress();
  return (
    <div className="my-6">
      <PartitionPicker
        lessonSlug={slug}
        onMilestone={(milestone) => {
          if (milestone === "covered-all-partitions") markStep("see");
        }}
      />
    </div>
  );
}
