import { ProductHealthModel } from "./src/model/ProductHealthModel";
import { clamp, gaussianRandom, sigmoid, percentile } from "./src/utils/Math";

const senior = new ProductHealthModel(0.8);

const simulateSeniorWithFloor = (
  floor: number,
  nRuns: number,
  nChanges: number
) => {
  const range = 1 - floor;
  const runs: number[][] = [];

  for (let r = 0; r < nRuns; r++) {
    const history: number[] = [8];
    for (let i = 0; i < nChanges; i++) {
      const currentHealth = history[history.length - 1];
      const mean = senior.computeExpectedImpact(currentHealth);

      // Custom sigma with specified floor
      const systemState = sigmoid(currentHealth - 5, 1.5);
      const bellFactor = 4 * systemState * (1 - systemState);
      const scale = floor + range * bellFactor;
      const effectiveSigma = senior.baseSigma * scale;

      let delta = mean + effectiveSigma * gaussianRandom(Math.random);

      if (delta > 0 && currentHealth > senior.maxHealth) {
        const overshoot = (currentHealth - senior.maxHealth) / senior.maxHealth;
        delta = delta * Math.exp(-5 * overshoot);
      }

      history.push(clamp(currentHealth + delta, 1, 10));
    }
    runs.push(history);
  }

  // Calculate p10, p50, p90 at key points
  const stats: { step: number; p10: number; p50: number; p90: number }[] = [];
  for (const step of [0, 100, 200, 500, 1000]) {
    if (step <= nChanges) {
      const values = runs.map((r) => r[step]);
      stats.push({
        step,
        p10: percentile(values, 10),
        p50: percentile(values, 50),
        p90: percentile(values, 90),
      });
    }
  }
  return stats;
};

console.log("=== Senior Engineer Confidence Bands with Different Floors ===\n");

for (const floor of [0.15, 0.4]) {
  console.log(`\n--- Floor = ${floor} ---`);
  const stats = simulateSeniorWithFloor(floor, 500, 1000);
  console.log("Step\t  p10\t  p50\t  p90\t  Band Width");
  for (const s of stats) {
    const width = s.p90 - s.p10;
    console.log(
      `${s.step}\t  ${s.p10.toFixed(2)}\t  ${s.p50.toFixed(
        2
      )}\t  ${s.p90.toFixed(2)}\t  ${width.toFixed(2)}`
    );
  }
}

console.log("\n=== Interpretation ===");
console.log(
  "Band width = p90 - p10 = how much variance is visible in the shaded area"
);
console.log(
  "We want seniors to have a visible band (not superhuman flat line)"
);
console.log("but not as wide as AI vibe coders.");

