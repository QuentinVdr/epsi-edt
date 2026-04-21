import withPWAInit from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";

const withPWA = withPWAInit({
  dest: "public",

  // Disable in dev to avoid stale-cache confusion while coding
  disable: process.env.NODE_ENV === "development",

  // Cache the app shell aggressively on client-side navigation
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,

  // Reload automatically when connectivity is restored
  reloadOnOnline: true,

  workboxOptions: {
    disableDevLogs: true,

    runtimeCaching: [
      // EDT API — Network First with offline fallback
      // Only cache HTTP 200 so we never serve a cached 401/5xx offline
      {
        urlPattern: /^\/api\/edt(\/.*)?$/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "edt-api",
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          },
          cacheableResponse: {
            statuses: [200],
          },
        },
      },

      // Static assets (fonts, images, icons) — Cache First
      {
        urlPattern: /\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "static-assets",
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  // Silence Turbopack warning caused by next-pwa's webpack injection.
  // PWA is disabled in dev anyway so Turbopack handles dev as normal.
  turbopack: {},
};

export default withPWA(nextConfig);
