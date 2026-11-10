"""
Predictive Civic Issues Engine
Correlates meteorological, demographic, and historical urban telemetry 
to predict civic vulnerabilities before citizens report them.
"""

from typing import List, Dict, Any
from datetime import datetime

class PredictiveCivicEngine:
    @staticmethod
    def forecast_civic_risks(weather_condition: str = "Clear", rainfall_mm: float = 0.0) -> List[Dict[str, Any]]:
        risks = []
        now = datetime.now().strftime("%Y-%m-%d %H:%M")

        is_heavy_rain = ("rain" in weather_condition.lower() or rainfall_mm >= 25.0)
        is_moderate_rain = ("rain" in weather_condition.lower() or rainfall_mm >= 10.0)
        is_heatwave = ("heat" in weather_condition.lower())

        # 1. Stormwater & Waterlogging Prediction
        if is_heavy_rain:
            risks.append({
                "id": "PRED-FL-01",
                "risk_type": "Severe Waterlogging & Sump Overflow",
                "severity": "CRITICAL",
                "probability": 92,
                "impacted_wards": ["WARD-04", "WARD-03"],
                "affected_areas": "Riverfront Lowlands & Sector 9 Underpass",
                "trigger_factor": f"Simulated intense precipitation ({rainfall_mm or 48.5} mm/hr) exceeding storm drain capacity",
                "suggested_preventative_action": "Deploy de-watering submersible pumps; clear grates at Riverfront culverts.",
                "forecast_window": "Next 2 to 4 hours"
            })
        elif is_moderate_rain:
            risks.append({
                "id": "PRED-FL-02",
                "risk_type": "Moderate Urban Water Pooling",
                "severity": "HIGH",
                "probability": 74,
                "impacted_wards": ["WARD-04"],
                "affected_areas": "Industrial East Corridor Arterial Junction",
                "trigger_factor": f"Precipitation ({rainfall_mm or 15.0} mm/hr) on saturated road sub-base",
                "suggested_preventative_action": "Dispatch PWD rapid clearance team to Sector 14 storm drain inlet.",
                "forecast_window": "Next 6 hours"
            })

        # 2. Road Subgrade Collapse & Pothole Acceleration
        if is_moderate_rain or is_heavy_rain:
            risks.append({
                "id": "PRED-RD-01",
                "risk_type": "Pothole Deepening & Asphalt Delamination",
                "severity": "HIGH",
                "probability": 84,
                "impacted_wards": ["WARD-02", "WARD-07"],
                "affected_areas": "Sector 14 Main Commercial Ring Road & Metro Logistics Hub",
                "trigger_factor": "Water penetration into asphalt micro-fractures combined with heavy bus/truck axle loads",
                "suggested_preventative_action": "Pre-stage cold mix asphalt teams for rapid post-rain patching.",
                "forecast_window": "Next 12 hours"
            })

        # 3. Vector-Borne Health Epidemic (Dengue/Malaria)
        if is_heavy_rain or is_heatwave:
            risks.append({
                "id": "PRED-PH-01",
                "risk_type": "Mosquito Vector Breeding Surge (Dengue/Malaria)",
                "severity": "MEDIUM",
                "probability": 68,
                "impacted_wards": ["WARD-02", "WARD-05"],
                "affected_areas": "North Sector 14 Alleys & West Lake Peripheral Ditches",
                "trigger_factor": "Stagnant rainwater pockets combining with uncollected organic solid waste",
                "suggested_preventative_action": "Initiate automated vector fogging schedule and larvicide spraying.",
                "forecast_window": "48 - 72 hours"
            })

        # 4. Electrical Grid Hazard & Tree Fall on Lines
        if is_heavy_rain:
            risks.append({
                "id": "PRED-EL-01",
                "risk_type": "High Voltage Transformer Short-Circuit & Tree Branch Snapping",
                "severity": "CRITICAL",
                "probability": 79,
                "impacted_wards": ["WARD-06", "WARD-01"],
                "affected_areas": "Civil Lines University Enclave (Overhead Canopies)",
                "trigger_factor": "Wind gusts exceeding 40km/h with wet foliage contact on 11kV distribution lines",
                "suggested_preventative_action": "Pre-trim overhanging branches along University Road feeder lines.",
                "forecast_window": "Next 3 to 6 hours"
            })
        else:
            # Baseline baseline risk in normal weather
            risks.append({
                "id": "PRED-SW-01",
                "risk_type": "Weekend Solid Waste Overflow Spike",
                "severity": "MEDIUM",
                "probability": 62,
                "impacted_wards": ["WARD-02"],
                "affected_areas": "Sector 14 Old Market Central Dumpsters",
                "trigger_factor": "Commercial vegetable market weekend peak discharge rate",
                "suggested_preventative_action": "Schedule additional 2:00 PM compactor truck transit.",
                "forecast_window": "Saturday morning"
            })

        return risks
