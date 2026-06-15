import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Internal workspace packages ship TS source; Next transpiles them in-place.
  transpilePackages: [
    "@qa-mastery/agent",
    "@qa-mastery/curriculum",
    "@qa-mastery/db",
    "@qa-mastery/grading",
    "@qa-mastery/shared",
    "@qa-mastery/ui",
    "@qa-mastery/widgets",
  ],
};

export default nextConfig;
