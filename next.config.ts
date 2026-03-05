import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React compiler for automatic memoization
  reactCompiler: true,

  // ── Webpack Enforcement ─────────────────────────────────────────────────────
  // Next.js 16 defaults to Turbopack for `next dev`.
  // The `--webpack` flag in the dev script (package.json) is the canonical way
  // to force Webpack.  This webpack() callback is then active and can hold any
  // custom Webpack plugins/loaders needed in future.
  //
  // Dev command: "next dev --webpack"  (port injected by launch.json / PORT env)
  webpack(config) {
    return config;
  },

  // ── Server-External Packages ("Next/Headers Leak" Guard) ───────────────────
  // Forces @supabase/ssr to remain in the Node.js bundle and never be shipped
  // to the client.  Any accidental import of this package from a Client
  // Component will cause an immediate build error instead of a silent runtime
  // crash.  This is the primary defence against the "Next/Headers Leak".
  serverExternalPackages: ["@supabase/ssr"],
};

export default nextConfig;
