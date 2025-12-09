import { simulateScenario } from "./simulation";
import type { ScenarioKey } from "./simulation";

const scenario: ScenarioKey = "ai-vibe";
const runs = 200;
const stats = simulateScenario(scenario, { nSimulations: runs });

console.log(`Preview scenario "${scenario}" with ${runs} simulations`);
console.log(`Average final PH: ${stats.averageFinal}`);
console.log(`Average minimum PH: ${stats.averageMin}`);
console.log(`Failure rate (PH ≤ 3): ${stats.failureRate}`);
console.log(
  `Average trajectory (first 10): ${stats.averageTrajectory
    .slice(0, 10)
    .join(", ")}`
);
console.log("Use npm run simulate[:ai|:guardrails|:senior] for detailed runs.");
