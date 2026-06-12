"use client";

import type { WidgetProps } from "./widget-props";

/**
 * M1 will make this the real interactive BVA widget from Lesson 1: a quantity
 * slider (1–99) where the seeded off-by-one bug only reveals itself at the
 * boundaries. This stub holds the seam so lesson MDX can reference it today.
 */
export default function BoundarySlider({ lessonSlug }: WidgetProps) {
  return (
    <div
      data-testid="widget-boundary-slider"
      className="rounded-xl border border-dashed border-zinc-700 p-6 text-center text-sm text-zinc-400"
    >
      <p className="font-semibold text-zinc-200">Boundary Hunter</p>
      <p className="mt-1">
        Interactive widget coming in M1 (lesson: {lessonSlug}).
      </p>
    </div>
  );
}
