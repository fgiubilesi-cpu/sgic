import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  devIndicators: {
    buildActivity: true,
  },
  serverRuntimeConfig: {
    port: 3001,
  },
  experimental: {
    turbo: false, // Disabilita Turbopack
    turbopack: {}, // Configurazione vuota per Turbopack
  },
};

export default nextConfig;
