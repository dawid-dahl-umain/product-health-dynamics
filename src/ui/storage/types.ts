export type DeveloperConfig = {
  id: string;
  name: string;
  engineeringRigor: number;
  color: string;
};

export type HandoffConfig = {
  id: string;
  name: string;
  fromDeveloperId: string;
  toDeveloperId: string;
  atChange: number;
};

export type Simulation = {
  id: string;
  name: string;
  developers: DeveloperConfig[];
  handoffs: HandoffConfig[];
  systemComplexity: number;
  complexityDescription?: string;
  nChanges: number;
  startingHealth: number;
};

export type GlobalConfig = {
  defaultVisibility: "all" | "averages-only";
  activeSimulationId: string;
  shapeScaleAnnotationPosition: number;
  shapeScaleAnnotationLabel: string;
};

export type AppData = {
  simulations: Simulation[];
  globalConfig: GlobalConfig;
};
