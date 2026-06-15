import { describe, expect, it } from "vitest";
import {
  computeBrainStage,
  guardResponse,
  isNewActiveDay,
  pruneMemoriesByCap,
  updateTopicMasteryOnQuiz,
} from "../src/index";

describe("computeBrainStage", () => {
  it("maps day counts to stages", () => {
    expect(computeBrainStage(1)).toBe("new");
    expect(computeBrainStage(5)).toBe("learning");
    expect(computeBrainStage(15)).toBe("patterns");
    expect(computeBrainStage(40)).toBe("mentor");
  });
});

describe("isNewActiveDay", () => {
  it("returns true when no prior activity", () => {
    expect(isNewActiveDay(null)).toBe(true);
  });

  it("returns false for same UTC day", () => {
    const now = new Date("2026-06-15T12:00:00Z");
    expect(isNewActiveDay("2026-06-15T08:00:00Z", now)).toBe(false);
  });

  it("returns true for previous UTC day", () => {
    const now = new Date("2026-06-15T12:00:00Z");
    expect(isNewActiveDay("2026-06-14T23:00:00Z", now)).toBe(true);
  });
});

describe("updateTopicMasteryOnQuiz", () => {
  it("marks struggling after repeated failures", () => {
    const once = updateTopicMasteryOnQuiz({}, "bva", false);
    expect(once.bva.level).toBe("improving");

    const twice = updateTopicMasteryOnQuiz(once, "bva", false);
    expect(twice.bva.level).toBe("struggling");
    expect(twice.bva.failures).toBe(2);
  });

  it("marks mastered on pass", () => {
    const map = updateTopicMasteryOnQuiz({}, "bva", true);
    expect(map.bva.level).toBe("mastered");
  });
});

describe("pruneMemoriesByCap", () => {
  it("keeps highest importance memories", () => {
    const memories = [
      { id: "a", importance: 3, created_at: "2026-06-01" },
      { id: "b", importance: 9, created_at: "2026-06-02" },
      { id: "c", importance: 7, created_at: "2026-06-03" },
    ];
    const kept = pruneMemoriesByCap(memories, 2);
    expect(kept.map((m) => m.id)).toEqual(["b", "c"]);
  });
});

describe("guardResponse", () => {
  it("blocks manifest leak patterns", () => {
    const out = guardResponse("The bug title_internal is wrong", 2);
    expect(out).toContain("what have you tried");
  });

  it("blocks quiz answers on first turn", () => {
    const out = guardResponse("The correct answer is option B", 1);
    expect(out).toContain("what have you tried");
  });

  it("allows deeper explanation on follow-up turns", () => {
    const text = "Boundary value analysis tests edges of input ranges.";
    expect(guardResponse(text, 2)).toBe(text);
  });
});
