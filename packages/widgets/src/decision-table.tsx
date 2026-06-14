"use client";

import { useState } from "react";
import type { WidgetProps } from "./widget-props";

/**
 * Decision-table builder — the "See it" widget for Decision Tables (A3.4).
 *
 * A free-shipping rule depends on three conditions. The learner flips them and
 * watches the resulting action, while the full rule table shows every
 * combination. Producing both a qualifying and a non-qualifying outcome fires
 * the `explored-decision-table` milestone so the lesson can mark "see".
 *
 * Rule: free shipping only when the cart is over $999 AND the user is a member
 * AND a valid promo code is applied — all three.
 */

const CONDITIONS = ["Cart over $999", "Member", "Promo code"] as const;

function freeShipping(c1: boolean, c2: boolean, c3: boolean): boolean {
  return c1 && c2 && c3;
}

// All eight condition combinations, for the full rule table.
const COMBOS: [boolean, boolean, boolean][] = [];
for (const a of [true, false])
  for (const b of [true, false]) for (const c of [true, false]) COMBOS.push([a, b, c]);

const tick = (v: boolean) => (v ? "T" : "F");

export default function DecisionTable({ onMilestone }: WidgetProps) {
  const [vals, setVals] = useState<[boolean, boolean, boolean]>([false, false, false]);
  const [sawYes, setSawYes] = useState(false);
  const [sawNo, setSawNo] = useState(false);
  const [fired, setFired] = useState(false);

  const action = freeShipping(vals[0], vals[1], vals[2]);

  function toggle(i: number) {
    const next = [...vals] as [boolean, boolean, boolean];
    next[i] = !next[i];
    setVals(next);

    const result = freeShipping(next[0], next[1], next[2]);
    const yes = result || sawYes;
    const no = !result || sawNo;
    setSawYes(yes);
    setSawNo(no);
    if (yes && no && !fired) {
      setFired(true);
      onMilestone?.("explored-decision-table");
    }
  }

  const currentKey = vals.map(tick).join("");

  return (
    <div
      data-testid="widget-decision-table"
      className="rounded-xl border border-zinc-700 bg-zinc-900/70 p-5"
    >
      <p className="text-sm font-semibold text-zinc-100">Free-shipping rule</p>
      <p className="mt-1 text-xs text-zinc-500">
        Toggle the conditions and watch the action. Free shipping = Cart over $999 AND Member AND
        Promo.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {CONDITIONS.map((label, i) => (
          <button
            key={label}
            type="button"
            data-testid={`cond-${i}`}
            aria-pressed={vals[i]}
            onClick={() => toggle(i)}
            className={
              vals[i]
                ? "rounded-md border border-accent bg-accent/15 px-3 py-1.5 text-sm font-medium text-zinc-50"
                : "rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:border-zinc-500"
            }
          >
            {label}: {vals[i] ? "Yes" : "No"}
          </button>
        ))}
      </div>

      <p className="mt-4 text-sm">
        Action:{" "}
        <span
          data-testid="dt-action"
          className={action ? "font-semibold text-emerald-400" : "font-semibold text-zinc-300"}
        >
          {action ? "Free shipping" : "Standard shipping"}
        </span>
      </p>

      <table className="mt-4 w-full border-collapse text-left text-xs">
        <thead>
          <tr className="text-zinc-500">
            <th className="py-1 pr-3 font-medium">Cart&gt;$999</th>
            <th className="py-1 pr-3 font-medium">Member</th>
            <th className="py-1 pr-3 font-medium">Promo</th>
            <th className="py-1 font-medium">Free?</th>
          </tr>
        </thead>
        <tbody>
          {COMBOS.map((combo) => {
            const key = combo.map(tick).join("");
            const free = freeShipping(combo[0], combo[1], combo[2]);
            const isCurrent = key === currentKey;
            return (
              <tr
                key={key}
                data-testid={`dt-row-${key}`}
                className={isCurrent ? "bg-accent/10 text-zinc-100" : "text-zinc-500"}
              >
                <td className="py-1 pr-3">{tick(combo[0])}</td>
                <td className="py-1 pr-3">{tick(combo[1])}</td>
                <td className="py-1 pr-3">{tick(combo[2])}</td>
                <td className={free ? "py-1 text-emerald-400" : "py-1"}>{free ? "Yes" : "No"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {fired && (
        <p data-testid="dt-explored" className="mt-3 text-xs text-emerald-300">
          That&apos;s the whole point of a decision table — one row per combination, no rule
          forgotten. Two conditions hide four cases; three hide eight.
        </p>
      )}
    </div>
  );
}
