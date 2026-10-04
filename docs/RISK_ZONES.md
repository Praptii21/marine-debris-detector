# Data-Driven Marine Debris & Hazard Risk Architecture

This document describes the design, mathematics, and implementation of the **Explainable & Measured Risk Zone Engine** in AquaScan.

---

## 1. Motivation: Why Move Beyond Static Heuristics?

Standard geospatial risk maps in environmental surveys often suffer from three major shortcomings:
1. **Unverifiable Heuristics:** Hand-drawn polygons based solely on proximity to ports or river mouths represent *assumptions*, not verified ground-truth.
2. **Sampling Bias (Effort Disparity):** A region where 20 transects were surveyed will naturally report more debris than a region surveyed once. Counting raw detections per area rewards undersampling and penalizes thorough surveying.
3. **The "Green Means Safe" Fallacy:** Marking unsurveyed ocean water as "Low Risk" (Green) misleads maritime authorities. Unsurveyed waters are **unknown**, not safe.

### AquaScan's Solution
AquaScan introduces an empirical, Bayesian-regularized risk engine that calculates **debris density per surveyed square kilometer ($km^2$)**, weights each contact by its **taxonomic severity** and **operator review verification**, and integrates spatial priors with honest data confidence reporting.

```
                          ┌───────────────────────────┐
                          │   Survey Waterfall / GPS  │
                          └─────────────┬─────────────┘
                                        │
                                        ▼
             ┌─────────────────────────────────────────────────────┐
             │                  FastAPI /detect                    │
             ├──────────────────────────┬──────────────────────────┤
             │ Bounding boxes           │ Georeferenced footprints │
             └────────────┬─────────────┴────────────┬─────────────┘
                          │                          │
                          ▼                          ▼
               ┌──────────────────────┐   ┌──────────────────────┐
               │  Table: detections   │   │Table: survey_coverage│
               └──────────┬───────────┘   └──────────┬───────────┘
                          │                          │
                          └─────────────┬────────────┘
                                        │
                                        ▼
                         ┌─────────────────────────────┐
                         │   GET /risk-zones (API)     │
                         │   (Bayesian Density Grid)   │
                         └──────────────┬──────────────┘
                                        │
                         ┌──────────────┴──────────────┐
                         ▼                             ▼
             ┌──────────────────────┐      ┌──────────────────────┐
             │ GeoJSON Risk Polygons│      │ Explainable Factors  │
             │   (Navigation Lens)  │      │   & Confidence Tier  │
             └──────────────────────┘      └──────────────────────┘
```

---

## 2. Mathematical Formulation

### A. Denominator: Surveyed Metric Area ($km^2$)
For each surveyed sonar pass, the metric swath width ($W_s$) and along-track length ($L_s$) define the surveyed area:
$$L_s = H_{px} \cdot \left(\frac{W_s}{W_{px}}\right)$$
$$\text{Area} = \frac{W_s \cdot L_s}{10^6} \quad (\text{km}^2)$$

All debris counts are evaluated relative to $\sum \text{Area}_{surveyed}$, never total geographic bounding box area.

---

### B. Event Weighting & Human-in-the-Loop Triage
Not all detections carry equal certainty:
$$w_i = S_{review} \cdot C_{model} \cdot D_{recency}$$

| Factor | Parameter | Rule |
| :--- | :--- | :--- |
| **Review State ($S_{review}$)** | Confirmed / Operator-drawn | $1.0$ (Verified by hydrographer) |
| | Unreviewed / Auto-confirmed | $0.7 \cdot \text{Confidence}$ (Model estimate discount) |
| | Rejected | $0.0$ (Discarded hard negative) |
| **Temporal Decay ($D_{recency}$)** | $0.5^{(\Delta t / 90\text{ days})}$ | Exponential decay with 90-day half-life |

---

### C. Bayesian Shrinkage (Empirical Bayes)
In sparse surveys, a single debris item discovered in a small exploratory pass ($0.02\text{ km}^2$) would yield a raw density of $50\text{ debris/km}^2$, falsely appearing as a massive hotspot.

To solve this, we apply **Gamma-Poisson shrinkage** toward the global survey rate ($\lambda_{global}$):

$$\lambda_{shrunk} = \frac{\sum w_i + (\lambda_{global} \cdot \alpha)}{\text{Area}_{surveyed} + \alpha}$$

Where:
- $\alpha = 0.5\text{ km}^2$ (pseudo-surveyed area prior).
- $\lambda_{global} = \frac{\sum \text{all weighted detections}}{\sum \text{all surveyed area}}$.

The normalized density score $D_{norm} \in [0, 1]$ is:
$$D_{norm} = 1 - e^{-\left(\frac{\lambda_{shrunk}}{\text{Scale}}\right)}$$
*(with $\text{Scale} = 5.0\text{ debris/km}^2$).*

---

### D. Taxonomic Severity Matrix
A single naval mine or explosive hazard poses an immediate existential threat to shipping, whereas multiple scattered crab pots represent chronic ecological entanglements. Severity is weighted by worst-case hazard observed:

$$\text{Severity} = \max_{i} \left( \sigma(\text{class}_i) \cdot \min(1.0, w_i) \right)$$

| Classification | Severity Weight ($\sigma$) | Primary Operational Risk |
| :--- | :---: | :--- |
| **Mine / MILCO / Ordnance** | `1.00` | Hull breach, detonation, vessel loss |
| **Person-in-Water** | `1.00` | Critical search & rescue life-safety |
| **Submerged Ghost Net** | `0.80` | Mammal/coral entanglement, propeller fouling |
| **Shipwreck Hull** | `0.60` | Shallow draft collision, anchor snag |
| **Downed Aircraft** | `0.60` | Navigational hazard & wreckage recovery |
| **Derelict Crab Pot** | `0.40` | Ghost fishing cycle, benthic scraping |
| **Unknown Debris** | `0.35` | Unclassified bottom anomaly |
| **Non-Mine Bottom Object** | `0.15` | Acoustic clutter / inert rock |

---

### E. Static Reference Priors (Geographic Concurrence)
The legacy reference dataset (`public/data/risk_data.json`) covers ports, river outflows, and shipping lanes. It is demoted from "ground-truth risk" to a **soft Gaussian proximity prior**:

$$P_{prior} = \max_{j} \left( \text{Intensity}_j \cdot e^{-\left(\frac{d_j}{\sigma_{prior}}\right)^2} \right)$$
*(with $\sigma_{prior} = 30.0\text{ km}$).*

---

### F. Unified Composite Risk Score
The final risk index $R \in [0.0, 1.0]$ combines all three orthogonal signals:
$$R = 0.45 \cdot D_{norm} + 0.30 \cdot \text{Severity} + 0.25 \cdot P_{prior}$$

#### Severity Thresholds
- **Critical ($\ge 0.65$):** Immediate intervention / quarantine (Red)
- **High ($0.50 - 0.64$):** Priority salvage & navigation warning (Orange)
- **Moderate ($0.30 - 0.49$):** Scheduled clearing pass (Yellow)
- **Low ($< 0.30$):** Baseline monitoring (Blue)

---

## 3. Specialized Hazard Lenses

Rather than forcing hydrographers, salvage crews, and environmental agencies to view an identical score, the engine exposes **Hazard Lenses**:

```
                              ┌────────────────┐
                              │  Hazard Lenses │
                              └───────┬────────┘
             ┌────────────────────────┼────────────────────────┐
             ▼                        ▼                        ▼
       [All Hazards]             [Navigation]             [Ecological]
      Complete taxonomy       Mines, Shipwrecks,        Ghost Nets, Pots,
      & composite risk.       Airplanes, Human Life     Derelict Fishing Gear
```

- **`all`**: Complete taxonomy & composite threat profile.
- **`navigation`**: Filters only for collision & safety-of-life hazards (`mine`, `shipwreck`, `airplane`, `human_in_water`).
- **`ecological`**: Filters specifically for derelict fishing gear and marine litter (`ghost_net`, `crab_pot`, `unknown_debris`).

---

## 4. Explainable UI & Popups

Every grid cell rendered on `/map` provides full auditability. When an operator clicks any polygon, the interface presents:
1. **Measured Risk Percentage:** (e.g. `76% - Critical`)
2. **Data Confidence Rating:** (`High`, `Medium`, `Low`) based on cumulative area surveyed and observation count.
3. **Decomposition Breakdown:** Contribution from measured density, severity class, and geographic prior.
4. **Natural-Language Reasoning:**
   - *"4 detections over 0.82 km² surveyed (4.9/km² weighted) — 2× ghost net, 2× crab pot"*
   - *"Contains high-severity contact (mine / ghost net / person in water)"*
   - *"Near known accumulation / traffic zone (prior 0.72)"*
   - *"Last surveyed 2026-09-24"*

---

## 5. API Reference

### `GET /risk-zones`
Returns a GeoJSON `FeatureCollection` of all surveyed grid cells.

#### Query Parameters
| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `hazard` | `string` | `"all"` | Filter lens: `"all"`, `"navigation"`, or `"ecological"` |
| `cell_km` | `float` | `1.0` | Target spatial cell dimension in kilometers ($0.25$ to $25.0$) |

#### Sample Response
```json
{
  "type": "FeatureCollection",
  "metadata": {
    "hazard": "all",
    "cell_km": 1.0,
    "surveyed_cells": 12,
    "total_surveyed_km2": 4.82,
    "global_rate_per_km2": 3.12
  },
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[80.268, 13.080], [80.278, 13.080], [80.278, 13.089], [80.268, 13.089], [80.268, 13.080]]]
      },
      "properties": {
        "cell_id": "1452_891",
        "center": { "lat": 13.0845, "lon": 80.2730 },
        "risk": 0.782,
        "level": "Critical",
        "components": { "density": 0.654, "severity": 1.0, "prior": 0.82 },
        "weights": { "density": 0.45, "severity": 0.30, "prior": 0.25 },
        "detections": 3,
        "by_class": { "mine": 1, "ghost_net": 2 },
        "area_km2": 0.42,
        "survey_lines": 2,
        "last_survey": "2026-10-03T18:30:00Z",
        "data_confidence": "high",
        "reasons": [
          "3 detections over 0.42 km² surveyed (7.1/km² weighted) — 1× mine, 2× ghost net",
          "Contains high-severity contact (mine / ghost net / person in water)",
          "Near known accumulation / traffic zone (prior 0.82)"
        ]
      }
    }
  ]
}
```

---

## 6. Verification & Automated Test Suite

Unit tests in `backend/test_risk.py` validate all formal mathematical properties:
1. **Area Normalization:** Identical counts over 10× smaller area yield strictly higher density.
2. **Severity Dominance:** A single naval ordnance contact outranks multiple crab pots.
3. **Review Loop Integration:** Rejected items score zero; unreviewed items discounted relative to confirmed.
4. **Temporal Decay:** Aged observations decay predictably.
5. **No Data $\neq$ Safe:** Unsurveyed areas yield zero emitted cells.
6. **Shrinkage Regularization:** Sparse single-event cells are dampened toward global baseline.
7. **Lens Partitioning:** Navigation and ecological class subsets isolate cleanly.
