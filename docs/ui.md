# Product Health Dynamics: Web Interface

Interactive visualization for exploring Product Health trajectories under different conditions.

## Getting Started

```bash
npm install
npm run dev
# Open http://localhost:5173
```

## Features

### Simulation Tabs

Each tab is a complete, self-contained simulation with its own settings and agents. Click a tab to switch; double-click to rename.

- **Add Tab (+)**: Create a new blank simulation (auto-opens settings)
- **Close Tab (×)**: Remove a simulation (requires at least one remaining)

### Settings Panel

Toggle with the **Settings** button in the header.

#### Top Row

| Control    | Description                                           |
| ---------- | ----------------------------------------------------- |
| Complexity | Slider (0.1-2.0) for system complexity                |
| Changes    | Dropdown to select number of change events (250-2000) |
| Duplicate  | Create a copy of the current simulation               |
| Export     | Download the simulation as JSON                       |

**Complexity guide:**

- 0.1-0.3: Simple (blog, landing page)
- 0.3-0.6: Moderate (CRUD backend, auth)
- 0.6-1.0: Complex (enterprise, integrations)
- 1.0+: Very complex (legacy, high coupling)

#### Agents Section

Each agent card displays:

- **Color picker**: Click to change the line color
- **Name input**: Edit the agent's display name
- **Eng. Rigor slider**: Adjust engineering rigor level (0.10-1.00)
- **Hands off to dropdown**: Select another agent to hand off to after 20% of changes

Actions:

- **+ Add Agent**: Create a new agent with default settings
- **Reset Defaults**: Restore the default agent set

### Global Settings

Access via the sliders icon in the header.

| Setting                          | Description                                        |
| -------------------------------- | -------------------------------------------------- |
| Show confidence bands by default | Toggle whether p10/p90 bands are initially visible |
| Reset All Data                   | Clear localStorage and restore default simulations |

### Chart Controls

- **Reset View**: Reset zoom/pan to default
- **Show All**: Reveal all agents and confidence bands
- **Clear All**: Hide all chart lines
- **Legend click**: Toggle a scenario's visibility (all 3 lines together)
- **Scroll**: Zoom in/out
- **Drag**: Pan the view

## Data Persistence

All settings are automatically saved to `localStorage`:

- Simulation tabs (name, complexity, agents, changes)
- Agent configurations (name, engineering rigor, color, handoff)
- Global settings (default visibility)
- Active simulation selection

Data persists across browser sessions. Use **Reset All Data** in Global Settings to clear.

## Export

From the Settings panel, click the export icon to download the current simulation as JSON.

## File Structure

```text
src/ui/
  templates/           # HTML template builders
    icons.ts           # SVG icon constants
    header.ts          # Header template
    simulationTabs.ts  # Simulation tabs template
    configPanel.ts     # Settings panel template
    agentCard.ts       # Agent card template
    chartControls.ts   # Chart controls template
    globalSettingsModal.ts  # Modal template
    index.ts           # Barrel exports

  chart/
    colors.ts          # Color utilities
    config.ts          # Chart.js configuration
    datasets.ts        # Builds datasets from agents
    index.ts           # Barrel exports

  storage/
    types.ts           # AgentConfig, Simulation, GlobalConfig, AppData
    StorageService.ts  # Storage interface
    LocalStorageAdapter.ts  # localStorage implementation
    index.ts           # Barrel exports

  App.ts               # ProductHealthApp class (UI orchestration)
  defaults.ts          # Default simulations and agents
  types.ts             # UI constants
  styles.css           # All styles
  index.ts             # Public exports

src/main.ts            # Application entry point
```

## Customization

### Adding New Default Agents

Edit `src/ui/defaults.ts`:

```typescript
const createDefaultAgents = (): AgentConfig[] => [
  {
    id: "my-agent",
    name: "My Custom Agent",
    engineeringRigor: 0.6,
    color: "#10b981",
  },
  // ...
];
```

### Changing Color Palette

Edit `src/ui/defaults.ts`:

```typescript
export const getNextColor = (usedColors: string[]): string => {
  const palette = ["#ef4444", "#f97316", "#eab308" /* ... */];
  return palette.find((c) => !usedColors.includes(c)) ?? palette[0];
};
```

### Modifying Chart Appearance

Edit `src/ui/chart/config.ts` for Chart.js options (axes, legends, tooltips, zoom).

## Storage Interface

The UI uses a `StorageService` interface, implemented by `LocalStorageAdapter`. To add a backend:

```typescript
import type { StorageService } from "./storage/StorageService";

export class DatabaseAdapter implements StorageService {
  getSimulations(): Simulation[] {
    /* ... */
  }
  saveSimulation(sim: Simulation): void {
    /* ... */
  }
  // ... implement all interface methods
}
```

Then inject it into `ProductHealthApp` instead of `LocalStorageAdapter`.
