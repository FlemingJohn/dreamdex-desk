import type { ProbabilityPathPoint } from "@/types/analytics";

/**
 * Average probability of the eventual winner across 412 settled BTC 15m windows.
 *
 * The interesting part is the middle: the market drifts toward a view early,
 * pulls back toward even odds around minutes six to eleven, then resolves
 * sharply in the last two. That dip is where an entry is cheapest.
 */
export function getMockProbabilityPath(): ProbabilityPathPoint[] {
  return [
    { minutesFromOpen: 0, averageProbability: 0.5 },
    { minutesFromOpen: 1, averageProbability: 0.53 },
    { minutesFromOpen: 2, averageProbability: 0.57 },
    { minutesFromOpen: 3, averageProbability: 0.61 },
    { minutesFromOpen: 4, averageProbability: 0.64 },
    { minutesFromOpen: 5, averageProbability: 0.66 },
    { minutesFromOpen: 6, averageProbability: 0.63 },
    { minutesFromOpen: 7, averageProbability: 0.6 },
    { minutesFromOpen: 8, averageProbability: 0.59 },
    { minutesFromOpen: 9, averageProbability: 0.61 },
    { minutesFromOpen: 10, averageProbability: 0.65 },
    { minutesFromOpen: 11, averageProbability: 0.7 },
    { minutesFromOpen: 12, averageProbability: 0.78 },
    { minutesFromOpen: 13, averageProbability: 0.87 },
    { minutesFromOpen: 14, averageProbability: 0.94 },
    { minutesFromOpen: 15, averageProbability: 1 },
  ];
}

/** Where the path is at its cheapest — the window worth waiting for. */
export function findCheapestEntryMinute(path: ProbabilityPathPoint[]): number {
  const middleOfWindow = path.filter(
    (point) => point.minutesFromOpen >= 4 && point.minutesFromOpen <= 11
  );
  const cheapest = middleOfWindow.reduce((lowest, point) =>
    point.averageProbability < lowest.averageProbability ? point : lowest
  );
  return cheapest.minutesFromOpen;
}
