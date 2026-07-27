#!/usr/bin/env node
// Fails CI on a cycle in the workspace package DAG, a packages/services
// entry depending on an app (layering: only apps depend on packages, never
// the reverse), or `@qa-mastery/config` depending on anything (it must stay
// a leaf everyone else can safely depend on). The package.json
// dependencies/devDependencies *are* the DAG here — no need to walk import
// statements the way real dependency-cruiser does. See docs/superpowers/
// plans/2026-07-26-release-repository-governance.md Task 5.

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const GROUPS = [
  { dir: "packages", kind: "package" },
  { dir: "services", kind: "service" },
  { dir: "apps", kind: "app" },
];

export function readWorkspacePackages() {
  const nodes = new Map(); // name -> { kind, deps: string[] }
  for (const { dir, kind } of GROUPS) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const pkgPath = join(dir, entry.name, "package.json");
      let pkg;
      try {
        pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
      } catch {
        continue;
      }
      const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).filter((d) =>
        d.startsWith("@qa-mastery/"),
      );
      nodes.set(pkg.name, { kind, deps });
    }
  }
  return nodes;
}

export function buildGraph(pkgList) {
  const nodes = new Map();
  for (const { name, kind, deps } of pkgList) nodes.set(name, { kind, deps });
  return nodes;
}

// Returns each cycle found as an array of package names, e.g. ["a", "b", "a"].
export function findCycles(graph) {
  const cycles = [];
  const state = new Map(); // name -> "visiting" | "done"
  const path = [];

  function visit(name) {
    if (!graph.has(name)) return;
    const s = state.get(name);
    if (s === "done") return;
    if (s === "visiting") {
      const start = path.indexOf(name);
      cycles.push([...path.slice(start), name]);
      return;
    }
    state.set(name, "visiting");
    path.push(name);
    for (const dep of graph.get(name).deps) visit(dep);
    path.pop();
    state.set(name, "done");
  }

  for (const name of graph.keys()) visit(name);
  return cycles;
}

// A package/service depending on an app — apps sit at the top of the DAG.
export function findLayeringViolations(graph) {
  const violations = [];
  for (const [name, { kind, deps }] of graph) {
    if (kind === "app") continue;
    for (const dep of deps) {
      if (graph.get(dep)?.kind === "app") violations.push(`${name} -> ${dep}`);
    }
  }
  return violations;
}

// @qa-mastery/config must stay a leaf — everything can depend on it, it
// depends on nothing workspace-local.
export function findConfigViolations(graph) {
  const config = graph.get("@qa-mastery/config");
  return config ? config.deps : [];
}

function main() {
  const graph = buildGraph(
    [...readWorkspacePackages()].map(([name, { kind, deps }]) => ({ name, kind, deps })),
  );

  const cycles = findCycles(graph);
  const layering = findLayeringViolations(graph);
  const configDeps = findConfigViolations(graph);

  if (cycles.length > 0) {
    console.error("Dependency cycle(s) in the workspace package graph:");
    for (const cycle of cycles) console.error(`  ${cycle.join(" -> ")}`);
  }
  if (layering.length > 0) {
    console.error(
      "\nPackage/service depending on an app (apps depend on packages, never the reverse):",
    );
    for (const v of layering) console.error(`  ${v}`);
  }
  if (configDeps.length > 0) {
    console.error("\n@qa-mastery/config must be a leaf with zero workspace dependencies, found:");
    for (const d of configDeps) console.error(`  ${d}`);
  }

  if (cycles.length > 0 || layering.length > 0 || configDeps.length > 0) {
    process.exitCode = 1;
    return;
  }

  console.log(`check-dep-cycles: OK (${graph.size} workspace packages, no cycles)`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
