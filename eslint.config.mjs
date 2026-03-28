import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next-stale-route-fix/**",
    ".next-stale-route-fix-2/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/fallback-*.js",
    "public/swe-worker-*.js",
    "public/workbox-*.js",
    "public/sw.js",
    ".claude/worktrees/**",
    ".codex-trash/**",
    "supabase/.temp/**",
  ]),
]);

export default eslintConfig;
