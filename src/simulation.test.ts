import { describe, expect, it } from "vitest";
import { simulateTrajectory, summarizeRuns } from "./simulation";
import { core } from "./simulation/core";

describe("deriveMaxHealth", () => {
  it("returns low ceiling for low rigor", () => {
    // Given
    const lowRigor = 0.1;

    // When
    const maxHealth = core.deriveMaxHealth(lowRigor);

    // Then
    expect(maxHealth).toBe(5.5);
  });

  it("returns high ceiling for high rigor", () => {
    // Given
    const highRigor = 0.8;

    // When
    const maxHealth = core.deriveMaxHealth(highRigor);

    // Then
    expect(maxHealth).toBe(9);
  });
});

describe("deriveExpectedImpact", () => {
  it("returns near-zero negative impact for low rigor at high health", () => {
    // Given
    const lowRigor = 0.1;
    const highHealth = 8;
    const maxHealth = core.deriveMaxHealth(lowRigor);

    // When
    const impact = core.deriveExpectedImpact(lowRigor, highHealth, maxHealth);

    // Then
    expect(impact).toBeCloseTo(0, 1);
  });

  it("returns larger negative impact for low rigor at low health", () => {
    // Given
    const lowRigor = 0.1;
    const lowHealth = 2;
    const maxHealth = core.deriveMaxHealth(lowRigor);

    // When
    const impact = core.deriveExpectedImpact(lowRigor, lowHealth, maxHealth);

    // Then
    expect(impact).toBeLessThan(-0.1);
  });

  it("returns positive impact for high rigor with ceiling factor", () => {
    // Given
    const highRigor = 0.8;
    const midHealth = 5;
    const maxHealth = core.deriveMaxHealth(highRigor);

    // When
    const impact = core.deriveExpectedImpact(highRigor, midHealth, maxHealth);

    // Then
    expect(impact).toBeGreaterThan(0);
    expect(impact).toBeLessThan(0.12);
  });
});

describe("deriveOutcomeVariance", () => {
  const constants = { sigmaMax: 0.5, sigmaMin: 0.05 };

  it("returns lower variance for low rigor at high health", () => {
    // Given
    const lowRigor = 0.1;
    const highHealth = 8;

    // When
    const variance = core.deriveOutcomeVariance(
      lowRigor,
      highHealth,
      constants
    );

    // Then
    expect(variance).toBeLessThan(0.5);
  });

  it("returns higher variance for low rigor at low health", () => {
    // Given
    const lowRigor = 0.1;
    const lowHealth = 2;

    // When
    const variance = core.deriveOutcomeVariance(lowRigor, lowHealth, constants);

    // Then
    expect(variance).toBeGreaterThan(0.4);
  });

  it("returns non-zero variance even for perfect rigor", () => {
    // Given
    const perfectRigor = 1.0;
    const highHealth = 9;

    // When
    const variance = core.deriveOutcomeVariance(
      perfectRigor,
      highHealth,
      constants
    );

    // Then
    expect(variance).toBeGreaterThan(0);
  });
});

describe("simulateTrajectory", () => {
  it("produces trajectory with correct length", () => {
    // Given
    const config = {
      nChanges: 10,
      startValue: 8,
      engineeringRigor: 0.5,
    };

    // When
    const trajectory = simulateTrajectory(config);

    // Then
    expect(trajectory).toHaveLength(11);
    expect(trajectory[0]).toBe(8);
  });

  it("clamps health between 1 and maxHealth", () => {
    // Given
    const config = {
      nChanges: 100,
      startValue: 8,
      engineeringRigor: 0.8,
    };
    const maxHealth = core.deriveMaxHealth(config.engineeringRigor);

    // When
    const trajectory = simulateTrajectory(config);

    // Then
    trajectory.forEach((health) => {
      expect(health).toBeGreaterThanOrEqual(1);
      expect(health).toBeLessThanOrEqual(maxHealth);
    });
  });
});

describe("summarizeRuns", () => {
  it("calculates correct statistics for identical runs", () => {
    // Given
    const runs = [
      [8, 7, 6],
      [8, 7, 6],
    ];

    // When
    const stats = summarizeRuns(runs);

    // Then
    expect(stats).toEqual({
      averageFinal: 6,
      averageMin: 6,
      failureRate: 0,
      averageTrajectory: [8, 7, 6],
    });
  });

  it("calculates failure rate based on minimum health", () => {
    // Given
    const runs = [
      [8, 5, 6],
      [8, 2, 4],
    ];

    // When
    const stats = summarizeRuns(runs, 3);

    // Then
    expect(stats.failureRate).toBe(0.5);
  });
});
