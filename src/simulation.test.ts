import { describe, expect, it } from "vitest";
import { ProductHealthModel } from "./model/ProductHealthModel";
import {
  simulatePhasedTrajectory,
  simulateTrajectory,
} from "./runner/Trajectory";
import { summarizeRuns } from "./runner/Statistics";

describe("ProductHealthModel", () => {
  describe("maxHealth", () => {
    it("returns low ceiling for low rigor", () => {
      // Given
      const model = new ProductHealthModel(0.1);

      // When
      const maxHealth = model.maxHealth;

      // Then
      expect(maxHealth).toBe(5.5);
    });

    it("returns high ceiling for high rigor", () => {
      // Given
      const model = new ProductHealthModel(0.8);

      // When
      const maxHealth = model.maxHealth;

      // Then
      expect(maxHealth).toBe(9);
    });

    it("returns 10 for perfect rigor", () => {
      // Given
      const model = new ProductHealthModel(1.0);

      // When
      const maxHealth = model.maxHealth;

      // Then
      expect(maxHealth).toBe(10);
    });
  });

  describe("baseImpact", () => {
    it("returns negative for low rigor", () => {
      // Given
      const model = new ProductHealthModel(0.1);

      // When
      const impact = model.baseImpact;

      // Then
      expect(impact).toBeLessThan(0);
    });

    it("returns zero for breakeven rigor (0.5)", () => {
      // Given
      const model = new ProductHealthModel(0.5);

      // When
      const impact = model.baseImpact;

      // Then
      expect(impact).toBe(0);
    });

    it("returns positive for high rigor", () => {
      // Given
      const model = new ProductHealthModel(0.8);

      // When
      const impact = model.baseImpact;

      // Then
      expect(impact).toBeGreaterThan(0);
    });

    it("increases monotonically with rigor", () => {
      // Given
      const lowModel = new ProductHealthModel(0.2);
      const highModel = new ProductHealthModel(0.8);

      // When
      const lowImpact = lowModel.baseImpact;
      const highImpact = highModel.baseImpact;

      // Then
      expect(highImpact).toBeGreaterThan(lowImpact);
    });
  });

  describe("baseSigma", () => {
    it("returns higher sigma for low rigor than high rigor", () => {
      // Given
      const lowRigorModel = new ProductHealthModel(0.1);
      const highRigorModel = new ProductHealthModel(0.8);

      // When
      const lowRigorSigma = lowRigorModel.baseSigma;
      const highRigorSigma = highRigorModel.baseSigma;

      // Then
      expect(lowRigorSigma).toBeGreaterThan(highRigorSigma);
    });

    it("returns non-zero sigma even for perfect rigor", () => {
      // Given
      const model = new ProductHealthModel(1.0);

      // When
      const sigma = model.baseSigma;

      // Then
      expect(sigma).toBeGreaterThan(0);
    });

    it("decreases monotonically with rigor", () => {
      // Given
      const models = [0.2, 0.5, 0.8].map((er) => new ProductHealthModel(er));

      // When
      const sigmas = models.map((m) => m.baseSigma);

      // Then
      expect(sigmas[0]).toBeGreaterThan(sigmas[1]);
      expect(sigmas[1]).toBeGreaterThan(sigmas[2]);
    });
  });

  describe("computeExpectedImpact", () => {
    it("returns near-zero negative impact for low rigor at high health", () => {
      // Given
      const model = new ProductHealthModel(0.1);

      // When
      const impact = model.computeExpectedImpact(8);

      // Then
      expect(impact).toBeCloseTo(0, 1);
    });

    it("returns larger negative impact for low rigor at low health", () => {
      // Given
      const model = new ProductHealthModel(0.1);

      // When
      const impact = model.computeExpectedImpact(2);

      // Then
      expect(impact).toBeLessThan(-0.5);
    });

    it("returns positive impact for high rigor at mid health", () => {
      // Given
      const model = new ProductHealthModel(0.8);

      // When
      const impact = model.computeExpectedImpact(5);

      // Then
      expect(impact).toBeGreaterThan(0);
    });

    it("returns diminishing impact near ceiling", () => {
      // Given
      const model = new ProductHealthModel(0.8);

      // When
      const impactMid = model.computeExpectedImpact(5);
      const impactNearCeiling = model.computeExpectedImpact(8.5);

      // Then
      expect(impactNearCeiling).toBeLessThan(impactMid);
    });
  });

  describe("computeEffectiveSigma", () => {
    it("returns lower sigma at low health (frozen system)", () => {
      // Given
      const model = new ProductHealthModel(0.1);

      // When
      const sigmaLow = model.computeEffectiveSigma(2);
      const sigmaHigh = model.computeEffectiveSigma(8);

      // Then
      expect(sigmaLow).toBeLessThan(sigmaHigh);
    });

    it("returns non-zero sigma even for perfect rigor", () => {
      // Given
      const model = new ProductHealthModel(1.0);

      // When
      const sigma = model.computeEffectiveSigma(9);

      // Then
      expect(sigma).toBeGreaterThan(0);
    });
  });

  describe("sampleNextHealth", () => {
    it("clamps result between 1 and 10", () => {
      // Given
      const model = new ProductHealthModel(0.1);
      const deterministicRng = () => 0.5;

      // When
      const results = Array.from({ length: 100 }, (_, i) =>
        model.sampleNextHealth(5, i, deterministicRng)
      );

      // Then
      results.forEach((health) => {
        expect(health).toBeGreaterThanOrEqual(1);
        expect(health).toBeLessThanOrEqual(10);
      });
    });

    it("produces deterministic results with fixed RNG", () => {
      // Given
      const model1 = new ProductHealthModel(0.5);
      const model2 = new ProductHealthModel(0.5);
      const fixedRng = () => 0.5;

      // When
      const result1 = model1.sampleNextHealth(5, 0, fixedRng);
      const result2 = model2.sampleNextHealth(5, 0, fixedRng);

      // Then
      expect(result1).toBe(result2);
    });

    it("applies soft ceiling when above maxHealth", () => {
      // Given
      const model = new ProductHealthModel(0.8);
      const highRng = () => 0.999;
      const startAboveCeiling = 9.5;

      // When
      const result = model.sampleNextHealth(startAboveCeiling, 0, highRng);

      // Then
      expect(result).toBeLessThanOrEqual(10);
    });
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
    const result = simulateTrajectory(config);

    // Then
    expect(result.healthTrajectory).toHaveLength(11);
    expect(result.healthTrajectory[0]).toBe(8);
    expect(result.timeTrajectory).toHaveLength(11);
    expect(result.totalTime).toBeGreaterThan(0);
  });

  it("clamps health between 1 and 10", () => {
    // Given
    const config = {
      nChanges: 100,
      startValue: 8,
      engineeringRigor: 0.8,
    };

    // When
    const result = simulateTrajectory(config);

    // Then
    result.healthTrajectory.forEach((health) => {
      expect(health).toBeGreaterThanOrEqual(1);
      expect(health).toBeLessThanOrEqual(10);
    });
  });

  it("uses default start value of 8", () => {
    // Given
    const config = {
      nChanges: 5,
      engineeringRigor: 0.5,
    };

    // When
    const result = simulateTrajectory(config);

    // Then
    expect(result.healthTrajectory[0]).toBe(8);
  });

  it("tracks cumulative time across changes", () => {
    // Given
    const config = {
      nChanges: 10,
      startValue: 8,
      engineeringRigor: 0.5,
    };

    // When
    const result = simulateTrajectory(config);

    // Then
    expect(result.timeTrajectory[0]).toBe(0);
    expect(result.timeTrajectory[10]).toBe(result.totalTime);
    for (let i = 1; i < result.timeTrajectory.length; i++) {
      expect(result.timeTrajectory[i]).toBeGreaterThan(
        result.timeTrajectory[i - 1]
      );
    }
  });
});

describe("simulatePhasedTrajectory", () => {
  it("produces trajectory spanning all phases", () => {
    // Given
    const phases = [
      { nChanges: 5, engineeringRigor: 0.1 },
      { nChanges: 10, engineeringRigor: 0.8 },
    ];

    // When
    const result = simulatePhasedTrajectory(phases, 8);

    // Then
    expect(result.healthTrajectory).toHaveLength(16);
    expect(result.healthTrajectory[0]).toBe(8);
    expect(result.totalTime).toBeGreaterThan(0);
  });

  it("transitions between phases continuously", () => {
    // Given
    const phases = [
      { nChanges: 3, engineeringRigor: 0.1 },
      { nChanges: 3, engineeringRigor: 0.8 },
    ];

    // When
    const result = simulatePhasedTrajectory(phases, 8);

    // Then
    expect(result.healthTrajectory).toHaveLength(7);
    result.healthTrajectory.forEach((health) => {
      expect(health).toBeGreaterThanOrEqual(1);
      expect(health).toBeLessThanOrEqual(10);
    });
  });
});

describe("summarizeRuns", () => {
  it("calculates correct statistics for identical runs", () => {
    // Given
    const runs = [
      { healthTrajectory: [8, 7, 6], timeTrajectory: [0, 1, 2], totalTime: 2 },
      { healthTrajectory: [8, 7, 6], timeTrajectory: [0, 1, 2], totalTime: 2 },
    ];

    // When
    const stats = summarizeRuns(runs);

    // Then
    expect(stats.averageFinal).toBe(6);
    expect(stats.averageMin).toBe(6);
    expect(stats.failureRate).toBe(0);
    expect(stats.averageTrajectory).toEqual([8, 7, 6]);
    expect(stats.p10Trajectory).toEqual([8, 7, 6]);
    expect(stats.p90Trajectory).toEqual([8, 7, 6]);
    expect(stats.averageTotalTime).toBe(2);
    expect(stats.baselineTime).toBe(2);
  });

  it("calculates failure rate based on minimum health", () => {
    // Given
    const runs = [
      { healthTrajectory: [8, 5, 6], timeTrajectory: [0, 1, 2], totalTime: 2 },
      { healthTrajectory: [8, 2, 4], timeTrajectory: [0, 1, 2], totalTime: 2 },
    ];

    // When
    const stats = summarizeRuns(runs, 3);

    // Then
    expect(stats.failureRate).toBe(0.5);
  });

  it("calculates percentiles across runs", () => {
    // Given
    const runs = [
      { healthTrajectory: [10, 5], timeTrajectory: [0, 1], totalTime: 1 },
      { healthTrajectory: [10, 10], timeTrajectory: [0, 1], totalTime: 1 },
    ];

    // When
    const stats = summarizeRuns(runs);

    // Then
    expect(stats.averageTrajectory).toEqual([10, 7.5]);
    expect(stats.p10Trajectory[1]).toBeLessThan(stats.p90Trajectory[1]);
  });

  it("calculates time overhead percentage", () => {
    // Given
    const runs = [
      {
        healthTrajectory: [8, 7, 6],
        timeTrajectory: [0, 1.5, 3],
        totalTime: 3,
      },
      {
        healthTrajectory: [8, 7, 6],
        timeTrajectory: [0, 1.5, 3],
        totalTime: 3,
      },
    ];

    // When
    const stats = summarizeRuns(runs);

    // Then
    expect(stats.averageTotalTime).toBe(3);
    expect(stats.baselineTime).toBe(2);
    expect(stats.timeOverheadPercent).toBe(50);
  });
});
