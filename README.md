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

**High ER (senior engineers, ER ≈ 0.8-1.0)**:

- P(Optimal) = 0.6
- P(Neutral) = 0.3
- P(Catastrophic) = 0.1

**Low ER (AI vibe coding, ER ≈ 0.1-0.3)**:

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

**For low ER (AI vibe coding)**:
`E[Δ] = 0.1 × 0.5 + 0.2 × 0 + 0.7 × (-1.0) = -0.65`

**For high ER (senior engineers)**:
`E[Δ] = 0.6 × 0.5 + 0.3 × 0 + 0.1 × (-1.0) = +0.2`

### The Key Insight

Even if AI improves over time and P(Catastrophic) drops from 0.7 to 0.4:

`E[Δ] = 0.2 × 0.5 + 0.4 × 0 + 0.4 × (-1.0) = -0.3`

**The expected value remains negative.** Over n Change Events, Product Health trends toward 1.

### Time to Failure

Starting from PH₀ = 8:

**Low ER (E[Δ] = -0.65)**:

- Expected Change Events until PH = 1: ~11 changes

**Improved AI (E[Δ] = -0.3)**:

- Expected Change Events until PH = 1: ~23 changes

**Senior Engineers (E[Δ] = +0.2)**:

- Product Health improves over time, approaches 10

## Conclusion

The mathematical model demonstrates:

1. Low Engineering Rigor produces negative expected value per Change Event
2. Even with AI improvement, as long as E[Δ] < 0, Product Health trends to 1
3. Only sufficient Engineering Rigor (E[Δ] > 0) maintains or improves Product Health
4. The Scale Phase requires sustained positive E[Δ] to remain economically viable

AI vibe coding may improve, but unless it achieves E[Δ] ≥ 0, it will inevitably drive systems toward unmaintainability.
