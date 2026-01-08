import {
  scenarioKeys,
  simulateScenario,
  complexityProfiles,
  complexityProfileKeys,
  type ComplexityProfileKey,
} from "./simulation";

type ParsedArgs = {
  scenario: string;
  runs: number;
  complexity: ComplexityProfileKey;
  nChanges: number;
};

const parseArgs = (): ParsedArgs => {
  const args = process.argv.slice(2);
  const pick = (flag: string, fallback: string) => {
    const index = args.indexOf(flag);
    return index === -1 ? fallback : args[index + 1] ?? fallback;
  };
  const scenario = pick("--scenario", pick("-s", "ai-vibe"));
  const runs = Number(pick("--runs", pick("-r", "1000")));
  const complexity = pick("--complexity", pick("-c", "enterprise"));
  const nChanges = Number(pick("--changes", pick("-n", "1000")));
  return {
    scenario,
    runs: Number.isFinite(runs) && runs > 0 ? runs : 1000,
    complexity: complexityProfileKeys.includes(
      complexity as ComplexityProfileKey
    )
      ? (complexity as ComplexityProfileKey)
      : "enterprise",
    nChanges: Number.isFinite(nChanges) && nChanges > 0 ? nChanges : 1000,
  };
};

const formatHeader = (
  scenario: string,
  runs: number,
  complexity: ComplexityProfileKey,
  nChanges: number
) => {
  const profile = complexityProfiles[complexity];
  return `Running ${scenario} with ${runs} simulations, ${nChanges} changes each...\nSystem Complexity: ${profile.label} (SC=${profile.systemComplexity})`;
};

const formatResults = (stats: ReturnType<typeof simulateScenario>) =>
  [
    `Average final PH: ${stats.averageFinal}`,
    `Average minimum PH: ${stats.averageMin}`,
    `Failure rate (PH ≤ 3): ${stats.failureRate}`,
    `Average trajectory (first 10): ${stats.averageTrajectory
      .slice(0, 10)
      .join(", ")}`,
    `Time metrics:`,
    `  Total time: ${stats.averageTotalTime} (baseline: ${stats.baselineTime})`,
    `  Time per change: ${stats.averageTimePerChange}`,
    `  Time overhead: ${stats.timeOverheadPercent}%`,
  ].join("\n");

const main = () => {
  const { scenario, runs, complexity, nChanges } = parseArgs();
  if (!scenarioKeys.includes(scenario as (typeof scenarioKeys)[number])) {
    console.error(
      `Unknown scenario "${scenario}". Options: ${scenarioKeys.join(", ")}`
    );
    process.exit(1);
  }
  const systemComplexity = complexityProfiles[complexity].systemComplexity;
  const stats = simulateScenario(scenario as (typeof scenarioKeys)[number], {
    nSimulations: runs,
    systemComplexity,
    nChanges,
  });
  console.log(formatHeader(scenario, runs, complexity, nChanges));
  console.log(formatResults(stats));
};

main();
