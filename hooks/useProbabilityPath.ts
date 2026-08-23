"use client";

import { useEffect, useState } from "react";
import { findCheapestEntryMinute, getMockProbabilityPath } from "@/lib/mock/mockProbabilityPath";
import type { ProbabilityPathPoint } from "@/types/analytics";

/** How probability typically travels from window open to settlement. */
export function useProbabilityPath() {
  const [path, setPath] = useState<ProbabilityPathPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setPath(getMockProbabilityPath());
    setIsLoading(false);
  }, []);

  return {
    path,
    isLoading,
    cheapestEntryMinute: path.length > 0 ? findCheapestEntryMinute(path) : null,
  };
}
