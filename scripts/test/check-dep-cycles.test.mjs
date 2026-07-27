import test from "node:test";
import assert from "node:assert/strict";

import {
  buildGraph,
  findConfigViolations,
  findCycles,
  findLayeringViolations,
  readWorkspacePackages,
} from "../check-dep-cycles.mjs";

test("findCycles flags a two-package cycle", () => {
  const graph = buildGraph([
    { name: "a", kind: "package", deps: ["b"] },
    { name: "b", kind: "package", deps: ["a"] },
  ]);
  assert.deepEqual(findCycles(graph), [["a", "b", "a"]]);
});

test("findCycles passes a clean DAG", () => {
  const graph = buildGraph([
    { name: "a", kind: "package", deps: ["b"] },
    { name: "b", kind: "package", deps: [] },
  ]);
  assert.deepEqual(findCycles(graph), []);
});

test("findLayeringViolations flags a package depending on an app", () => {
  const graph = buildGraph([
    { name: "@qa-mastery/lib", kind: "package", deps: ["@qa-mastery/web"] },
    { name: "@qa-mastery/web", kind: "app", deps: [] },
  ]);
  assert.deepEqual(findLayeringViolations(graph), ["@qa-mastery/lib -> @qa-mastery/web"]);
});

test("findConfigViolations flags @qa-mastery/config depending on anything", () => {
  const graph = buildGraph([
    { name: "@qa-mastery/config", kind: "package", deps: ["@qa-mastery/lib"] },
  ]);
  assert.deepEqual(findConfigViolations(graph), ["@qa-mastery/lib"]);
});

test("the real workspace graph has no cycle, layering violation, or config violation today", () => {
  const pkgList = [...readWorkspacePackages()].map(([name, { kind, deps }]) => ({
    name,
    kind,
    deps,
  }));
  assert.ok(pkgList.length > 0);
  const graph = buildGraph(pkgList);
  assert.deepEqual(findCycles(graph), []);
  assert.deepEqual(findLayeringViolations(graph), []);
  assert.deepEqual(findConfigViolations(graph), []);
});
