"use client";

import { useState } from "react";
import type { WidgetProps } from "./widget-props";

/**
 * Order Lifecycle — the "See it" widget for State Transition Testing (A3.5).
 *
 * The learner fires events against an order and watches the state machine. Valid
 * transitions advance the state; an invalid one (e.g. Cancel after Shipped — the
 * same class as BuggyShop's BS-014) is refused and flashes red. Trying an invalid
 * transition fires the `found-invalid-transition` milestone so the lesson can mark
 * the "see" step done.
 */

type State = "Placed" | "Paid" | "Shipped" | "Delivered" | "Cancelled";
type Event = "Pay" | "Ship" | "Deliver" | "Cancel";

const STATES: State[] = ["Placed", "Paid", "Shipped", "Delivered", "Cancelled"];
const EVENTS: Event[] = ["Pay", "Ship", "Deliver", "Cancel"];

// The only valid transitions. Anything not listed here is invalid.
const TRANSITIONS: Partial<Record<State, Partial<Record<Event, State>>>> = {
  Placed: { Pay: "Paid", Cancel: "Cancelled" },
  Paid: { Ship: "Shipped", Cancel: "Cancelled" },
  Shipped: { Deliver: "Delivered" },
};

export default function StateMachine({ onMilestone }: WidgetProps) {
  const [state, setState] = useState<State>("Placed");
  const [rejected, setRejected] = useState<Event | null>(null);
  const [foundInvalid, setFoundInvalid] = useState(false);

  function fire(event: Event) {
    const next = TRANSITIONS[state]?.[event];
    if (next) {
      setState(next);
      setRejected(null);
    } else {
      setRejected(event);
      if (!foundInvalid) {
        setFoundInvalid(true);
        onMilestone?.("found-invalid-transition");
      }
    }
  }

  function reset() {
    setState("Placed");
    setRejected(null);
  }

  return (
    <div
      data-testid="widget-state-machine"
      className="rounded-xl border border-zinc-700 bg-zinc-900/70 p-5"
    >
      <div className="flex flex-wrap items-center gap-2">
        {STATES.map((s) => (
          <span
            key={s}
            data-testid={`state-${s}`}
            className={
              s === state
                ? "rounded-md border border-accent bg-accent/15 px-2.5 py-1 text-sm font-semibold text-zinc-50"
                : "rounded-md border border-zinc-700 px-2.5 py-1 text-sm text-zinc-500"
            }
          >
            {s}
          </span>
        ))}
      </div>

      <p className="mt-3 text-sm text-zinc-400">
        Current state: <span data-testid="current-state" className="font-semibold text-zinc-100">{state}</span>
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {EVENTS.map((e) => (
          <button
            key={e}
            type="button"
            data-testid={`event-${e}`}
            onClick={() => fire(e)}
            className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:border-zinc-500 hover:text-zinc-50"
          >
            {e}
          </button>
        ))}
        <button
          type="button"
          data-testid="event-reset"
          onClick={reset}
          className="rounded-md px-3 py-1.5 text-sm text-zinc-500 hover:text-zinc-300"
        >
          Reset
        </button>
      </div>

      {rejected ? (
        <p
          data-testid="transition-rejected"
          className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200"
        >
          🚫 Invalid transition — you can&apos;t <strong>{rejected}</strong> an order that is{" "}
          <strong>{state}</strong>. A correct system refuses this; a buggy one (like BuggyShop&apos;s
          BS-014) lets it through. This is exactly what state-transition tests catch.
        </p>
      ) : (
        <p data-testid="transition-hint" className="mt-4 text-xs text-zinc-500">
          Walk the happy path (Pay → Ship → Deliver), then try an event that shouldn&apos;t be
          allowed — like Cancel after Shipped.
        </p>
      )}
    </div>
  );
}
