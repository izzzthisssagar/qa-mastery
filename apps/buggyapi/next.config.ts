import type { NextConfig } from "next";

// The platform may embed BuggyAPI docs in an iframe (like BuggyShop labs);
// CSP frame-ancestors allows that one origin.
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
