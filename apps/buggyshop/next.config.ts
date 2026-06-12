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
          {
            key: "Content-Security-Policy",
            value: `frame-ancestors 'self' ${PLATFORM_URL}`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
