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

### Chart Interactions

- **Click any point** on a line to see customer satisfaction insights for that health level.
- **Visibility filters**: Show All, Clear All, Devs Only, Handoffs Only. Filters persist per simulation.
- **Resimulate**: Re-run the Monte Carlo simulation with new random seeds (filters preserved).
- **Reset View**: Reset zoom and pan to default.
- **Legend**: Click to toggle individual developer/handoff trajectories.
- **Zoom/Pan**: Scroll to zoom, drag to pan.

### Settings Panel

Toggle with the **Configure** button in the header.

#### System Configuration

- **Complexity**: Slider (`0.1` to `1.0`) representing how complex the requirements are. Can you use off-the-shelf tools, or do you need custom solutions?
- **Starting Health**: Initial Product Health (1-10).
- **Changes**: Select simulation length (`250`, `500`, `1,000`, or `2,000` changes).

**Complexity Guide:**

- `0.1 - 0.3`: **Simple** (Off-the-shelf tools suffice) — Highly forgiving.
- `0.3 - 0.6`: **Moderate** (Standard patterns, some custom logic) — Requires baseline discipline.
- `0.6 - 0.85`: **Enterprise** (Complex business rules, bespoke domain logic) — Punishes low rigor.
- `0.85 - 1.0`: **Extreme** (Novel problem space, no existing solutions) — Only highest rigor can maintain.

#### Developer Management

Configure the developers and scenarios:

- **Developers**: Independent AI agents or humans with a fixed **Engineering Rigor** (`0.1` to `1.0`).
- **Handoff Scenarios**: Define a story where one developer hands off to another.
  - **From/To**: Select the starting and ending developers.
  - **Handoff at**: Configure the exact change event number where the transition occurs.
  - **Name**: Personalize the label for the handoff flow.

### Global Settings

Access via the sliders icon in the header.

- **Default Visibility**: Show **All** (Mean + 80% confidence bands) or **Averages Only**.
- **Shape → Scale Marker**: Position and label for the annotation line.
- **Simulation Runs**: Number of Monte Carlo runs to average (50-800).
- **Reset All Data**: Clears `localStorage` and restores factory defaults.

---

## Data Persistence

All data is automatically saved to the browser's `localStorage` and persists across sessions. This includes simulation tabs, developer settings, visibility filters, and global preferences.

## Advanced: Customization

### Adding Default Data

Edit `src/ui/defaults.ts` to modify default developers or handoffs. These are used when creating new simulations or resetting to defaults.

### Custom Storage Adapters

The app uses a `StorageService` interface. You can swap `LocalStorageAdapter` in `src/ui/App.ts` for a custom implementation (e.g., database or cloud storage).

### Chart Styling

Modify `src/ui/chart/config.ts` to adjust Chart.js behaviors like axes scaling, tooltips, or zoom sensitivity.
