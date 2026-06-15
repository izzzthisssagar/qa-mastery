"use client";

import React, { useState } from "react";
import {
  BoundarySlider,
  StateMachine,
  DecisionTable,
  TriageGrid,
  PartitionPicker,
  AutomationPyramid,
  WebDriverArchitecture,
  LifecycleVisualizer,
  POMVisualizer,
  SDLCVisualizer,
  JiraBoard,
  ExploratoryTimer,
  TestingTypeSorter,
  PairwiseVisualizer,
} from "@qa-mastery/widgets";
import { useLessonProgress } from "./progress-context";
import { motion, AnimatePresence } from "framer-motion";

function SuccessBadge({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-emerald-500/10 py-3 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-zinc-950">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="font-bold tracking-wide uppercase text-sm">Milestone Unlocked</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function WidgetWrapper({ children, isDone }: { children: React.ReactNode; isDone: boolean }) {
  return (
    <div className="my-6">
      {children}
      <SuccessBadge show={isDone} />
    </div>
  );
}

export function SeeWidget() {
  const { slug, markStep } = useLessonProgress();
  const [done, setDone] = useState(false);
  return (
    <WidgetWrapper isDone={done}>
      <BoundarySlider
        lessonSlug={slug}
        onMilestone={(m) => {
          if (m === "found-boundary-bug") { markStep("see"); setDone(true); }
        }}
      />
    </WidgetWrapper>
  );
}

export function StateMachineWidget() {
  const { slug, markStep } = useLessonProgress();
  const [done, setDone] = useState(false);
  return (
    <WidgetWrapper isDone={done}>
      <StateMachine
        lessonSlug={slug}
        onMilestone={(m) => {
          if (m === "found-invalid-transition") { markStep("see"); setDone(true); }
        }}
      />
    </WidgetWrapper>
  );
}

export function DecisionTableWidget() {
  const { slug, markStep } = useLessonProgress();
  const [done, setDone] = useState(false);
  return (
    <WidgetWrapper isDone={done}>
      <DecisionTable
        lessonSlug={slug}
        onMilestone={(m) => {
          if (m === "explored-decision-table") { markStep("see"); setDone(true); }
        }}
      />
    </WidgetWrapper>
  );
}

export function TriageGridWidget() {
  const { slug, markStep } = useLessonProgress();
  const [done, setDone] = useState(false);
  return (
    <WidgetWrapper isDone={done}>
      <TriageGrid
        lessonSlug={slug}
        onMilestone={(m) => {
          if (m === "triaged-divergent") { markStep("see"); setDone(true); }
        }}
      />
    </WidgetWrapper>
  );
}

export function PartitionPickerWidget() {
  const { slug, markStep } = useLessonProgress();
  const [done, setDone] = useState(false);
  return (
    <WidgetWrapper isDone={done}>
      <PartitionPicker
        lessonSlug={slug}
        onMilestone={(m) => {
          if (m === "covered-all-partitions") { markStep("see"); setDone(true); }
        }}
      />
    </WidgetWrapper>
  );
}

export function AutomationPyramidWidget() {
  const { markStep } = useLessonProgress();
  const [done, setDone] = useState(false);
  return (
    <WidgetWrapper isDone={done}>
      <AutomationPyramid
        onMilestone={(m) => {
          if (m === "toggled-ice-cream" || m === "explored-layers") { markStep("see"); setDone(true); }
        }}
      />
    </WidgetWrapper>
  );
}

export function WebDriverArchitectureWidget() {
  const { markStep } = useLessonProgress();
  const [done, setDone] = useState(false);
  return (
    <WidgetWrapper isDone={done}>
      <WebDriverArchitecture
        onMilestone={(m) => {
          if (m === "completed-flow") { markStep("see"); setDone(true); }
        }}
      />
    </WidgetWrapper>
  );
}

export function LifecycleVisualizerWidget() {
  const { markStep } = useLessonProgress();
  const [done, setDone] = useState(false);
  return (
    <WidgetWrapper isDone={done}>
      <LifecycleVisualizer
        onMilestone={(m) => {
          if (m === "completed-lifecycle") { markStep("see"); setDone(true); }
        }}
      />
    </WidgetWrapper>
  );
}

export function POMVisualizerWidget() {
  const { markStep } = useLessonProgress();
  const [done, setDone] = useState(false);
  return (
    <WidgetWrapper isDone={done}>
      <POMVisualizer
        onMilestone={(m) => {
          if (m === "completed-pom-flow") { markStep("see"); setDone(true); }
        }}
      />
    </WidgetWrapper>
  );
}

export function SDLCVisualizerWidget() {
  const { markStep } = useLessonProgress();
  const [done, setDone] = useState(false);
  return (
    <WidgetWrapper isDone={done}>
      <SDLCVisualizer
        onMilestone={(m) => {
          if (m === "viewed-production-cost") { markStep("see"); setDone(true); }
        }}
      />
    </WidgetWrapper>
  );
}

export function JiraBoardWidget() {
  const { markStep } = useLessonProgress();
  const [done, setDone] = useState(false);
  return (
    <WidgetWrapper isDone={done}>
      <JiraBoard
        onMilestone={(m) => {
          if (m === "completed-ticket") { markStep("see"); setDone(true); }
        }}
      />
    </WidgetWrapper>
  );
}

export function ExploratoryTimerWidget() {
  const { markStep } = useLessonProgress();
  const [done, setDone] = useState(false);
  return (
    <WidgetWrapper isDone={done}>
      <ExploratoryTimer
        onMilestone={(m) => {
          if (m === "completed-session") { markStep("see"); setDone(true); }
        }}
      />
    </WidgetWrapper>
  );
}

export function TestingTypeSorterWidget() {
  const { markStep } = useLessonProgress();
  const [done, setDone] = useState(false);
  return (
    <WidgetWrapper isDone={done}>
      <TestingTypeSorter
        onMilestone={(m) => {
          if (m === "sorted-all-types") { markStep("see"); setDone(true); }
        }}
      />
    </WidgetWrapper>
  );
}

// PairwiseVisualizer is self-contained (no milestone callback), so it just
// renders inside the standard wrapper.
export function PairwiseVisualizerWidget() {
  return (
    <WidgetWrapper isDone={false}>
      <PairwiseVisualizer />
    </WidgetWrapper>
  );
}
