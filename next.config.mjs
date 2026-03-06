import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  publicExcludes: ['!api/**/*']
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  // We don't need the 'turbo' key here because we force webpack via package.json
  webpack: (config) => {
    return config;
  }
};

export default withPWA(nextConfig);