import { ProductHealthModel } from "./src/model/ProductHealthModel";
import { simulateTrajectory } from "./src/runner/Trajectory";
import { ModelParameters } from "./src/model/Parameters";
import { clamp, gaussianRandom, sigmoid } from "./src/utils/Math";

const aiVibe = new ProductHealthModel(0.1);
const senior = new ProductHealthModel(0.8);

console.log("=== Testing different floor values for bell-curve sigma ===\n");

const testFloors = [0.15, 0.3, 0.4, 0.5];

for (const floor of testFloors) {
  const range = 1 - floor;
  console.log(`\n--- Floor = ${floor}, Range = ${range.toFixed(2)} ---`);

  for (const ph of [8, 5, 2]) {
    const systemState = sigmoid(ph - 5, 1.5);
    const bellFactor = 4 * systemState * (1 - systemState);
    const scale = floor + range * bellFactor;

    const aiSigma = aiVibe.baseSigma * scale;
    const seniorSigma = senior.baseSigma * scale;

    console.log(
      `  PH=${ph}: AI σ=${aiSigma.toFixed(3)}, Senior σ=${seniorSigma.toFixed(
        3
      )}`
    );
  }
}

console.log("\n=== CURRENT MODEL: AI Vibe Coder Analysis ===\n");

console.log("Base properties:");
console.log(`  baseImpact: ${aiVibe.baseImpact.toFixed(3)}`);
console.log(`  baseSigma: ${aiVibe.baseSigma.toFixed(3)}`);
console.log(`  maxHealth: ${aiVibe.maxHealth.toFixed(1)}`);

console.log("\nEffective values at different PH levels:");
for (const ph of [8, 7, 6, 5, 4, 3, 2]) {
  const impact = aiVibe.computeExpectedImpact(ph);
  const sigma = aiVibe.computeEffectiveSigma(ph);
  console.log(
    `  PH=${ph}: impact=${impact.toFixed(4)}, sigma=${sigma.toFixed(
      4
    )}, ratio=${Math.abs(sigma / impact).toFixed(1)}x`
  );
}

// Test alternative: Sigma also protected at high PH
// Idea: Healthy codebases = predictable outcomes (low sigma)
//       Messy codebases = also predictable (frozen, consistently bad)
//       Transition zone = chaotic (high sigma)
console.log(
  "\n=== ALTERNATIVE: Bell-curve sigma (protected at high AND low PH) ==="
);

const computeAltSigma = (baseSigma: number, currentHealth: number) => {
  const systemState = sigmoid(currentHealth - 5, 1.5);
  // Bell curve: peaks at systemState=0.5, low at both extremes
  const bellFactor = 4 * systemState * (1 - systemState); // 0 at edges, 1 at middle
  const scale = 0.15 + 0.85 * bellFactor;
  return baseSigma * scale;
};

console.log("Sigma comparison (current vs bell-curve):");
for (const ph of [8, 7, 6, 5, 4, 3, 2]) {
  const currentSigma = aiVibe.computeEffectiveSigma(ph);
  const altSigma = computeAltSigma(aiVibe.baseSigma, ph);
  console.log(
    `  PH=${ph}: current=${currentSigma.toFixed(
      3
    )}, bell-curve=${altSigma.toFixed(3)}`
  );
}

console.log("\n=== Single Trajectory (first 100 changes) ===");
const singleRun = simulateTrajectory({
  nChanges: 100,
  startValue: 8,
  engineeringRigor: 0.1,
});
console.log(
  "First 20 values:",
  singleRun
    .slice(0, 20)
    .map((v) => v.toFixed(2))
    .join(", ")
);
console.log(
  "Values 20-40:",
  singleRun
    .slice(20, 40)
    .map((v) => v.toFixed(2))
    .join(", ")
);
console.log(
  "Values 40-60:",
  singleRun
    .slice(40, 60)
    .map((v) => v.toFixed(2))
    .join(", ")
);

console.log("\n=== Average of 500 runs (first 50 changes) ===");
const runs: number[][] = [];
for (let i = 0; i < 500; i++) {
  runs.push(
    simulateTrajectory({ nChanges: 50, startValue: 8, engineeringRigor: 0.1 })
  );
}

const avgTrajectory: number[] = [];
for (let step = 0; step <= 50; step++) {
  const values = runs.map((r) => r[step]);
  avgTrajectory.push(values.reduce((a, b) => a + b, 0) / values.length);
}

console.log("Average trajectory:");
for (let i = 0; i <= 50; i += 5) {
  console.log(`  Change ${i}: PH = ${avgTrajectory[i].toFixed(3)}`);
}

console.log("\n=== How fast does it drop? (CURRENT MODEL) ===");
const dropTo7 = avgTrajectory.findIndex((v) => v < 7);
const dropTo6 = avgTrajectory.findIndex((v) => v < 6);
const dropTo5 = avgTrajectory.findIndex((v) => v < 5);
console.log(`  Drops below 7 at change: ${dropTo7}`);
console.log(`  Drops below 6 at change: ${dropTo6}`);
console.log(`  Drops below 5 at change: ${dropTo5}`);

// Simulate with bell-curve sigma
console.log("\n=== ALTERNATIVE: Trajectory with bell-curve sigma ===");

const simulateWithBellSigma = (
  nChanges: number,
  startValue: number,
  er: number
) => {
  const model = new ProductHealthModel(er);
  const history: number[] = [startValue];

  for (let i = 0; i < nChanges; i++) {
    const currentHealth = history[history.length - 1];
    const mean = model.computeExpectedImpact(currentHealth);

    // Bell-curve sigma
    const systemState = sigmoid(currentHealth - 5, 1.5);
    const bellFactor = 4 * systemState * (1 - systemState);
    const sigmaScale = 0.15 + 0.85 * bellFactor;
    const effectiveSigma = model.baseSigma * sigmaScale;

    let delta = mean + effectiveSigma * gaussianRandom(Math.random);

    if (delta > 0 && currentHealth > model.maxHealth) {
      const overshoot = (currentHealth - model.maxHealth) / model.maxHealth;
      delta = delta * Math.exp(-5 * overshoot);
    }

    history.push(clamp(currentHealth + delta, 1, 10));
  }
  return history;
};

const altRuns: number[][] = [];
for (let i = 0; i < 500; i++) {
  altRuns.push(simulateWithBellSigma(100, 8, 0.1));
}

const altAvgTrajectory: number[] = [];
for (let step = 0; step <= 100; step++) {
  const values = altRuns.map((r) => r[step]);
  altAvgTrajectory.push(values.reduce((a, b) => a + b, 0) / values.length);
}

console.log("Bell-curve sigma trajectory:");
for (let i = 0; i <= 100; i += 10) {
  console.log(`  Change ${i}: PH = ${altAvgTrajectory[i].toFixed(3)}`);
}

const altDropTo7 = altAvgTrajectory.findIndex((v) => v < 7);
const altDropTo6 = altAvgTrajectory.findIndex((v) => v < 6);
const altDropTo5 = altAvgTrajectory.findIndex((v) => v < 5);
console.log(`\n  Drops below 7 at change: ${altDropTo7}`);
console.log(`  Drops below 6 at change: ${altDropTo6}`);
console.log(`  Drops below 5 at change: ${altDropTo5}`);

console.log("\n=== COMPARISON ===");
console.log("Current model drops to 5 in ~14 changes");
console.log(`Bell-curve sigma drops to 5 in ~${altDropTo5} changes`);
