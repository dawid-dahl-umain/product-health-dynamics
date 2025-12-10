# Product Health Dynamics

> **Vibe coding**:
>
> You’ve built an app. It works. And one day as you are polishing some styling, the AI accidentally deletes 40% of the tests in the backend part of the app. You do not notice, because you are vibe coding, and in the process of making coffee in another room.
>
> You happily go about your day, blissfully unaware of all what is going on inside the code realms.
>
> Fast forward two weeks. You now ask the AI to add a new feature. It does. Worked yet again, “vibe coding is great!”
>
> Then suddenly, BOOM! 💥
>
> Apparently feature x and y broke, now when feature z was added. If we only had tests that would have prevented this…
>
> Now we’re in a bad situation. Because when I vibe-asked the AI to fix feature x and y while also keeping feature z working, they all started working… but then feature a, b and c suddenly broke, and feature d breaks also, but not always.
>
> This is the situation I predict every vibe coded project will eventually end up in, if one keeps doing it.

## Overview

Teams debate whether fast, AI-heavy "vibe coding" is good enough. A common scenario: a prospect or client has a non-technical employee who says they can do everything faster and cheaper by generating the code using AI.

This simulation starts at the handoff from Shape Phase (initial build) into Scale Phase (ongoing change).

Low engineering rigor (no modularity, weak testing, rising coupling) makes changes more likely to damage the system. Coupling drag compounds over time. Product Health trends toward 1 unless sustained engineering rigor keeps it viable over the long term.

## TL;DR (non-math)

- Product Health measures how easy it is to change the code (1 = impossible, 10 = easy).
- Each change can help, do nothing, or hurt. With low rigor, the expected effect is negative (Decay Rate).
- As health drops, bad changes get more likely and more harmful (Coupling Drag).
- "AI with guardrails" still trends down because the expected effect stays negative.
- Senior engineers keep expected effect positive, so health stays high.

## Terms

| Term                       | Definition                                                                                                                                                                                                      |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Software Quality**       | How easy a system is to change. Primary measure of system health.                                                                                                                                               |
| **Product Health (PH)**    | Software Quality measured at a specific point in time. Scale: 1 (modification prohibitively expensive) to 10 (modification trivially inexpensive).                                                              |
| **Shape Phase**            | Initial development period. Ends when product reaches functional completeness.                                                                                                                                  |
| **Scale Phase**            | All maintenance and evolution after Shape Phase. Continues indefinitely. Represents the majority of total cost.                                                                                                 |
| **Change Input**           | A modification request that initiates a search through Solution Space. Can originate from human developer or AI agent.                                                                                          |
| **Solution Space**         | The set of all possible implementations for a given Change Input. Effectively infinite for non-trivial systems.                                                                                                 |
| **Quality Gradient**       | The distribution of implementations within Solution Space from those preserving Product Health (optimal, toward 10) to those destroying Product Health (catastrophic, toward 1).                                |
| **Change Event**           | The actual implementation chosen from Solution Space. The code that gets written.                                                                                                                               |
| **Engineering Rigor (ER)** | The degree to which a Change Event applies principles of managing complexity: modularity, cohesion, separation of concerns, information hiding, and coupling management. Scale: 0 (no rigor) to 1 (full rigor). |
| **Decay Rate**             | Placeholder: to be redefined alongside the model.                                                                                                                                                               |
| **Coupling Drag**          | Placeholder: to be redefined alongside the model.                                                                                                                                                               |

## Model (to be redefined)

The mathematical model and its interactions are intentionally removed while the terms are refined. Reintroduce model dynamics here when the next iteration is ready.

## Running the simulation

- `npm run simulate` (all scenarios)
- `npm run simulate:ai`
- `npm run simulate:guardrails`
- `npm run simulate:senior`
- `npm run simulate:handoff` (30 AI Change Events, then 70 by senior engineers)

The module also executes when run directly with Node: `node src/simulation.ts` (or `npx tsx src/simulation.ts`).

## Visualizing trajectories

- `npm run dev` (served on http://localhost:4173) then open the Vite app to see Chart.js line plots of average PH trajectories for all scenarios.
- Uses Monte Carlo averages (n=800 per scenario) to keep the chart fast and legible.

![Product Health Trajectories](./assets/Screenshot%202025-12-10%20at%2001.53.42.png)
