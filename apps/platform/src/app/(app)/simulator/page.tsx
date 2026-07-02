import { SimulatorClient } from "./simulator-client";

export const metadata = {
  title: "Coding simulator · QA Mastery",
};

/**
 * Standalone coding simulator: write and run snippets in Java, Python,
 * JavaScript, TypeScript or C# against the free Piston sandbox. No lesson, no
 * grading — a scratchpad for practising automation logic. Auth is gated by
 * (app)/layout.tsx; runs are rate-limited server-side.
 */
export default function SimulatorPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-xs font-medium uppercase tracking-widest text-accent">Practice</p>
      <h1 className="mt-1 text-2xl font-semibold text-foreground">Coding simulator</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Prototype automation logic in five languages and run it instantly. Powered by the free
        Piston sandbox — one run every few seconds. Pick a language, edit, and hit Run.
      </p>

      <div className="mt-6">
        <SimulatorClient />
      </div>
    </main>
  );
}
