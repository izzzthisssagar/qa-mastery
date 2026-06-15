import type { NextConfig } from "next";

// The platform embeds BuggyShop in an iframe; CSP frame-ancestors is the
// modern replacement for X-Frame-Options and must allow the platform origin.
const PLATFORM_URL = process.env.NEXT_PUBLIC_PLATFORM_URL ?? "http://localhost:3000";

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ["@qa-mastery/db", "@qa-mastery/shared", "@qa-mastery/ui"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // BuggyShop is iframe-embedded by the platform, so it allows that one
          // origin as a frame ancestor (rather than X-Frame-Options: DENY).
          {
            key: "Content-Security-Policy",
            value: `frame-ancestors 'self' ${PLATFORM_URL}`,
          },
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
