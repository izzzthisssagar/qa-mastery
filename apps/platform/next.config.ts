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
