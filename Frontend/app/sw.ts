import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkFirst, NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Important: Cloudflare/edge can return a "successful" HTML response with status 5xx.
    // Treat 5xx navigations as failures so the document fallback (/~offline) is used.
    {
      matcher: ({ request, sameOrigin }) => sameOrigin && request.destination === "document",
      handler: new NetworkFirst({
        networkTimeoutSeconds: 8,
        plugins: [
          {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            async fetchDidSucceed({ response }: any) {
              if (response && typeof response.status === "number" && response.status >= 500) {
                throw new Error(`navigation ${response.status}`);
              }
              return response;
            },
          },
          {
            // Always fall back to the offline mask for navigations on ANY failure
            // (offline, DNS errors, 5xx, etc.) so Chrome never shows its own unreachable page.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            async handlerDidError(): Promise<Response | undefined> {
              try {
                return await serwist.matchPrecache("/~offline");
              } catch {
                return undefined;
              }
            },
          },
        ],
      }),
    },
    {
      matcher: ({ sameOrigin, url: { pathname } }) => sameOrigin && pathname.startsWith("/api/"),
      handler: new NetworkOnly(),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
