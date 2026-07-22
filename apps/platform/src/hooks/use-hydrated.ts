"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

function getSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

/**
 * True once the client has hydrated, false during SSR and the brief window
 * before React attaches. Interactive-on-mount controls whose handlers read
 * React state must disable/buffer on this — a pre-hydration click or
 * keystroke lands in the DOM but never reaches `useState`, so it's silently
 * lost when hydration then resets the controlled value. See
 * docs/known-issues/webkit-save-stall.md.
 *
 * Built on `useSyncExternalStore` (server snapshot `false`, client snapshot
 * `true`) rather than a `useEffect` + `setState` pair, which triggers the
 * cascading-render lint rule and re-renders one tick later than necessary.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
