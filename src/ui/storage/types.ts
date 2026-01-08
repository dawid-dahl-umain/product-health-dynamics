export type AgentConfig = {
  id: string;
  name: string;
  engineeringRigor: number;
  color: string;
};

export type HandoffConfig = {
  id: string;
  name: string;
  fromAgentId: string;
  toAgentId: string;
  atChange: number;
};

export type Simulation = {
  id: string;
  name: string;
  agents: AgentConfig[];
  handoffs: HandoffConfig[];
  systemComplexity: number;
  complexityDescription?: string;
  nChanges: number;
};

export type GlobalConfig = {
  defaultVisibility: "all" | "averages-only";
  activeSimulationId: string;
};

export type AppData = {
  simulations: Simulation[];
  globalConfig: GlobalConfig;
  version: number;
};
