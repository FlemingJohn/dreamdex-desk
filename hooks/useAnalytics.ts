"use client";

import { useSyncExternalStore } from "react";
import {
  readAnalyticsSnapshot,
  readServerAnalyticsSnapshot,
  subscribeToAnalytics,
} from "@/lib/analyticsStore";

/** Everything computed from settled history. One shared read behind it. */
export function useAnalytics() {
  return useSyncExternalStore(
    subscribeToAnalytics,
    readAnalyticsSnapshot,
    readServerAnalyticsSnapshot
  );
}
