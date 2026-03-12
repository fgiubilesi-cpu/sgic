import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {};

export default withPWA({
  aggressiveFrontEndNavCaching: true,
  cacheOnFrontEndNav: true,
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  fallbacks: {
    document: "/~offline",
  },
  reloadOnOnline: false,
})(nextConfig);
