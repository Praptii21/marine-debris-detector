// Hardcoded / cached fallback for measured risk grids (7 cells)
// Ensures instant display even when backend is offline or on static previews.
export const demoRiskData = {
  "all": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [
                80.35328872675339,
                13.26805605461732
              ],
              [
                80.36251837167951,
                13.26805605461732
              ],
              [
                80.36251837167951,
                13.27703916636723
              ],
              [
                80.35328872675339,
                13.27703916636723
              ],
              [
                80.35328872675339,
                13.26805605461732
              ]
            ]
          ]
        },
        "properties": {
          "cell_id": "1477_8706",
          "center": {
            "lat": 13.27255,
            "lon": 80.3579
          },
          "risk": 0.937,
          "level": "Critical",
          "components": {
            "density": 0.95,
            "severity": 1.0,
            "prior": 0.837
          },
          "weights": {
            "density": 0.45,
            "severity": 0.3,
            "prior": 0.25
          },
          "detections": 2,
          "by_class": {
            "mine": 1,
            "crab_pot": 1
          },
          "area_km2": 0.085,
          "survey_lines": 1,
          "last_survey": "2026-10-04T12:25:53.841895+00:00",
          "data_confidence": "low",
          "reasons": [
            "2 detections over 0.09 km\u00b2 surveyed (17.9/km\u00b2 weighted) \u2014 1\u00d7 mine, 1\u00d7 crab pot",
            "Contains high-severity contact (mine / ghost net / person in water)",
            "Near known accumulation / traffic zone (prior 0.84)",
            "Last surveyed 2026-10-04"
          ]
        }
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [
                80.41846282616005,
                13.016528925619834
              ],
              [
                80.4276830122213,
                13.016528925619834
              ],
              [
                80.4276830122213,
                13.025512037369745
              ],
              [
                80.41846282616005,
                13.025512037369745
              ],
              [
                80.41846282616005,
                13.016528925619834
              ]
            ]
          ]
        },
        "properties": {
          "cell_id": "1449_8722",
          "center": {
            "lat": 13.02102,
            "lon": 80.42307
          },
          "risk": 0.849,
          "level": "Critical",
          "components": {
            "density": 0.951,
            "severity": 0.8,
            "prior": 0.724
          },
          "weights": {
            "density": 0.45,
            "severity": 0.3,
            "prior": 0.25
          },
          "detections": 3,
          "by_class": {
            "shipwreck": 1,
            "mine": 1,
            "ghost_net": 1
          },
          "area_km2": 0.144,
          "survey_lines": 1,
          "last_survey": "2026-10-04T12:25:53.843705+00:00",
          "data_confidence": "medium",
          "reasons": [
            "3 detections over 0.14 km\u00b2 surveyed (17.0/km\u00b2 weighted) \u2014 1\u00d7 shipwreck, 1\u00d7 mine, 1\u00d7 ghost net",
            "Contains high-severity contact (mine / ghost net / person in water)",
            "Near known accumulation / traffic zone (prior 0.72)",
            "Last surveyed 2026-10-04"
          ]
        }
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [
                74.81705096992613,
                12.908731584620913
              ],
              [
                74.82626716245753,
                12.908731584620913
              ],
              [
                74.82626716245753,
                12.917714696370822
              ],
              [
                74.81705096992613,
                12.917714696370822
              ],
              [
                74.81705096992613,
                12.908731584620913
              ]
            ]
          ]
        },
        "properties": {
          "cell_id": "1437_8118",
          "center": {
            "lat": 12.91322,
            "lon": 74.82166
          },
          "risk": 0.804,
          "level": "Critical",
          "components": {
            "density": 0.939,
            "severity": 0.6,
            "prior": 0.805
          },
          "weights": {
            "density": 0.45,
            "severity": 0.3,
            "prior": 0.25
          },
          "detections": 1,
          "by_class": {
            "shipwreck": 1
          },
          "area_km2": 0.09,
          "survey_lines": 1,
          "last_survey": "2026-10-04T12:25:53.843705+00:00",
          "data_confidence": "low",
          "reasons": [
            "1 detection over 0.09 km\u00b2 surveyed (11.1/km\u00b2 weighted) \u2014 1\u00d7 shipwreck",
            "Near known accumulation / traffic zone (prior 0.80)",
            "Last surveyed 2026-10-04"
          ]
        }
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [
                74.33003960527195,
                14.013654329859863
              ],
              [
                74.33929845425118,
                14.013654329859863
              ],
              [
                74.33929845425118,
                14.022637441609774
              ],
              [
                74.33003960527195,
                14.022637441609774
              ],
              [
                74.33003960527195,
                14.013654329859863
              ]
            ]
          ]
        },
        "properties": {
          "cell_id": "1560_8028",
          "center": {
            "lat": 14.01815,
            "lon": 74.33467
          },
          "risk": 0.772,
          "level": "Critical",
          "components": {
            "density": 0.933,
            "severity": 0.6,
            "prior": 0.687
          },
          "weights": {
            "density": 0.45,
            "severity": 0.3,
            "prior": 0.25
          },
          "detections": 1,
          "by_class": {
            "shipwreck": 1
          },
          "area_km2": 0.11,
          "survey_lines": 1,
          "last_survey": "2026-10-04T12:25:53.843705+00:00",
          "data_confidence": "low",
          "reasons": [
            "1 detection over 0.11 km\u00b2 surveyed (9.1/km\u00b2 weighted) \u2014 1\u00d7 shipwreck",
            "Near known accumulation / traffic zone (prior 0.69)",
            "Last surveyed 2026-10-04"
          ]
        }
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [
                80.3262703563133,
                13.214157384117858
              ],
              [
                80.33549795773276,
                13.214157384117858
              ],
              [
                80.33549795773276,
                13.223140495867769
              ],
              [
                80.3262703563133,
                13.223140495867769
              ],
              [
                80.3262703563133,
                13.214157384117858
              ]
            ]
          ]
        },
        "properties": {
          "cell_id": "1471_8705",
          "center": {
            "lat": 13.21865,
            "lon": 80.33088
          },
          "risk": 0.758,
          "level": "Critical",
          "components": {
            "density": 0.952,
            "severity": 0.4,
            "prior": 0.839
          },
          "weights": {
            "density": 0.45,
            "severity": 0.3,
            "prior": 0.25
          },
          "detections": 2,
          "by_class": {
            "crab_pot": 1,
            "ghost_net": 1
          },
          "area_km2": 0.075,
          "survey_lines": 1,
          "last_survey": "2026-10-04T12:25:53.843705+00:00",
          "data_confidence": "low",
          "reasons": [
            "2 detections over 0.07 km\u00b2 surveyed (20.0/km\u00b2 weighted) \u2014 1\u00d7 crab pot, 1\u00d7 ghost net",
            "Near known accumulation / traffic zone (prior 0.84)",
            "Last surveyed 2026-10-04"
          ]
        }
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [
                80.39778565164163,
                12.693136902623069
              ],
              [
                80.40699396519697,
                12.693136902623069
              ],
              [
                80.40699396519697,
                12.702120014372978
              ],
              [
                80.39778565164163,
                12.702120014372978
              ],
              [
                80.39778565164163,
                12.693136902623069
              ]
            ]
          ]
        },
        "properties": {
          "cell_id": "1413_8731",
          "center": {
            "lat": 12.69763,
            "lon": 80.40239
          },
          "risk": 0.637,
          "level": "High",
          "components": {
            "density": 0.947,
            "severity": 0.6,
            "prior": 0.122
          },
          "weights": {
            "density": 0.45,
            "severity": 0.3,
            "prior": 0.25
          },
          "detections": 1,
          "by_class": {
            "shipwreck": 1
          },
          "area_km2": 0.06,
          "survey_lines": 1,
          "last_survey": "2026-10-04T12:25:53.843705+00:00",
          "data_confidence": "low",
          "reasons": [
            "1 detection over 0.06 km\u00b2 surveyed (16.7/km\u00b2 weighted) \u2014 1\u00d7 shipwreck",
            "Last surveyed 2026-10-04"
          ]
        }
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [
                80.38707211741415,
                12.890765361121092
              ],
              [
                80.39628764786438,
                12.890765361121092
              ],
              [
                80.39628764786438,
                12.899748472871002
              ],
              [
                80.38707211741415,
                12.899748472871002
              ],
              [
                80.38707211741415,
                12.890765361121092
              ]
            ]
          ]
        },
        "properties": {
          "cell_id": "1435_8723",
          "center": {
            "lat": 12.89526,
            "lon": 80.39168
          },
          "risk": 0.618,
          "level": "High",
          "components": {
            "density": 0.939,
            "severity": 0.224,
            "prior": 0.513
          },
          "weights": {
            "density": 0.45,
            "severity": 0.3,
            "prior": 0.25
          },
          "detections": 2,
          "by_class": {
            "crab_pot": 1,
            "non_mine_object": 1
          },
          "area_km2": 0.095,
          "survey_lines": 1,
          "last_survey": "2026-10-04T12:25:53.843705+00:00",
          "data_confidence": "low",
          "reasons": [
            "2 detections over 0.10 km\u00b2 surveyed (11.2/km\u00b2 weighted) \u2014 1\u00d7 crab pot, 1\u00d7 non mine object",
            "Near known accumulation / traffic zone (prior 0.51)",
            "Last surveyed 2026-10-04"
          ]
        }
      }
    ],
    "metadata": {
      "hazard": "all",
      "cell_km": 1.0,
      "surveyed_cells": 7,
      "total_surveyed_km2": 0.659,
      "global_rate_per_km2": 14.478
    }
  },
  "navigation": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [
                80.35328872675339,
                13.26805605461732
              ],
              [
                80.36251837167951,
                13.26805605461732
              ],
              [
                80.36251837167951,
                13.27703916636723
              ],
              [
                80.35328872675339,
                13.27703916636723
              ],
              [
                80.35328872675339,
                13.26805605461732
              ]
            ]
          ]
        },
        "properties": {
          "cell_id": "1477_8706",
          "center": {
            "lat": 13.27255,
            "lon": 80.3579
          },
          "risk": 0.891,
          "level": "Critical",
          "components": {
            "density": 0.849,
            "severity": 1.0,
            "prior": 0.837
          },
          "weights": {
            "density": 0.45,
            "severity": 0.3,
            "prior": 0.25
          },
          "detections": 1,
          "by_class": {
            "mine": 1
          },
          "area_km2": 0.085,
          "survey_lines": 1,
          "last_survey": "2026-10-04T12:25:53.841895+00:00",
          "data_confidence": "low",
          "reasons": [
            "1 detection over 0.09 km\u00b2 surveyed (11.8/km\u00b2 weighted) \u2014 1\u00d7 mine",
            "Contains high-severity contact (mine / ghost net / person in water)",
            "Near known accumulation / traffic zone (prior 0.84)",
            "Last surveyed 2026-10-04"
          ]
        }
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [
                74.81705096992613,
                12.908731584620913
              ],
              [
                74.82626716245753,
                12.908731584620913
              ],
              [
                74.82626716245753,
                12.917714696370822
              ],
              [
                74.81705096992613,
                12.917714696370822
              ],
              [
                74.81705096992613,
                12.908731584620913
              ]
            ]
          ]
        },
        "properties": {
          "cell_id": "1437_8118",
          "center": {
            "lat": 12.91322,
            "lon": 74.82166
          },
          "risk": 0.762,
          "level": "Critical",
          "components": {
            "density": 0.846,
            "severity": 0.6,
            "prior": 0.805
          },
          "weights": {
            "density": 0.45,
            "severity": 0.3,
            "prior": 0.25
          },
          "detections": 1,
          "by_class": {
            "shipwreck": 1
          },
          "area_km2": 0.09,
          "survey_lines": 1,
          "last_survey": "2026-10-04T12:25:53.843705+00:00",
          "data_confidence": "low",
          "reasons": [
            "1 detection over 0.09 km\u00b2 surveyed (11.1/km\u00b2 weighted) \u2014 1\u00d7 shipwreck",
            "Near known accumulation / traffic zone (prior 0.80)",
            "Last surveyed 2026-10-04"
          ]
        }
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [
                80.41846282616005,
                13.016528925619834
              ],
              [
                80.4276830122213,
                13.016528925619834
              ],
              [
                80.4276830122213,
                13.025512037369745
              ],
              [
                80.41846282616005,
                13.025512037369745
              ],
              [
                80.41846282616005,
                13.016528925619834
              ]
            ]
          ]
        },
        "properties": {
          "cell_id": "1449_8722",
          "center": {
            "lat": 13.02102,
            "lon": 80.42307
          },
          "risk": 0.741,
          "level": "Critical",
          "components": {
            "density": 0.844,
            "severity": 0.6,
            "prior": 0.724
          },
          "weights": {
            "density": 0.45,
            "severity": 0.3,
            "prior": 0.25
          },
          "detections": 2,
          "by_class": {
            "shipwreck": 1,
            "mine": 1
          },
          "area_km2": 0.144,
          "survey_lines": 1,
          "last_survey": "2026-10-04T12:25:53.843705+00:00",
          "data_confidence": "medium",
          "reasons": [
            "2 detections over 0.14 km\u00b2 surveyed (10.1/km\u00b2 weighted) \u2014 1\u00d7 shipwreck, 1\u00d7 mine",
            "Near known accumulation / traffic zone (prior 0.72)",
            "Last surveyed 2026-10-04"
          ]
        }
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [
                74.33003960527195,
                14.013654329859863
              ],
              [
                74.33929845425118,
                14.013654329859863
              ],
              [
                74.33929845425118,
                14.022637441609774
              ],
              [
                74.33003960527195,
                14.022637441609774
              ],
              [
                74.33003960527195,
                14.013654329859863
              ]
            ]
          ]
        },
        "properties": {
          "cell_id": "1560_8028",
          "center": {
            "lat": 14.01815,
            "lon": 74.33467
          },
          "risk": 0.728,
          "level": "Critical",
          "components": {
            "density": 0.836,
            "severity": 0.6,
            "prior": 0.687
          },
          "weights": {
            "density": 0.45,
            "severity": 0.3,
            "prior": 0.25
          },
          "detections": 1,
          "by_class": {
            "shipwreck": 1
          },
          "area_km2": 0.11,
          "survey_lines": 1,
          "last_survey": "2026-10-04T12:25:53.843705+00:00",
          "data_confidence": "low",
          "reasons": [
            "1 detection over 0.11 km\u00b2 surveyed (9.1/km\u00b2 weighted) \u2014 1\u00d7 shipwreck",
            "Near known accumulation / traffic zone (prior 0.69)",
            "Last surveyed 2026-10-04"
          ]
        }
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [
                80.39778565164163,
                12.693136902623069
              ],
              [
                80.40699396519697,
                12.693136902623069
              ],
              [
                80.40699396519697,
                12.702120014372978
              ],
              [
                80.39778565164163,
                12.702120014372978
              ],
              [
                80.39778565164163,
                12.693136902623069
              ]
            ]
          ]
        },
        "properties": {
          "cell_id": "1413_8731",
          "center": {
            "lat": 12.69763,
            "lon": 80.40239
          },
          "risk": 0.598,
          "level": "High",
          "components": {
            "density": 0.861,
            "severity": 0.6,
            "prior": 0.122
          },
          "weights": {
            "density": 0.45,
            "severity": 0.3,
            "prior": 0.25
          },
          "detections": 1,
          "by_class": {
            "shipwreck": 1
          },
          "area_km2": 0.06,
          "survey_lines": 1,
          "last_survey": "2026-10-04T12:25:53.843705+00:00",
          "data_confidence": "low",
          "reasons": [
            "1 detection over 0.06 km\u00b2 surveyed (16.7/km\u00b2 weighted) \u2014 1\u00d7 shipwreck",
            "Last surveyed 2026-10-04"
          ]
        }
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [
                80.3262703563133,
                13.214157384117858
              ],
              [
                80.33549795773276,
                13.214157384117858
              ],
              [
                80.33549795773276,
                13.223140495867769
              ],
              [
                80.3262703563133,
                13.223140495867769
              ],
              [
                80.3262703563133,
                13.214157384117858
              ]
            ]
          ]
        },
        "properties": {
          "cell_id": "1471_8705",
          "center": {
            "lat": 13.21865,
            "lon": 80.33088
          },
          "risk": 0.566,
          "level": "High",
          "components": {
            "density": 0.792,
            "severity": 0.0,
            "prior": 0.839
          },
          "weights": {
            "density": 0.45,
            "severity": 0.3,
            "prior": 0.25
          },
          "detections": 0,
          "by_class": {},
          "area_km2": 0.075,
          "survey_lines": 1,
          "last_survey": "2026-10-04T12:25:53.843705+00:00",
          "data_confidence": "low",
          "reasons": [
            "0 detections over 0.07 km\u00b2 surveyed (0.0/km\u00b2 weighted) \u2014 no detections",
            "Near known accumulation / traffic zone (prior 0.84)",
            "Last surveyed 2026-10-04"
          ]
        }
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [
                80.38707211741415,
                12.890765361121092
              ],
              [
                80.39628764786438,
                12.890765361121092
              ],
              [
                80.39628764786438,
                12.899748472871002
              ],
              [
                80.38707211741415,
                12.899748472871002
              ],
              [
                80.38707211741415,
                12.890765361121092
              ]
            ]
          ]
        },
        "properties": {
          "cell_id": "1435_8723",
          "center": {
            "lat": 12.89526,
            "lon": 80.39168
          },
          "risk": 0.518,
          "level": "High",
          "components": {
            "density": 0.815,
            "severity": 0.076,
            "prior": 0.513
          },
          "weights": {
            "density": 0.45,
            "severity": 0.3,
            "prior": 0.25
          },
          "detections": 1,
          "by_class": {
            "non_mine_object": 1
          },
          "area_km2": 0.095,
          "survey_lines": 1,
          "last_survey": "2026-10-04T12:25:53.843705+00:00",
          "data_confidence": "low",
          "reasons": [
            "1 detection over 0.10 km\u00b2 surveyed (5.3/km\u00b2 weighted) \u2014 1\u00d7 non mine object",
            "Near known accumulation / traffic zone (prior 0.51)",
            "Last surveyed 2026-10-04"
          ]
        }
      }
    ],
    "metadata": {
      "hazard": "navigation",
      "cell_km": 1.0,
      "surveyed_cells": 7,
      "total_surveyed_km2": 0.659,
      "global_rate_per_km2": 9.042
    }
  },
  "ecological": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [
                80.41846282616005,
                13.016528925619834
              ],
              [
                80.4276830122213,
                13.016528925619834
              ],
              [
                80.4276830122213,
                13.025512037369745
              ],
              [
                80.41846282616005,
                13.025512037369745
              ],
              [
                80.41846282616005,
                13.016528925619834
              ]
            ]
          ]
        },
        "properties": {
          "cell_id": "1449_8722",
          "center": {
            "lat": 13.02102,
            "lon": 80.42307
          },
          "risk": 0.729,
          "level": "Critical",
          "components": {
            "density": 0.685,
            "severity": 0.8,
            "prior": 0.724
          },
          "weights": {
            "density": 0.45,
            "severity": 0.3,
            "prior": 0.25
          },
          "detections": 1,
          "by_class": {
            "ghost_net": 1
          },
          "area_km2": 0.144,
          "survey_lines": 1,
          "last_survey": "2026-10-04T12:25:53.843705+00:00",
          "data_confidence": "medium",
          "reasons": [
            "1 detection over 0.14 km\u00b2 surveyed (6.9/km\u00b2 weighted) \u2014 1\u00d7 ghost net",
            "Near known accumulation / traffic zone (prior 0.72)",
            "Last surveyed 2026-10-04"
          ]
        }
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [
                80.3262703563133,
                13.214157384117858
              ],
              [
                80.33549795773276,
                13.214157384117858
              ],
              [
                80.33549795773276,
                13.223140495867769
              ],
              [
                80.3262703563133,
                13.223140495867769
              ],
              [
                80.3262703563133,
                13.214157384117858
              ]
            ]
          ]
        },
        "properties": {
          "cell_id": "1471_8705",
          "center": {
            "lat": 13.21865,
            "lon": 80.33088
          },
          "risk": 0.676,
          "level": "Critical",
          "components": {
            "density": 0.769,
            "severity": 0.4,
            "prior": 0.839
          },
          "weights": {
            "density": 0.45,
            "severity": 0.3,
            "prior": 0.25
          },
          "detections": 2,
          "by_class": {
            "crab_pot": 1,
            "ghost_net": 1
          },
          "area_km2": 0.075,
          "survey_lines": 1,
          "last_survey": "2026-10-04T12:25:53.843705+00:00",
          "data_confidence": "low",
          "reasons": [
            "2 detections over 0.07 km\u00b2 surveyed (20.0/km\u00b2 weighted) \u2014 1\u00d7 crab pot, 1\u00d7 ghost net",
            "Near known accumulation / traffic zone (prior 0.84)",
            "Last surveyed 2026-10-04"
          ]
        }
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [
                80.35328872675339,
                13.26805605461732
              ],
              [
                80.36251837167951,
                13.26805605461732
              ],
              [
                80.36251837167951,
                13.27703916636723
              ],
              [
                80.35328872675339,
                13.27703916636723
              ],
              [
                80.35328872675339,
                13.26805605461732
              ]
            ]
          ]
        },
        "properties": {
          "cell_id": "1477_8706",
          "center": {
            "lat": 13.27255,
            "lon": 80.3579
          },
          "risk": 0.574,
          "level": "High",
          "components": {
            "density": 0.67,
            "severity": 0.21,
            "prior": 0.837
          },
          "weights": {
            "density": 0.45,
            "severity": 0.3,
            "prior": 0.25
          },
          "detections": 1,
          "by_class": {
            "crab_pot": 1
          },
          "area_km2": 0.085,
          "survey_lines": 1,
          "last_survey": "2026-10-04T12:25:53.841895+00:00",
          "data_confidence": "low",
          "reasons": [
            "1 detection over 0.09 km\u00b2 surveyed (6.2/km\u00b2 weighted) \u2014 1\u00d7 crab pot",
            "Near known accumulation / traffic zone (prior 0.84)",
            "Last surveyed 2026-10-04"
          ]
        }
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [
                80.38707211741415,
                12.890765361121092
              ],
              [
                80.39628764786438,
                12.890765361121092
              ],
              [
                80.39628764786438,
                12.899748472871002
              ],
              [
                80.38707211741415,
                12.899748472871002
              ],
              [
                80.38707211741415,
                12.890765361121092
              ]
            ]
          ]
        },
        "properties": {
          "cell_id": "1435_8723",
          "center": {
            "lat": 12.89526,
            "lon": 80.39168
          },
          "risk": 0.496,
          "level": "Moderate",
          "components": {
            "density": 0.668,
            "severity": 0.224,
            "prior": 0.513
          },
          "weights": {
            "density": 0.45,
            "severity": 0.3,
            "prior": 0.25
          },
          "detections": 1,
          "by_class": {
            "crab_pot": 1
          },
          "area_km2": 0.095,
          "survey_lines": 1,
          "last_survey": "2026-10-04T12:25:53.843705+00:00",
          "data_confidence": "low",
          "reasons": [
            "1 detection over 0.10 km\u00b2 surveyed (5.9/km\u00b2 weighted) \u2014 1\u00d7 crab pot",
            "Near known accumulation / traffic zone (prior 0.51)",
            "Last surveyed 2026-10-04"
          ]
        }
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [
                74.81705096992613,
                12.908731584620913
              ],
              [
                74.82626716245753,
                12.908731584620913
              ],
              [
                74.82626716245753,
                12.917714696370822
              ],
              [
                74.81705096992613,
                12.917714696370822
              ],
              [
                74.81705096992613,
                12.908731584620913
              ]
            ]
          ]
        },
        "properties": {
          "cell_id": "1437_8118",
          "center": {
            "lat": 12.91322,
            "lon": 74.82166
          },
          "risk": 0.472,
          "level": "Moderate",
          "components": {
            "density": 0.602,
            "severity": 0.0,
            "prior": 0.805
          },
          "weights": {
            "density": 0.45,
            "severity": 0.3,
            "prior": 0.25
          },
          "detections": 0,
          "by_class": {},
          "area_km2": 0.09,
          "survey_lines": 1,
          "last_survey": "2026-10-04T12:25:53.843705+00:00",
          "data_confidence": "low",
          "reasons": [
            "0 detections over 0.09 km\u00b2 surveyed (0.0/km\u00b2 weighted) \u2014 no detections",
            "Near known accumulation / traffic zone (prior 0.80)",
            "Last surveyed 2026-10-04"
          ]
        }
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [
                74.33003960527195,
                14.013654329859863
              ],
              [
                74.33929845425118,
                14.013654329859863
              ],
              [
                74.33929845425118,
                14.022637441609774
              ],
              [
                74.33003960527195,
                14.022637441609774
              ],
              [
                74.33003960527195,
                14.013654329859863
              ]
            ]
          ]
        },
        "properties": {
          "cell_id": "1560_8028",
          "center": {
            "lat": 14.01815,
            "lon": 74.33467
          },
          "risk": 0.437,
          "level": "Moderate",
          "components": {
            "density": 0.59,
            "severity": 0.0,
            "prior": 0.687
          },
          "weights": {
            "density": 0.45,
            "severity": 0.3,
            "prior": 0.25
          },
          "detections": 0,
          "by_class": {},
          "area_km2": 0.11,
          "survey_lines": 1,
          "last_survey": "2026-10-04T12:25:53.843705+00:00",
          "data_confidence": "low",
          "reasons": [
            "0 detections over 0.11 km\u00b2 surveyed (0.0/km\u00b2 weighted) \u2014 no detections",
            "Near known accumulation / traffic zone (prior 0.69)",
            "Last surveyed 2026-10-04"
          ]
        }
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [
                80.39778565164163,
                12.693136902623069
              ],
              [
                80.40699396519697,
                12.693136902623069
              ],
              [
                80.40699396519697,
                12.702120014372978
              ],
              [
                80.39778565164163,
                12.702120014372978
              ],
              [
                80.39778565164163,
                12.693136902623069
              ]
            ]
          ]
        },
        "properties": {
          "cell_id": "1413_8731",
          "center": {
            "lat": 12.69763,
            "lon": 80.40239
          },
          "risk": 0.31,
          "level": "Moderate",
          "components": {
            "density": 0.621,
            "severity": 0.0,
            "prior": 0.122
          },
          "weights": {
            "density": 0.45,
            "severity": 0.3,
            "prior": 0.25
          },
          "detections": 0,
          "by_class": {},
          "area_km2": 0.06,
          "survey_lines": 1,
          "last_survey": "2026-10-04T12:25:53.843705+00:00",
          "data_confidence": "low",
          "reasons": [
            "0 detections over 0.06 km\u00b2 surveyed (0.0/km\u00b2 weighted) \u2014 no detections",
            "Last surveyed 2026-10-04"
          ]
        }
      }
    ],
    "metadata": {
      "hazard": "ecological",
      "cell_km": 1.0,
      "surveyed_cells": 7,
      "total_surveyed_km2": 0.659,
      "global_rate_per_km2": 5.436
    }
  }
};
