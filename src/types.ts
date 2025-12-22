/** Configuration for a single-agent simulation trajectory. */
export type TrajectoryConfig = {
  /** Number of change events to simulate. */
  nChanges: number;
  /** Starting Product Health (default: 8). */
  startValue?: number;
  /** PH threshold below which a run counts as a "failure" (default: 3). */
  failureThreshold?: number;
  /** The agent's Engineering Rigor (0-1 scale). */
  engineeringRigor: number;
};

/** Configuration for one phase in a multi-phase simulation. */
export type PhaseConfig = Omit<TrajectoryConfig, "failureThreshold">;

/** A single simulation run: array of Product Health values over time. */
export type SimulationRun = number[];

/** Aggregated statistics from multiple simulation runs. */
export type SimulationStats = {
  /** Average final PH across all runs. */
  averageFinal: number;
  /** Average of the minimum PH reached in each run. */
  averageMin: number;
  /** Fraction of runs that dropped below the failure threshold. */
  failureRate: number;
  /** Average PH at each time step (the "expected" trajectory). */
  averageTrajectory: number[];
  /** 10th percentile PH at each step (pessimistic bound). */
  p10Trajectory: number[];
  /** 90th percentile PH at each step (optimistic bound). */
  p90Trajectory: number[];
};

