import { describe, expect, it } from "vitest";
import { simulateTrajectory, summarizeRuns } from "./simulation";

describe("simulation", () => {
  it("caps health within bounds with optimal-only outcomes", () => {
    // Given
    const config = {
      label: "deterministic",
      nChanges: 3,
      startValue: 9,
    };

    // When
    const run = simulateTrajectory(config);

    // Then
    expect(run).toEqual([9, 9, 9, 9]);
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
