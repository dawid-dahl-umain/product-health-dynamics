# Theoretical Grounding

This document explains how the Product Health Dynamics model relates to established software engineering research. It is written to be honest about what can and cannot be claimed.

## Summary

**What this model is:**
A mathematical simulation that formalizes qualitative observations from software engineering research into a quantitative, explorable model.

**What this model is not:**
An empirically validated prediction engine with scientifically derived parameters.

**The legitimate claim:**

> "This model provides a quantitative formalization of dynamics that Lehman observed qualitatively. The behaviors it predicts are consistent with Lehman's Laws of Software Evolution and supported by empirical studies on software quality."

---

## Lehman's Laws of Software Evolution

### Who Was Lehman?

Meir M. Lehman (1925-2010) was a computer scientist at IBM and later Imperial College London. Starting in the 1970s, he conducted longitudinal studies of large software systems, most notably IBM's OS/360 operating system.

### What Lehman Actually Did

Lehman's research was **empirical-observational**. He:

1. **Tracked real systems over time** (primarily IBM OS/360, later other systems)
2. **Measured quantitative metrics** across releases:
   - Lines of code
   - Number of modules
   - Release intervals
   - Defect counts
   - Change requests
3. **Identified patterns** that held across different systems
4. **Formulated qualitative laws** describing these patterns

### What Lehman Did NOT Do

Lehman did not:

- Provide mathematical formulas or equations
- Specify parameter values (slopes, thresholds, decay rates)
- Create predictive simulation models
- Define "quality" as a single numeric scale

His laws are **descriptive observations**, not prescriptive formulas.

### The Eight Laws (1974-1996)

The following are Lehman's exact wordings as published in his papers:

| #   | Law                                      | Year | Exact Statement                                                                                                                                                                                                                                                                          |
| --- | ---------------------------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Continuing Change                        | 1974 | "An E-type system must be continually adapted or it becomes progressively less satisfactory." [\[1\]](#references)                                                                                                                                                                       |
| 2   | Increasing Complexity                    | 1974 | "As an evolving program is continually changed, its complexity, reflecting deteriorating structure, increases unless work is done to maintain or reduce it." [\[1\]](#references)                                                                                                        |
| 3   | Self-Regulation                          | 1974 | "E-type system evolution processes are self-regulating with the distribution of product and process measures close to normal." [\[1\]](#references)                                                                                                                                      |
| 4   | Conservation of Organizational Stability | 1978 | "The average effective global activity rate in an evolving E-type system is invariant over the product's lifetime." [\[2\]](#references)                                                                                                                                                 |
| 5   | Conservation of Familiarity              | 1978 | "As an E-type system evolves, all associated with it must maintain mastery of its content and behaviour to achieve satisfactory evolution. Excessive growth diminishes that mastery. Hence the average incremental growth remains invariant as the system evolves." [\[2\]](#references) |
| 6   | Continuing Growth                        | 1991 | "The functional content of an E-type system must be continually increased to maintain user satisfaction over its lifetime." [\[2\]](#references)                                                                                                                                         |
| 7   | Declining Quality                        | 1996 | "The quality of an E-type system will appear to be declining unless it is rigorously maintained and adapted to operational environment changes." [\[2\]](#references)                                                                                                                    |
| 8   | Feedback System                          | 1996 | "E-type evolution processes constitute multi-level, multi-loop, multi-agent feedback systems and must be treated as such to achieve significant improvement over any reasonable base." [\[2\]](#references)                                                                              |

**Note:** "E-type" refers to systems embedded in the real world that must evolve with changing requirements; this includes virtually all production software.

---

## How This Model Connects to Lehman's Work

### Legitimate Connections

| Model Component                  | Lehman's Law                 | Connection                                                                                |
| -------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------- |
| `accumulatedComplexity`          | Law 2: Increasing Complexity | Formalizes the observation that complexity grows with each change unless actively reduced |
| Negative `baseImpact` for low ER | Law 7: Declining Quality     | Formalizes the observation that quality declines without rigorous maintenance             |
| `systemState` feedback loop      | Law 8: Feedback System       | Formalizes the observation that current state affects future outcomes                     |
| The compounding effect           | Laws 2 + 7 + 8               | Formalizes the accelerating decay pattern Lehman observed in unmaintained systems         |

### The Nature of the Formalization

This model takes Lehman's qualitative statements and assigns them mathematical form:

| Lehman's Exact Words                                                                                                                  | Model's Formalization                                            |
| ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| "...its complexity, reflecting deteriorating structure, increases unless work is done to maintain or reduce it." [\[1\]](#references) | `complexityDrift = -(base + growth × changeCount) × systemState` |
| "The quality of an E-type system will appear to be declining unless it is rigorously maintained..." [\[2\]](#references)              | `μ = ER × 2.4 - 1.2` (negative below ER=0.5)                     |
| "E-type evolution processes constitute multi-level, multi-loop, multi-agent feedback systems..." [\[2\]](#references)                 | `systemState = sigmoid(PH - 5)` modifies all calculations        |

**Important:** The formulas in the right column are this model's contribution. Lehman did not provide mathematical formulas; he provided qualitative observations. The formulas are one possible way to capture the dynamics he described.

### What Cannot Be Claimed

The specific parameter values in this model are **calibration choices**, not empirically derived constants:

| Parameter              | Value   | Basis                                               |
| ---------------------- | ------- | --------------------------------------------------- |
| Sigmoid steepness      | 1.5     | Chosen to produce a reasonable transition curve     |
| Impact slope           | 2.4     | Chosen to place breakeven at ER=0.5                 |
| Complexity growth rate | 0.00005 | Tuned so seniors show ~5% decline over 1000 changes |

These values could reasonably be different (e.g., steepness of 1.2 or 1.8) and the qualitative story would remain similar. The model's value is in **relative comparisons** (low rigor degrades faster than high rigor) rather than exact predictions.

---

## Supporting Empirical Evidence

Beyond Lehman's qualitative laws, several empirical studies provide quantitative support for specific claims in this model.

### Evidence for "Complexity Increases Over Time"

**Study:** "An Empirical Study of Lehman's Law on Software Quality Evolution"

- **Projects:** Apache Tomcat, Apache Ant
- **Method:** Tracked "accumulated defect density" across releases
- **Finding:** Software systems tend to increase in complexity and decline in quality unless actively maintained
- **Source:** Indiana University ScholarWorks

**Study:** "Towards a Better Understanding of Software Evolution"

- **Projects:** Nine open-source projects, 108 combined years of evolution
- **Finding:** Supported Lehman's laws regarding continuous change and growth
- **Source:** NJIT Research Publications

### Evidence for "Engineering Practices Affect Quality"

**Finding:** Code review effectiveness

- Formal code inspections detect approximately **60% of defects**
- Informal reviews detect fewer than **50%**
- Traditional testing alone detects approximately **30%**
- **Source:** IEEE/ACM literature on code review

**Finding:** Test-Driven Development impact

- TDD practices associated with approximately **40% reduction** in defects during later development stages
- **Source:** Empirical Software Engineering studies

**Finding:** Test coverage correlation

- "The Relation of Test-Related Factors to Software Quality: A Case Study on Apache Systems"
- Test size and test code quality significantly related to post-release defect rates
- **Source:** Empirical Software Engineering, Springer

### Evidence for "Larger Well-Maintained Systems Have Lower Defect Density"

**Study:** "Quality of Open Source Systems from Product Metrics Perspective"

- **Finding:** Larger products tend to have lower defect densities
- **Interpretation:** Scale + structured practices + experienced teams improve quality
- **Source:** arXiv:1511.03194

---

## How to Present This Model

### Recommended Framing

When presenting this model, use language like:

> "This simulation is a **mathematical formalization inspired by** Lehman's Laws of Software Evolution. Lehman's empirical research established that software complexity increases over time, quality declines without rigorous maintenance, and evolution operates as a feedback system. **This model translates those qualitative observations into quantitative dynamics** that let us explore scenarios and visualize trajectories."

> "The specific parameter values are calibration choices based on practical experience. The model's value is in the **relative comparisons** it enables, such as 'low-rigor development degrades faster than high-rigor development,' rather than exact predictions."

### Addressing Skepticism

If asked "Did you just make this up?", you can honestly respond:

1. **The qualitative dynamics are grounded in Lehman's research.** He observed these patterns in real systems over decades. The laws are well-established in software engineering literature.

2. **The mathematical form is my contribution.** Lehman described _what_ happens; this model proposes _how much_ and _how fast_ using specific formulas.

3. **The parameter values are calibration choices.** They're tuned to produce behaviors that match practical experience. They could be adjusted, and the qualitative conclusions would remain similar.

4. **Empirical studies support the underlying claims.** Research on code review effectiveness, test coverage, and defect density provides quantitative evidence for the relationships the model assumes.

### What to Emphasize

- The model is a **thinking tool**, not a prediction engine
- Its value is in making dynamics **visible and discussable**
- The **relative** conclusions are more reliable than **absolute** predictions
- Sensitivity analysis shows the qualitative story is robust to parameter changes

### What to Avoid Claiming

- That the formulas are "derived from" Lehman's work (they're not; he gave laws, not equations)
- That the parameter values are "empirically validated" (they're calibration choices)
- That the model "predicts" exact outcomes (it explores scenarios)

---

## References

### Primary Sources (Lehman's Laws)

**[1]** Lehman, M.M. (1980). "Programs, Life Cycles, and Laws of Software Evolution." _Proceedings of the IEEE_, 68(9), 1060-1076. doi:10.1109/PROC.1980.11805

> This is Lehman's foundational paper that formalized Laws 1-3. The exact wording for Law 2 (Increasing Complexity) appears on page 1068.

**[2]** Lehman, M.M., Ramil, J.F., et al. (1997). "Metrics and Laws of Software Evolution: The Nineties View." _Proceedings of the 4th International Software Metrics Symposium (METRICS '97)_, pp. 20-32. doi:10.1109/METRIC.1997.637156

> This paper revised and extended the laws to eight. Laws 4-8 are formalized here with the exact wordings cited in this document.

**[3]** Belady, L.A., Lehman, M.M. (1976). "A Model of Large Program Development." _IBM Systems Journal_, 15(3), 225-252.

> Earlier work that laid the groundwork for the laws, based on observations of IBM OS/360 development.

### Empirical Validation Studies

**[4]** "An Empirical Study of Lehman's Law on Software Quality Evolution." Indiana University ScholarWorks. (Study on Apache Tomcat and Apache Ant)

**[5]** "Towards a Better Understanding of Software Evolution: An Empirical Study on Open Source Software." NJIT Research Publications.

**[6]** Catolino, G., et al. (2020). "The Relation of Test-Related Factors to Software Quality: A Case Study on Apache Systems." _Empirical Software Engineering_, Springer. doi:10.1007/s10664-020-09891-y

**[7]** "Quality of Open Source Systems from Product Metrics Perspective." arXiv:1511.03194

### Supporting Literature

**[8]** IEEE/ACM studies on code review effectiveness (60% defect detection rate for formal inspections).

**[9]** Empirical studies on Test-Driven Development (~40% defect reduction).

---

## Appendix: The Entropy Metaphor

The model uses "entropy" as a metaphor for software decay. This is an **analogy**, not an application of thermodynamic laws.

**Why the metaphor works:**

- Both systems tend toward disorder without energy/effort input
- Both exhibit path dependence (current state affects future states)
- Both show that maintaining order requires sustained work

**Why it's only a metaphor:**

- Software doesn't obey thermodynamic laws
- The underlying mathematics is different
- Software decay can be reversed; thermodynamic entropy cannot

When presenting, be clear that this is a useful analogy for intuition, not a claim about physics.

---

## Document History

- **Created:** December 2025
- **Purpose:** Provide honest grounding for the Product Health Dynamics model
- **Audience:** Technical leadership, skeptical reviewers
