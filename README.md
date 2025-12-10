# Product Health Dynamics

## Why this exists

Teams debate whether fast, AI-heavy "vibe coding" is good enough. A common scenario: a prospect or client has a non-technical employee, let's call him “Ralph”, who says he can do everything faster and cheaper with AI and prompt hacking.

This simulation shows what happens next in the Scale Phase: low rigor creates negative expected change, coupling drag compounds it, and Product Health trends toward 1. It gives you a concrete way to counter the “Ralph can do it” argument and to explain why sustained engineering rigor preserves long-term product health.

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
| **Decay Rate**             | The per-change expected movement of Product Health given the current probabilities/deltas. Negative when Engineering Rigor is insufficient.                                                                     |
| **Coupling Drag**          | State-dependent risk: as Product Health drops, catastrophic outcomes become more likely and more damaging, while optimal outcomes become less likely.                                                           |

## The Model

### Probability Distribution

Each Change Event has a probability distribution across Solution Space regions:

- **P(Optimal)**: Probability of landing in region that improves PH
- **P(Neutral)**: Probability of landing in region that maintains PH
- **P(Catastrophic)**: Probability of landing in region that degrades PH

Where: P(Optimal) + P(Neutral) + P(Catastrophic) = 1

### Engineering Rigor Effect

Engineering Rigor shifts the base probability distribution:

**High ER (Senior Engineers)**:

- P(Optimal) = 0.45
- P(Neutral) = 0.4
- P(Catastrophic) = 0.15

**Low ER (AI "Vibe Coding")**:

- P(Optimal) = 0.1
- P(Neutral) = 0.2
- P(Catastrophic) = 0.7

### Coupling Drag (State-Dependent Risk)

As Product Health falls, the probability distribution shifts dynamically through two mechanisms:

1. **Probability shift**: Catastrophic probability increases, optimal probability decreases (harder to make good changes in tangled code)
2. **Severity scaling**: Catastrophic damage itself becomes worse as health drops (changes break more things in fragile systems)

This is controlled by a **Coupling Gain** parameter:

- High coupling gain (1.0): AI vibe coding creates severe coupling, accelerating decay
- Medium coupling gain (0.9): AI with guardrails reduces but doesn't eliminate coupling
- Low coupling gain (0.6): Senior engineers maintain manageable coupling

The coupling drag is quadratic (health factor squared), so risk and damage accelerate as health falls. Bad changes make future bad changes both more likely and more damaging unless Engineering Rigor is applied.

### Product Health Evolution

After n Change Events:

`PH(n) = PH(n-1) + Δ`

Where Δ is determined by which region the Change Event lands in:

- Optimal: Δ = +0.5 (or 0 if PH = 10)
- Neutral: Δ = 0
- Catastrophic: Δ = -1.0 (or 0 if PH = 1)

### Expected Value

The base expected change in Product Health per Change Event (before coupling drag):

`E[Δ] = P(Optimal) × 0.5 + P(Neutral) × 0 + P(Catastrophic) × (-1.0)`

**For AI Vibe Coding (Ralph)**:
`E[Δ] = 0.1 × 0.5 + 0.2 × 0 + 0.7 × (-1.0) = -0.65`

**For Senior Engineers**:
`E[Δ] = 0.45 × 0.5 + 0.4 × 0 + 0.15 × (-1.0) = +0.075`

### The "Guardrails" Fallacy

Even if we implement strict linting and improved AI prompts ("AI with Guardrails"):

- P(Optimal) increases to 0.28
- P(Neutral) increases to 0.38
- P(Catastrophic) drops to 0.34
- We even assume Catastrophic damage is mitigated to Δ = -0.7 instead of -1.0

The math:
`E[Δ] = 0.28 × 0.5 + 0.38 × 0 + 0.34 × (-0.7) = 0.14 - 0.238 = -0.098`

**The expected value remains negative.** Even with better tools, without sufficient Engineering Rigor, the system mathematically trends toward failure (PH → 1).

Worse, coupling drag amplifies this effect: as PH drops, the effective probability of catastrophic outcomes increases and catastrophic damage becomes more severe, accelerating decay beyond the base E[Δ].

### Conclusion

1. Low Engineering Rigor produces negative expected value per Change Event.
2. Coupling drag is quadratic, causing accelerating decay as Product Health falls.
3. Catastrophic damage severity increases as health drops, compounding the degradation.
4. "Improved AI" alone is not enough. As long as the effective E[Δ] stays negative, Product Health trends to 1.
5. Only sufficient Engineering Rigor (E[Δ] > 0 with coupling drag considered) maintains or improves Product Health.
6. The Scale Phase requires sustained positive E[Δ] to remain economically viable.

## Running the simulation

- `npm run simulate` (all scenarios)
- `npm run simulate:ai`
- `npm run simulate:guardrails`
- `npm run simulate:senior`

The module also executes when run directly with Node: `node src/simulation.ts` (or `npx tsx src/simulation.ts`).

## Visualizing trajectories

- `npm run dev` then open the Vite app to see Chart.js line plots of average PH trajectories for all scenarios.
- Uses Monte Carlo averages (n=800 per scenario) to keep the chart fast and legible.

![Product Health Trajectories](./assets/Screenshot%202025-12-10%20at%2001.53.42.png)
