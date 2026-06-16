import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const appDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(appDir, "..", "..");

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
  // Lesson pages, quiz grading and the help-agent read lesson MDX/quiz files
  // from packages/curriculum/content at RUNTIME (dynamic fs reads). Next's
  // tracer can't follow a computed path, so without this those files are absent
  // from the serverless bundle and every lesson/quiz/tutor route 500s on Vercel.
  // Trace from the monorepo root and force-include the content + the
  // workspace marker that findContentRoot() walks up to locate.
  outputFileTracingRoot: repoRoot,
  outputFileTracingIncludes: {
    "/**": [
      "../../packages/curriculum/content/**/*",
      "../../pnpm-workspace.yaml",
    ],
  },
  // Baseline security headers (OWASP A05). No script/style CSP — that would risk
  // breaking Supabase/Paddle/fonts and can't be fully verified per-route here;
  // these are the safe, non-breaking set. The platform is never iframed, so it
  // refuses all frame ancestors.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
