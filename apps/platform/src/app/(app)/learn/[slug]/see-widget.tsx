"use client";

import { BoundarySlider, StateMachine } from "@qa-mastery/widgets";
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
