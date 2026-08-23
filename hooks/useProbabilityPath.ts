"use client";

import { useMemo } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import type { ProbabilityPathPoint } from "@/types/analytics";

/** Where in a window the eventual winner has been cheapest. */
function findCheapestMinute(path: ProbabilityPathPoint[]): number | null {
  if (path.length < 3) {
    return null;
  }
  // Ignore the very start and end, where the shape is pinned by construction.
  const middle = path.slice(1, -1);
  if (middle.length === 0) {
    return null;
  }
  return middle.reduce((lowest, point) =>
    point.averageProbability < lowest.averageProbability ? point : lowest
  ).minutesFromOpen;
}

/** How probability typically travels from window open to settlement. */
export function useProbabilityPath() {
  const { probabilityPath, isLoading, error } = useAnalytics();
  const cheapestEntryMinute = useMemo(
    () => findCheapestMinute(probabilityPath),
    [probabilityPath]
  );

  return { path: probabilityPath, isLoading, error, cheapestEntryMinute };
}
