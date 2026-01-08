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

Each tab represents an independent simulation with its own agents and settings. Click a tab to switch; double-click to rename.

- **Add Tab (+)**: Create a new blank simulation (no agents, simple complexity)
- **Close Tab (×)**: Remove a simulation (requires at least one remaining)

### Settings Panel

Toggle with the **Settings** button in the header.

#### Simulation Settings

| Option     | Description                                      |
| ---------- | ------------------------------------------------ |
| Changes    | Number of change events to simulate (250-2000)   |
| Complexity | System complexity: Simple, Medium, or Enterprise |

#### Agent Configuration

Each agent card displays:

- **Color picker**: Click to change the line color
- **Name input**: Edit the agent's display name
- **Engineering Rigor slider**: Adjust skill/discipline level (0.10-1.00)
- **Handoff dropdown**: Select another agent to hand off to after 20% of changes

Actions:

- **+ Add Agent**: Create a new agent with default settings
- **Reset Defaults**: Restore the default agent set for current complexity

### Global Settings

Access via the gear icon in the header.

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

- Simulation tabs (name, agents, complexity, changes)
- Agent configurations (name, engineering rigor, color, handoff)
- Global settings (default visibility)
- Active simulation selection

Data persists across browser sessions. Use **Reset All Data** in Global Settings to clear.

## Export

From the Settings panel, click the export icon to download the current simulation as JSON. This can be shared or used as a backup.

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
    colors.ts          # Color utilities and chart palette
    config.ts          # Chart.js configuration
    datasets.ts        # Builds chart datasets from agents
    index.ts           # Barrel exports

  storage/
    types.ts           # AgentConfig, Simulation, GlobalConfig, AppData
    StorageService.ts  # Storage interface
    LocalStorageAdapter.ts  # localStorage implementation
    index.ts           # Barrel exports

  App.ts               # ProductHealthApp class (UI logic)
  defaults.ts          # Default simulations and agent configurations
  types.ts             # UI-specific types and constants
  styles.css           # All UI styles
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
  // ... other agents
];
```

### Changing Color Palette

Edit `src/ui/defaults.ts`:

```typescript
export const getNextColor = (usedColors: string[]): string => {
  const palette = [
    "#ef4444", // red
    "#f97316", // orange
    // ... add or modify colors
  ];
  return palette.find((c) => !usedColors.includes(c)) ?? palette[0];
};
```

### Modifying Chart Appearance

Edit `src/ui/chart/config.ts` for Chart.js options (axes, legends, tooltips, zoom behavior).

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
