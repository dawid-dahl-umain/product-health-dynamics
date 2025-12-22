import { describe, expect, it } from "vitest";
import { average, clamp, minimum, percentile, sigmoid } from "./Math";

describe("clamp", () => {
  it("returns value when within bounds", () => {
    // Given
    const value = 5;

    // When
    const result = clamp(value, 1, 10);

    // Then
    expect(result).toBe(5);
  });

  it("returns min when value is below", () => {
    // Given
    const value = -5;

    // When
    const result = clamp(value, 1, 10);

    // Then
    expect(result).toBe(1);
  });

  it("returns max when value is above", () => {
    // Given
    const value = 15;

    // When
    const result = clamp(value, 1, 10);

    // Then
    expect(result).toBe(10);
  });
});

describe("average", () => {
  it("calculates mean of values", () => {
    // Given
    const values = [2, 4, 6, 8];

    // When
    const result = average(values);

    // Then
    expect(result).toBe(5);
  });
});

describe("minimum", () => {
  it("returns smallest value", () => {
    // Given
    const values = [5, 2, 8, 1, 9];

    // When
    const result = minimum(values);

    // Then
    expect(result).toBe(1);
  });
});

describe("percentile", () => {
  it("returns exact value at percentile boundary", () => {
    // Given
    const values = [1, 2, 3, 4, 5];

    // When
    const p50 = percentile(values, 50);

    // Then
    expect(p50).toBe(3);
  });

  it("interpolates between values", () => {
    // Given
    const values = [0, 10];

    // When
    const p25 = percentile(values, 25);

    // Then
    expect(p25).toBe(2.5);
  });

  it("returns min at p0", () => {
    // Given
    const values = [5, 10, 15];

    // When
    const p0 = percentile(values, 0);

    // Then
    expect(p0).toBe(5);
  });

  it("returns max at p100", () => {
    // Given
    const values = [5, 10, 15];

    // When
    const p100 = percentile(values, 100);

    // Then
    expect(p100).toBe(15);
  });
});

describe("sigmoid", () => {
  it("returns 0.5 at x=0", () => {
    // Given
    const x = 0;
    const steepness = 1;

    // When
    const result = sigmoid(x, steepness);

    // Then
    expect(result).toBe(0.5);
  });

  it("approaches 1 for large positive x", () => {
    // Given
    const x = 10;
    const steepness = 1;

    // When
    const result = sigmoid(x, steepness);

    // Then
    expect(result).toBeGreaterThan(0.99);
  });

  it("approaches 0 for large negative x", () => {
    // Given
    const x = -10;
    const steepness = 1;

    // When
    const result = sigmoid(x, steepness);

    // Then
    expect(result).toBeLessThan(0.01);
  });

  it("steeper curve with higher steepness", () => {
    // Given
    const x = 1;

    // When
    const gentle = sigmoid(x, 0.5);
    const steep = sigmoid(x, 2);

    // Then
    expect(steep).toBeGreaterThan(gentle);
  });
});
