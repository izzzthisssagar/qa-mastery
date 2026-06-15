"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const LIFECYCLE_STEPS = [
  { id: "suite-start", label: "@BeforeSuite", desc: "Runs once before the entire suite starts (e.g. set up DB connection)." },
  { id: "test-start", label: "@BeforeTest", desc: "Runs before any test classes inside a <test> tag execute." },
  { id: "class-start", label: "@BeforeClass", desc: "Runs once before the first method in the current class." },
  { id: "method-1-pre", label: "@BeforeMethod", desc: "Runs before EACH @Test method (e.g. open browser)." },
  { id: "test-1", label: "@Test (1)", desc: "The actual test execution (e.g. verify login)." },
  { id: "method-1-post", label: "@AfterMethod", desc: "Runs after EACH @Test method (e.g. close browser)." },
  { id: "method-2-pre", label: "@BeforeMethod", desc: "Runs before the next @Test method." },
  { id: "test-2", label: "@Test (2)", desc: "The next test execution (e.g. verify logout)." },
  { id: "method-2-post", label: "@AfterMethod", desc: "Runs after the next @Test method." },
  { id: "class-end", label: "@AfterClass", desc: "Runs once after all tests in the current class finish." },
  { id: "test-end", label: "@AfterTest", desc: "Runs after all test classes in the <test> tag." },
  { id: "suite-end", label: "@AfterSuite", desc: "Runs once after the entire suite finishes (e.g. close DB)." },
];

export function LifecycleVisualizer({ onMilestone }: { onMilestone?: (m: string) => void }) {
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);

  const stepForward = () => {
    if (currentStep < LIFECYCLE_STEPS.length - 1) {
      setCurrentStep(s => {
        const next = s + 1;
        if (next === LIFECYCLE_STEPS.length - 1) onMilestone?.("completed-lifecycle");
        return next;
      });
    }
  };

  const reset = () => {
    setCurrentStep(-1);
    setIsPlaying(false);
  };

  const playAll = () => {
    setIsPlaying(true);
    setCurrentStep(0);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step >= LIFECYCLE_STEPS.length) {
        clearInterval(interval);
        setIsPlaying(false);
        onMilestone?.("completed-lifecycle");
      } else {
        setCurrentStep(step);
      }
    }, 1200);
  };

  return (
    <div className="my-8 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-zinc-100">TestNG Execution Lifecycle</h3>
          <p className="text-sm text-zinc-400">Step through to see exactly when each annotation fires.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={reset}
            className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-700"
          >
            Reset
          </button>
          <button
            onClick={stepForward}
            disabled={isPlaying || currentStep >= LIFECYCLE_STEPS.length - 1}
            className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
          >
            Step
          </button>
          <button
            onClick={playAll}
            disabled={isPlaying || currentStep >= LIFECYCLE_STEPS.length - 1}
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-accent/90 disabled:opacity-50 shadow-lg shadow-accent/20"
          >
            Play Animation
          </button>
        </div>
      </div>

      <div className="relative border-l-2 border-zinc-800 ml-4 py-4 pl-6 space-y-4">
        {LIFECYCLE_STEPS.map((step, idx) => {
          const isPast = idx < currentStep;
          const isActive = idx === currentStep;
          const isTest = step.label.includes("@Test");
          
          let colorClass = "text-zinc-600 border-zinc-800";
          let bgClass = "bg-zinc-900/50";
          
          if (isActive) {
            colorClass = isTest ? "text-emerald-400 border-emerald-500" : "text-accent border-accent";
            bgClass = isTest ? "bg-emerald-500/10" : "bg-accent/10";
          } else if (isPast) {
            colorClass = "text-zinc-400 border-zinc-600";
          }

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0.5, x: -10 }}
              animate={{
                opacity: isActive || isPast ? 1 : 0.3,
                x: isActive ? 5 : 0,
                scale: isActive ? 1.02 : 1
              }}
              transition={{ duration: 0.3 }}
              className={`relative rounded-xl border ${colorClass} ${bgClass} p-3 sm:p-4 transition-colors`}
            >
              {/* Timeline dot */}
              <div 
                className={`absolute -left-[31px] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 transition-colors duration-300 ${
                  isActive ? "bg-current border-current" : isPast ? "bg-zinc-600 border-zinc-600" : "bg-zinc-900 border-zinc-800"
                }`}
              />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className={`font-mono text-sm sm:text-base font-semibold ${isActive && isTest ? "text-emerald-400" : ""}`}>
                  {step.label}
                </span>
                <AnimatePresence>
                  {isActive && (
                    <motion.span
                      initial={{ opacity: 0, filter: "blur(4px)" }}
                      animate={{ opacity: 1, filter: "blur(0px)" }}
                      className="text-xs sm:text-sm text-zinc-300"
                    >
                      {step.desc}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
