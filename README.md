# Product Health Dynamics

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
| **Decay Rate**             | The rate at which Product Health degrades per Change Event when Engineering Rigor is insufficient.                                                                                                              |

## The Model

### Probability Distribution

Each Change Event has a probability distribution across Solution Space regions:

- **P(Optimal)**: Probability of landing in region that improves PH
- **P(Neutral)**: Probability of landing in region that maintains PH
- **P(Catastrophic)**: Probability of landing in region that degrades PH

Where: P(Optimal) + P(Neutral) + P(Catastrophic) = 1

### Engineering Rigor Effect

Engineering Rigor shifts the probability distribution:

**High ER (Senior Engineers)**:

- P(Optimal) = 0.6
- P(Neutral) = 0.3
- P(Catastrophic) = 0.1

**Low ER (AI "Vibe Coding")**:

- P(Optimal) = 0.1
- P(Neutral) = 0.2
- P(Catastrophic) = 0.7

### Product Health Evolution

After n Change Events:

`PH(n) = PH(n-1) + Δ`

Where Δ is determined by which region the Change Event lands in:

- Optimal: Δ = +0.5 (or 0 if PH = 10)
- Neutral: Δ = 0
- Catastrophic: Δ = -1.0 (or 0 if PH = 1)

### Expected Value

The expected change in Product Health per Change Event:

`E[Δ] = P(Optimal) × 0.5 + P(Neutral) × 0 + P(Catastrophic) × (-1.0)`

**For AI Vibe Coding (Ralph)**:
`E[Δ] = 0.1 × 0.5 + 0.2 × 0 + 0.7 × (-1.0) = -0.65`

**For Senior Engineers**:
`E[Δ] = 0.6 × 0.5 + 0.3 × 0 + 0.1 × (-1.0) = +0.2`

### The "Guardrails" Fallacy

Even if we implement strict linting and improved AI prompts ("AI with Guardrails"):

- P(Optimal) increases to 0.35
- P(Neutral) increases to 0.35
- P(Catastrophic) drops to 0.30
- We even assume Catastrophic damage is mitigated to Δ = -0.7 instead of -1.0

The math:
`E[Δ] = 0.35 × 0.5 + 0.35 × 0 + 0.30 × (-0.7) = 0.175 - 0.21 = -0.035`

**The expected value remains negative.** Even with better tools, without sufficient Engineering Rigor, the system mathematically trends toward failure (PH → 1).

### Conclusion

1. Low Engineering Rigor produces negative expected value per Change Event.
2. "Improved AI" is not enough. As long as E[Δ] < 0, Product Health trends to 1.
3. Only sufficient Engineering Rigor (E[Δ] > 0) maintains or improves Product Health.
4. The Scale Phase requires sustained positive E[Δ] to remain economically viable.

## Running the simulation

- `npm run simulate` (all scenarios)
- `npm run simulate:ai`
- `npm run simulate:guardrails`
- `npm run simulate:senior`

The module also executes when run directly with Node: `node src/simulation.ts` (or `npx tsx src/simulation.ts`).

## Visualizing trajectories

- `npm run dev` then open the Vite app to see Chart.js line plots of average PH trajectories for all scenarios.
- Uses Monte Carlo averages (n=800 per scenario) to keep the chart fast and legible.
