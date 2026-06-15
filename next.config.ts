import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
    // КРИТИЧНО: SW активируется сразу, не ждёт закрытия вкладок
    skipWaiting: true,
    clientsClaim: true,
    // Кэшируем HTML-страницы (навигации)
    runtimeCaching: [
      {
        urlPattern: ({ request }) => request.mode === "navigate",
        handler: "NetworkFirst",
        options: {
          cacheName: "pages-cache",
          // Если сеть не ответила за 3 секунды — идём в кэш
          networkTimeoutSeconds: 3,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 дней
          },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
};

export default withPWA(nextConfig);