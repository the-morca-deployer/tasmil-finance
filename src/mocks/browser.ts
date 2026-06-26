/**
 * MSW browser worker setup.
 * Only initializes when NEXT_PUBLIC_MOCK_API=true.
 */
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

export async function startMockServiceWorker() {
  if (process.env.NEXT_PUBLIC_MOCK_API !== "true") return;
  try {
    await worker.start({
      onUnhandledRequest: "bypass",
      serviceWorker: {
        url: "/mockServiceWorker.js",
      },
    });
    console.warn("[msw] Mock service worker started — API calls will be intercepted");
  } catch (e) {
    console.error("[msw] Failed to start mock service worker:", e);
  }
}
