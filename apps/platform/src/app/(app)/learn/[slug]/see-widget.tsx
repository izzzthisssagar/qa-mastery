"use client";

import { BoundarySlider } from "@qa-mastery/widgets";
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
