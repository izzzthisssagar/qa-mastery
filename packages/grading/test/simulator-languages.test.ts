import { describe, expect, it } from "vitest";
import {
  SIMULATOR_LANGUAGES,
  SIMULATOR_LANGUAGE_IDS,
  findSimulatorLanguage,
  isSimulatorLanguage,
  normalizeSource,
} from "../src/simulator-languages";

describe("SIMULATOR_LANGUAGES registry", () => {
  it("ids are unique (they key code_runs.language)", () => {
    expect(new Set(SIMULATOR_LANGUAGE_IDS).size).toBe(SIMULATOR_LANGUAGES.length);
  });

  it("every entry is fully populated for both consumers (UI + runner)", () => {
    for (const l of SIMULATOR_LANGUAGES) {
      expect(l.id).toBeTruthy();
      expect(l.label).toBeTruthy();
      expect(l.monaco).toBeTruthy();
      expect(l.compiler).toBeTruthy();
      expect(l.starter.trim().length).toBeGreaterThan(0);
    }
  });

  it("every starter survives its own normalization non-empty", () => {
    for (const l of SIMULATOR_LANGUAGES) {
      expect(normalizeSource(l.starter, l.normalize).trim().length).toBeGreaterThan(0);
    }
  });
});

describe("findSimulatorLanguage / isSimulatorLanguage", () => {
  it("finds every registered id", () => {
    for (const id of SIMULATOR_LANGUAGE_IDS) {
      expect(findSimulatorLanguage(id)?.id).toBe(id);
      expect(isSimulatorLanguage(id)).toBe(true);
    }
  });

  it("rejects unknown ids (client sends this value — treat as untrusted)", () => {
    expect(findSimulatorLanguage("brainfuck")).toBeUndefined();
    expect(isSimulatorLanguage("")).toBe(false);
    expect(isSimulatorLanguage("JAVA")).toBe(false);
  });
});

describe("normalizeSource (Wandbox compiles the file as prog.java)", () => {
  it("strips `public` from a top-level class so it compiles as prog.java", () => {
    expect(normalizeSource("public class Main {}", "java-strip-public")).toBe("class Main {}");
  });

  it("handles interface, enum and record declarations too", () => {
    expect(normalizeSource("public interface Api {}", "java-strip-public")).toBe(
      "interface Api {}",
    );
    expect(normalizeSource("public enum Status { OK }", "java-strip-public")).toBe(
      "enum Status { OK }",
    );
    expect(normalizeSource("public record Point(int x) {}", "java-strip-public")).toBe(
      "record Point(int x) {}",
    );
  });

  it("strips an indented or mid-file declaration (imports above it)", () => {
    const src = "import java.util.List;\n\npublic class Main {\n}";
    expect(normalizeSource(src, "java-strip-public")).toBe(
      "import java.util.List;\n\nclass Main {\n}",
    );
  });

  it("leaves method modifiers alone — only type declarations lose `public`", () => {
    const src = "public class Main {\n  public static void main(String[] a) {}\n}";
    expect(normalizeSource(src, "java-strip-public")).toBe(
      "class Main {\n  public static void main(String[] a) {}\n}",
    );
  });

  it("normalizes the Java starter to something Wandbox accepts", () => {
    const java = findSimulatorLanguage("java")!;
    const out = normalizeSource(java.starter, java.normalize);
    expect(out).not.toMatch(/public\s+class/);
    expect(out).toContain("class Main");
  });

  it("null kind is the identity for every other language", () => {
    const src = 'print("public class is just a string here")';
    expect(normalizeSource(src, null)).toBe(src);
  });
});
