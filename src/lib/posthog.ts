import posthog from "posthog-js";

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string;
const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST as string) || "https://us.i.posthog.com";

export function initPostHog() {
  if (!POSTHOG_KEY) {
    console.warn("[PostHog] VITE_POSTHOG_KEY not set — analytics disabled");
    return;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: "identified_only",
    capture_pageview: false, // we handle this manually on route change
    capture_pageleave: true,
    autocapture: true,
    loaded: (ph) => {
      console.log("[PostHog] Loaded successfully, distinct_id:", ph.get_distinct_id());
    },
  });
}

export { posthog };
