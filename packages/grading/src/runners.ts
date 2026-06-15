/**
 * Server-only runner implementations. These pull Node built-ins (child_process)
 * and container tooling, so they must NOT be reachable from the client-safe
 * package barrel (`@qa-mastery/grading`) — a single client value-import from the
 * barrel would otherwise drag `node:child_process` into a browser chunk and the
 * build fails. Import these from `@qa-mastery/grading/runners` in server code
 * only. The pure `NullRunner` and the `Run*` types stay in the barrel.
 */
export { Judge0Runner } from "./judge0-runner";
export { PlaywrightRunner } from "./playwright-runner";
export { DockerPlaywrightRunner } from "./docker-runner";
