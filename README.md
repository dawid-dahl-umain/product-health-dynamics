# Product Health Dynamics

> **Vibe coding:**
>
> _You've built an app. It works. And one day as you are polishing some styling, the AI accidentally deletes 40% of the tests in the backend part of the app. You do not notice, because you are vibe coding, and in the process of making coffee in another room._
>
> _You happily go about your day, blissfully unaware of all what is going on inside the code realms._
>
> _Fast forward two weeks. You now ask the AI to add a new feature. It does. Worked yet again, "vibe coding is great!"_
>
> _Then suddenly, BOOM! 💥_
>
> _Apparently feature x and y broke, now when feature z was added. If we only had tests that would have prevented this…_
>
> _Now we're in a bad situation. Because when I vibe-asked the AI to fix feature x and y while also keeping feature z working, they all started working… but then feature a, b and c suddenly broke, and feature d breaks also, but not always._
>
> _This is the situation I predict every vibe coded project will eventually end up in, if one keeps doing it._

## Overview

Teams debate whether fast, AI-heavy "vibe coding" is good enough. A common scenario: a prospect or client has a non-technical employee who says they can do everything faster and cheaper by generating the code using AI.

This simulation starts at the handoff from **Shape Phase** (initial build) into **Scale Phase** (ongoing change).

Low **Engineering Rigor** (no modularity, weak testing, rising coupling) makes changes more likely to damage the system. **Product Health** trends toward 1 unless sustained **Engineering Rigor** keeps it viable over the long term.

## TL;DR (non-math)

- **Product Health** measures how easy it is to change the code (1 = impossible, 10 = easy).
- Each **Change Event** can help, do nothing, or hurt. With low **Engineering Rigor**, the expected impact is negative.
- Low-rigor agents trend toward 1; high-rigor agents trend toward their **Maximum Health** (~9 for seniors).
- Decay is slow at first, then accelerates. Recovery is slow at first, then accelerates, then plateaus.

## Terms

| Term                       | Definition                                                                                                                                                                                                  | Plain meaning                                                                                             |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Software Quality**       | How easy a system is to change. Primary measure of system health.                                                                                                                                           | How hard or easy changes feel.                                                                            |
| **Product Health (PH)**    | **Software Quality** measured at a specific point in time. Scale: 1 to 10.                                                                                                                                  | Current ease of change on a 1–10 scale.                                                                   |
| **Shape Phase**            | Initial development period. Ends when product reaches functional completeness.                                                                                                                              | Building the first working version.                                                                       |
| **Scale Phase**            | All maintenance and evolution after **Shape Phase**. Continues indefinitely.                                                                                                                                | Growing and changing the product long term.                                                               |
| **Change Event**           | A modification applied to the codebase. The code that gets written.                                                                                                                                         | The change that actually lands in code.                                                                   |
| **Engineering Rigor (ER)** | The degree to which changes apply complexity management principles: modularity, abstraction, separation of concerns, loose coupling, and cohesion. Scale: 0 to 1. All other properties are derived from it. | The human or AI agent's skill and discipline. It's the difference between a calculated move and a gamble. |

## Model

This model is consistent with Lehman's Laws of Software Evolution. **Software Quality** degrades over time unless work is actively done to maintain it. **Engineering Rigor** represents that "work."

### The Master Dial: Engineering Rigor (ER)

**Engineering Rigor** is the single input variable that defines an agent (human or AI). The base properties are:

| Derived Property   | Formula              | Intuition                                                    |
| ------------------ | -------------------- | ------------------------------------------------------------ |
| **Base Impact**    | μ = ER × 0.4 − 0.2   | High ER → positive impact; Low ER → negative impact.         |
| **Base Sigma**     | σ = σ_max × (1 − ER) | High ER → consistent outcomes; Low ER → erratic swings.      |
| **Maximum Health** | maxPH = 5 + 5 × ER   | High ER → higher **Maximum Health** (e.g., seniors reach 9). |

See [Model Parameters](#model-parameters) for the rationale behind the constants (0.4, 0.2, 0.5, 5).

### System State Modifies Outcomes

The current **Product Health** affects how changes land. A healthy system has buffers (tests, modularity) that absorb mistakes. A coupled system amplifies damage and resists improvement.

All modifiers derive from a single intermediate variable (not a core term, just a calculation):

$$\text{systemState} = \frac{1}{1 + e^{-k(PH - 5)}}$$

This sigmoid transforms **PH** into a 0-1 scale representing how "tractable" the system is. At PH = 5, systemState = 0.5 (the threshold).

| For...                   | Modifier                          | Effect                                                            |
| ------------------------ | --------------------------------- | ----------------------------------------------------------------- |
| Negative **Base Impact** | × (1 − systemState)               | Damage compounds at low PH, absorbed at high PH                   |
| Positive **Base Impact** | × systemState × (1 − (PH/maxPH)²) | Hard to improve mess; diminishing returns near **Maximum Health** |
| **Base Sigma**           | × (0.3 + 0.7 × (1 − systemState)) | More chaos at low PH; tests catch outliers at high PH             |

See [Model Parameters](#model-parameters) for the rationale behind the constants (k, 0.3, 0.7).

**Result:** Both decay and recovery follow S-curves. The threshold (~5) is where the system shifts from "coupled mess" to "tractable codebase."

### Change Events

Each change is a probabilistic draw: `ΔPH = μ_eff + σ_eff × N(0,1)`, clamped to [1, maxPH].

### Agent Profiles

Only **ER** is configured. The other columns are derived using the formulas above.

| Agent         | ER (input) | → Base Impact | → Base Sigma | → Maximum Health |
| ------------- | ---------- | ------------- | ------------ | ---------------- |
| AI Vibe       | 0.1        | −0.16         | 0.45         | 5.5              |
| AI Guardrails | 0.3        | −0.08         | 0.35         | 6.5              |
| Junior        | 0.4        | −0.04         | 0.30         | 7.0              |
| Senior        | 0.8        | +0.12         | 0.10         | 9.0              |

### What You'll See

- **AI Vibe:** Slow decay at first, accelerates around **PH** ~5, bottoms at 1.
- **Senior:** Steady climb from 8 toward **Maximum Health** (~9).
- **Handoff:** AI decays to 1; seniors struggle initially, then recover in an S-curve toward **Maximum Health**.

![Product Health Trajectories](./assets/Screenshot%202025-12-22%20at%2000.18.54.png)

## Usage

```bash
npm run dev          # Visualize trajectories (Chart.js)
npm run simulate:ai  # CLI output for AI scenario
```

## For Client Conversations

When a client suggests that AI-assisted non-engineers can replace professional engineering:

1. **Present the model.** Engineering Rigor determines all outcomes. Low ER produces negative expected impact per change, regardless of speed.
2. **Run the simulation.** The trajectory demonstrates the inevitable decline and the cost of recovery.
3. **Reference established theory.** This model is consistent with Lehman's Laws of Software Evolution (see below).
4. **Quantify the tradeoff.** Fast and cheap delivery with low ER leads to a codebase that becomes expensive to change. The cost is deferred, not eliminated.

### Connection to Lehman's Laws

Lehman's Laws of Software Evolution (1970s, peer-reviewed) describe universal patterns in how software systems change over time:

| Law                         | Statement                                              | How This Model Captures It                                                                   |
| --------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| 2nd (Increasing Complexity) | Complexity increases unless work is done to reduce it. | **ER** represents that work. Low ER means complexity grows unchecked.                        |
| 7th (Declining Quality)     | Quality declines unless rigorously maintained.         | Low **ER** produces negative **Base Impact**, making decline the default outcome.            |
| 8th (Feedback System)       | Evolution is a multi-loop feedback system.             | **PH** creates feedback: low PH → damage compounds → lower PH (and vice versa for recovery). |

## Model Parameters

The formulas contain calibration parameters. These are design choices, not derived values, and can be adjusted based on empirical observation.

### Base Property Parameters

| Parameter        | Value | Rationale                                                                                                   |
| ---------------- | ----- | ----------------------------------------------------------------------------------------------------------- |
| Impact slope     | 0.4   | Sets the sensitivity of impact to rigor. Combined with intercept, produces ±0.2 max impact per change.      |
| Impact intercept | 0.2   | Places the breakeven point at ER = 0.5. Agents above midpoint improve systems; below midpoint degrade them. |
| σ_max            | 0.5   | Maximum standard deviation. At ER = 0, outcomes swing by roughly ±0.5 per change.                           |
| Ceiling base     | 5     | Minimum achievable ceiling (at ER = 0). Even zero-rigor agents have a theoretical ceiling at midscale.      |
| Ceiling slope    | 5     | Makes ceiling range from 5 (ER = 0) to 10 (ER = 1). Perfect rigor can achieve perfect health.               |

### System State Parameters

| Parameter        | Value | Rationale                                                                      |
| ---------------- | ----- | ------------------------------------------------------------------------------ |
| Threshold        | 5     | The midpoint of the PH scale. Below 5 = "coupled mess"; above 5 = "tractable." |
| Steepness (k)    | 1.5   | Controls how sharp the transition is. Higher = more abrupt threshold effect.   |
| Ceiling exponent | 2     | The power in (PH/maxPH)². Higher = sharper diminishing returns near ceiling.   |
| Variance floor   | 0.3   | Even healthy systems retain 30% of base variance.                              |
| Variance range   | 0.7   | The remaining 70% of variance is affected by system state.                     |
