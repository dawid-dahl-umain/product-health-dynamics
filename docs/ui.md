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

Manage multiple scenarios simultaneously. Each tab is self-contained.

- **Switch**: Click a tab to view its configuration and chart.
- **Rename**: Double-click the tab name to edit.
- **Add (+)**: Create a new blank simulation.
- **Duplicate**: Copy the active simulation (located in settings).
- **Export**: Download the active simulation as a JSON file.

### Settings Panel

Toggle with the **Settings** button in the header.

#### System Configuration

- **Complexity**: Slider (`0.1` to `1.0`) representing inherent architectural difficulty.
- **Changes**: Select simulation length (`250`, `500`, `1,000`, or `2,000` changes).

**Complexity Guide:**

- `0.1 - 0.3`: **Simple** (Blog, landing page) — Highly forgiving.
- `0.3 - 0.6`: **Moderate** (CRUD backend) — Requires baseline discipline.
- `0.6 - 1.0`: **Enterprise** (Complex architecture, high coupling) — Punishes low rigor.

#### Developer Management

Configure the developers and scenarios:

- **Developers**: Independent AI agents or humans with a fixed **Engineering Rigor** (`0.1` to `1.0`).
- **Handoff Scenarios**: Define a story where one developer hands off to another.
  - **From/To**: Select the starting and ending developers.
  - **Handoff at**: Configure the exact change event number where the transition occurs.
  - **Name**: Personalize the label for the handoff flow. (Trajectory colors are automatically derived from the developers with a darker offset).

### Global Settings

Access via the **Globe icon** in the header.

- **Default Visibility**: Choose whether to show **All** (Mean + 80% confidence bands) or **Averages Only** by default.
- **Reset All Data**: Clears `localStorage` and restores factory defaults.

---

## Data Persistence

All data is automatically saved to the browser's `localStorage` and persists across sessions. This includes your simulation tabs, custom developer settings, and global preferences.

## Advanced: Customization

### Adding Default Data

Edit `src/ui/defaults.ts` and modify `createDefaultDevelopers` or `createDefaultHandoffs`. These sets are used when you click "Reset Defaults" in the UI.

### Custom Storage Adapters

The app uses a `StorageService` interface. You can swap `LocalStorageAdapter` in `src/ui/App.ts` for a custom implementation (e.g., connecting to a database or cloud storage).

```typescript
export interface StorageService {
  getSimulations(): Simulation[];
  saveSimulation(sim: Simulation): void;
  // ... see src/ui/storage/types.ts
}
```

### Chart Styling

Modify `src/ui/chart/config.ts` to adjust Chart.js specific behaviors like axes scaling, tooltips, or zoom sensitivity.
