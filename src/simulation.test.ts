import { describe, expect, it } from "vitest";
import { simulateTrajectory, summarizeRuns } from "./simulation";

describe("simulation", () => {
  it("caps health within bounds with optimal-only outcomes", () => {
    // Given
    const config = {
      probabilities: { optimal: 1, neutral: 0, catastrophic: 0 },
      nChanges: 3,
      phStart: 9,
      optimalDelta: 0.5,
    };
    const rng = () => 0;
    // When
    const run = simulateTrajectory(config, rng);
    // Then
    expect(run).toEqual([9, 9.5, 10, 10]);
  });

  it("summarizes runs with averages and failure rate", () => {
    // Given
    const runs = [
      [8, 9, 10],
      [8, 7, 6],
    ];
    // When
    const stats = summarizeRuns(runs);
    // Then
    expect(stats).toEqual({
      averageFinal: 8,
      averageMin: 7,
      failureRate: 0,
      averageTrajectory: [8, 8, 8],
    });
  });
});
