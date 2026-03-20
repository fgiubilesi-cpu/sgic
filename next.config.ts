import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {};

// Bypass withPWA entirely in development — the wrapper modifies webpack config
// even when disable:true, causing SWC TypeScript loader conflicts with Next.js 16.
export default process.env.NODE_ENV === "production"
  ? withPWA({
      aggressiveFrontEndNavCaching: true,
      cacheOnFrontEndNav: true,
      dest: "public",
      fallbacks: {
        document: "/~offline",
      },
      reloadOnOnline: false,
    })(nextConfig)
  : nextConfig;
