"use client";

import { useState } from "react";

// A simple utility for conditional classes locally
function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

// Simple inline SVG components to replace Lucide icons
const CheckIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12"/></svg>
);
const InfoIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
);
const MousePointerClickIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14 4.1 12 6"/><path d="m5.1 8-2.9-1.2"/><path d="m21.3 13.7-2.6-1.5"/><path d="M3.9 17.2 5 15.3"/><path d="m11.4 21.7 3.5-4.6-2.7-5.2H22l-12 6.8z"/></svg>
);

interface Parameter {
  id: string;
  name: string;
  values: string[];
}

const PARAMETERS: Parameter[] = [
  { id: "browser", name: "Browser", values: ["Chrome", "Firefox", "Safari"] },
  { id: "os", name: "OS", values: ["Windows", "macOS", "Linux"] },
  { id: "db", name: "Database", values: ["PostgreSQL", "MySQL", "MongoDB"] },
  { id: "role", name: "Role", values: ["Admin", "User", "Guest"] },
];

// Rough lookup for 3-value orthogonal arrays:
// 2 params: 9 pairwise, 3 params: 9 pairwise, 4 params: 9 pairwise
// Since all our parameters have exactly 3 values, the math is neat:
// L9(3^4) orthogonal array guarantees all pairs are covered in 9 tests for up to 4 parameters.
const getPairwiseCount = (paramCount: number) => {
  if (paramCount <= 1) return 3;
  if (paramCount <= 4) return 9; // L9(3^4) covers all pairs for up to 4 params of size 3
  return 0;
};

export default function PairwiseVisualizer() {
  const [selectedIds, setSelectedIds] = useState<string[]>(["browser", "os"]);

  const toggleParam = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) && prev.length > 1 ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectedCount = selectedIds.length;
  // Cartesian product: 3^N
  const allCombinations = Math.pow(3, selectedCount);
  const pairwiseCombinations = getPairwiseCount(selectedCount);
  
  const savedPercentage = Math.round(((allCombinations - pairwiseCombinations) / allCombinations) * 100);

  return (
    <div className="my-8 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 bg-zinc-50 px-6 py-4">
        <h3 className="flex items-center gap-2 font-semibold text-zinc-900">
          <MousePointerClickIcon className="h-5 w-5 text-indigo-500" />
          The Combinatorial Explosion
        </h3>
        <p className="mt-1 text-sm text-zinc-600">
          Select parameters below. Notice how "All Combinations" grows exponentially, while "Pairwise" stays manageable.
        </p>
      </div>

      <div className="flex flex-col md:flex-row">
        <div className="flex-1 border-b border-zinc-200 p-6 md:border-b-0 md:border-r">
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Testing Variables (3 values each)
          </h4>
          <div className="space-y-3">
            {PARAMETERS.map((param) => {
              const isSelected = selectedIds.includes(param.id);
              return (
                <button
                  key={param.id}
                  onClick={() => toggleParam(param.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors",
                    isSelected
                      ? "border-indigo-200 bg-indigo-50 ring-1 ring-indigo-500"
                      : "border-zinc-200 bg-white hover:bg-zinc-50"
                  )}
                >
                  <div>
                    <span className={cn("block font-medium", isSelected ? "text-indigo-900" : "text-zinc-900")}>
                      {param.name}
                    </span>
                    <span className="text-xs text-zinc-500">{param.values.join(", ")}</span>
                  </div>
                  <div
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full border",
                      isSelected ? "border-indigo-500 bg-indigo-500 text-white" : "border-zinc-300"
                    )}
                  >
                    {isSelected && <CheckIcon className="h-3 w-3" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center bg-zinc-50 p-6">
          <div className="space-y-8">
            <div>
              <div className="mb-1 text-sm font-medium text-zinc-500">Exhaustive Testing (All Combinations)</div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-red-500">{allCombinations}</span>
                <span className="text-sm text-zinc-500">test cases</span>
              </div>
              <div className="mt-2 text-xs text-zinc-400">
                Formula: 3 {selectedCount > 1 ? Array(selectedCount - 1).fill("× 3").join(" ") : ""} = {allCombinations}
              </div>
            </div>

            <div>
              <div className="mb-1 text-sm font-medium text-zinc-500">Pairwise Testing (All Pairs)</div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-emerald-500">{pairwiseCombinations}</span>
                <span className="text-sm text-zinc-500">test cases</span>
              </div>
              {selectedCount > 2 && (
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
                  <InfoIcon className="h-3.5 w-3.5" />
                  Saves {savedPercentage}% of testing effort!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
