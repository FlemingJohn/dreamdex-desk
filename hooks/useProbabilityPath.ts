"use client";

import { useMemo } from "react";
import { findCheapestEntryMinute, getMockProbabilityPath } from "@/lib/mock/mockProbabilityPath";

/** How probability typically travels from window open to settlement. */
export function useProbabilityPath() {
  const path = useMemo(() => getMockProbabilityPath(), []);
  const cheapestEntryMinute = useMemo(() => findCheapestEntryMinute(path), [path]);

  return { path, isLoading: false, cheapestEntryMinute };
}
