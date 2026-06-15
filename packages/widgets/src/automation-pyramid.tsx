"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const PYRAMID_LAYERS = [
  {
    id: "e2e",
    title: "E2E (UI)",
    desc: "Few, slow, whole-stack. Touches network, browser, and DB. Reserved for critical journeys.",
    speed: "~20 seconds",
    cost: "High",
    flakiness: "High",
    color: "bg-rose-500/20 text-rose-300 border-rose-500/50",
    gradient: "from-rose-500/20 to-rose-900/10",
  },
  {
    id: "integration",
    title: "Integration",
    desc: "Some, medium speed. Checks that pieces work together (e.g. function + database).",
    speed: "~500 ms",
    cost: "Medium",
    flakiness: "Medium",
    color: "bg-amber-500/20 text-amber-300 border-amber-500/50",
    gradient: "from-amber-500/20 to-amber-900/10",
  },
  {
    id: "unit",
    title: "Unit",
    desc: "Many, fast, one function. Thousands run in seconds. Points failure at a single place.",
    speed: "~2 ms",
    cost: "Low",
    flakiness: "Low",
    color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/50",
    gradient: "from-emerald-500/20 to-emerald-900/10",
  },
];

export function AutomationPyramid({ onMilestone }: { onMilestone?: (m: string) => void }) {
  const [activeLayer, setActiveLayer] = useState<string>("e2e");
  const [isIceCream, setIsIceCream] = useState(false);

  const toggleIceCream = () => {
    setIsIceCream(!isIceCream);
    onMilestone?.("toggled-ice-cream");
  };

  const handleLayerClick = (id: string) => {
    setActiveLayer(id);
    onMilestone?.("explored-layers");
  };

  const activeData = PYRAMID_LAYERS.find((l) => l.id === activeLayer);

  // In standard mode, the triangle points up (clip-path). Widths decrease going up.
  // In ice-cream mode, it's flipped.
  const layers = isIceCream ? [...PYRAMID_LAYERS].reverse() : PYRAMID_LAYERS;

  return (
    <div className="my-8 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 md:p-8 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-semibold text-zinc-100">Automation Strategy</h3>
          <p className="text-sm text-zinc-400">Click a layer to explore the trade-offs.</p>
          <p className="text-xs text-amber-500/80 mt-1 block md:hidden">📱 Rotate your device for the best view.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-zinc-400">Ice Cream Cone Mode</span>
          <button
            type="button"
            onClick={toggleIceCream}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isIceCream ? "bg-rose-500" : "bg-zinc-700"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isIceCream ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2 items-center">
        {/* Visual Pyramid */}
        <div className="flex flex-col items-center justify-center space-y-2 py-4">
          <AnimatePresence mode="popLayout">
            {layers.map((layer, idx) => {
              // Calculate width based on position
              // Pyramid (isIceCream=false): 100%, 75%, 45% (bottom to top)
              // Since layers array maps E2E, Integration, Unit (top to bottom):
              // E2E = 45%, Int = 75%, Unit = 100%
              // If IceCream, we reverse the visual size: E2E = 100%, Int = 75%, Unit = 45%
              
              let width = "100%";
              if (layer.id === "e2e") width = isIceCream ? "100%" : "45%";
              if (layer.id === "integration") width = "75%";
              if (layer.id === "unit") width = isIceCream ? "45%" : "100%";

              const isActive = activeLayer === layer.id;

              return (
                <motion.button
                  key={layer.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: isActive ? 1.05 : 1, width }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
                  onClick={() => handleLayerClick(layer.id)}
                  className={`
                    relative flex items-center justify-center h-20 w-full overflow-hidden
                    rounded-lg border-2 transition-all duration-300
                    ${isActive ? layer.color : "border-zinc-800 bg-zinc-800/40 text-zinc-500 hover:border-zinc-700"}
                  `}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${layer.gradient} opacity-50`} />
                  <span className="relative z-10 font-semibold tracking-wide uppercase text-sm">
                    {layer.title}
                  </span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Details Panel */}
        <div className="h-full">
          <AnimatePresence mode="wait">
            {activeData && (
              <motion.div
                key={activeData.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col h-full justify-center space-y-6 rounded-xl border border-zinc-800 bg-zinc-950 p-6"
              >
                <div>
                  <h4 className={`text-xl font-bold mb-2 ${activeData.color.split(' ')[1]}`}>
                    {activeData.title}
                  </h4>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {activeData.desc}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-600 font-semibold">Speed</span>
                    <span className="text-sm font-medium text-zinc-200">{activeData.speed}</span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-600 font-semibold">Cost</span>
                    <span className="text-sm font-medium text-zinc-200">{activeData.cost}</span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-600 font-semibold">Flakiness</span>
                    <span className="text-sm font-medium text-zinc-200">{activeData.flakiness}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
