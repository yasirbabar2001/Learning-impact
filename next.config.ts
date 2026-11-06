import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Self-contained server bundle (.next/standalone) for cPanel "Setup Node.js App" hosting.
  output: "standalone",
  // No next/image usage, so skip the sharp image optimiser and keep the upload small.
  images: { unoptimized: true },
  // Read at runtime with fs, so they must be copied into the standalone server bundle.
  outputFileTracingIncludes: { "/**": ["./content/courses/*.json", "./assets/fonts/*"] },
  outputFileTracingExcludes: { "*": ["node_modules/@img/**", "node_modules/sharp/**", "node_modules/.pnpm/@img+*/**", "node_modules/.pnpm/sharp@*/**"] },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [{ source: "/:path*", has: [{ type: "host", value: "www.learningimpact.pk" }], destination: "https://learningimpact.pk/:path*", permanent: true }];
  },
};

export default nextConfig;
