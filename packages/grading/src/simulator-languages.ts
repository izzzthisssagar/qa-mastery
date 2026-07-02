/**
 * The five languages the coding simulator supports. Pure data (no Node deps) so
 * it's safe in the client barrel — the standalone simulator UI reads `label` +
 * `monaco` + `starter`, and the server-only WandboxRunner reads `compiler` +
 * `normalize`.
 *
 * Backend note: the plan called for the public Piston API, but Piston went
 * whitelist-only in Feb 2026. We run on Wandbox (wandbox.org) instead — free,
 * keyless, no quota. Wandbox compiles the main file as `prog.EXT`, which trips
 * two languages: Java rejects a top-level `public class`, and C# needs the mono
 * single-file compiler. `normalize` fixes the source transparently so learners
 * still write idiomatic code. Override the endpoint with WANDBOX_URL.
 */

export type NormalizeKind = "java-strip-public" | null;

export interface SimulatorLanguage {
  /** Stable key stored in code_runs.language and sent from the client. */
  id: string;
  label: string;
  /** Monaco editor language id. */
  monaco: string;
  /** Wandbox compiler name (see wandbox.org/api/list.json). */
  compiler: string;
  /** Source transform applied before compiling (Wandbox filename quirks). */
  normalize: NormalizeKind;
  /** A tiny runnable "hello" so the editor is never empty. */
  starter: string;
}

export const SIMULATOR_LANGUAGES: readonly SimulatorLanguage[] = [
  {
    id: "java",
    label: "Java",
    monaco: "java",
    compiler: "openjdk-jdk-21+35",
    normalize: "java-strip-public",
    starter:
      'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, QA!");\n    }\n}\n',
  },
  {
    id: "python",
    label: "Python",
    monaco: "python",
    compiler: "cpython-3.13.8",
    normalize: null,
    starter: 'print("Hello, QA!")\n',
  },
  {
    id: "javascript",
    label: "JavaScript",
    monaco: "javascript",
    compiler: "nodejs-20.17.0",
    normalize: null,
    starter: 'console.log("Hello, QA!");\n',
  },
  {
    id: "typescript",
    label: "TypeScript",
    monaco: "typescript",
    compiler: "typescript-5.6.2",
    normalize: null,
    starter: 'const greet = (name: string): string => `Hello, ${name}!`;\nconsole.log(greet("QA"));\n',
  },
  {
    id: "csharp",
    label: "C#",
    monaco: "csharp",
    compiler: "mono-6.12.0.199",
    normalize: null,
    starter:
      'using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, QA!");\n    }\n}\n',
  },
] as const;

export const SIMULATOR_LANGUAGE_IDS = SIMULATOR_LANGUAGES.map((l) => l.id);

export function findSimulatorLanguage(id: string): SimulatorLanguage | undefined {
  return SIMULATOR_LANGUAGES.find((l) => l.id === id);
}

export function isSimulatorLanguage(id: string): boolean {
  return SIMULATOR_LANGUAGES.some((l) => l.id === id);
}

/** Apply a language's Wandbox source transform. Java: drop `public` from the
 *  top-level class so it survives being compiled as `prog.java`. */
export function normalizeSource(code: string, kind: NormalizeKind): string {
  if (kind === "java-strip-public") {
    return code.replace(/(^|\s)public\s+(class|interface|enum|record)\b/, "$1$2");
  }
  return code;
}
