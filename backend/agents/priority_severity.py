"""
Agent 4: Priority & Severity Agent
Quantifies multi-factor civic risk scoring (0 to 100) based on hazard type,
pedestrian/traffic footfall density, environmental conditions, and safety multipliers.
"""

import time
from datetime import datetime
from typing import Tuple, Optional
from config import BASE_HAZARD_SCORES, CITY_WARDS
from models.incident import ExtractedIssueData, ResolvedLocationData, PrioritySeverityData, PriorityLevel, AgentExecutionTrace

class PrioritySeverityAgent:
    def __init__(self):
        self.agent_id = "AGENT-04"
        self.agent_name = "Priority & Severity Agent"

    def score(self, extracted: ExtractedIssueData, location: ResolvedLocationData, weather: str = "Clear") -> Tuple[PrioritySeverityData, AgentExecutionTrace]:
        start_time = time.time()
        reasoning_log = []
        reasoning_log.append(f"Evaluating risk profile for '{extracted.issue_type}' in Ward '{location.ward_id}'")

        # 1. Base Hazard Score
        base_hazard = BASE_HAZARD_SCORES.get(extracted.issue_type, 40)
        reasoning_log.append(f"Base hazard baseline: {base_hazard}/100")

        # 2. Population Density Modifier (-5 to +10)
        ward_info = CITY_WARDS.get(location.ward_id, {})
        population = ward_info.get("population", 150000)
        if population > 200000:
            pop_mod = 8
            reasoning_log.append(f"High population density ({population:,} residents): +8 modifier")
        elif population > 160000:
            pop_mod = 5
            reasoning_log.append(f"Moderate-high population ({population:,} residents): +5 modifier")
        else:
            pop_mod = 0
            reasoning_log.append(f"Standard population density ({population:,} residents): +0 modifier")

        # 3. Urgency and Hazard Bonus
        urgency_bonus = 0
        if extracted.has_safety_hazard:
            urgency_bonus += 18
            reasoning_log.append("Safety Hazard Trigger: Active human injury / structural risk (+18)")
        if extracted.has_health_hazard:
            urgency_bonus += 12
            reasoning_log.append("Health Hazard Trigger: Disease vector / contamination risk (+12)")
        if extracted.has_traffic_impact:
            urgency_bonus += 8
            reasoning_log.append("Transit Gridlock Trigger: Road/commuter artery impact (+8)")

        # Additional bonus for duration
        for s in extracted.urgency_signals:
            if "Prolonged" in s:
                urgency_bonus += 7
                reasoning_log.append("Prolonged Unresolved Grievance bonus (+7)")

        # 4. Weather / Environmental Multiplier
        weather_multiplier = 1.0
        weather_clean = weather.lower()
        if "rain" in weather_clean or "monsoon" in weather_clean:
            if extracted.category.value in ["water_sewerage", "roads_infrastructure", "electrical_power"]:
                weather_multiplier = 1.20
                reasoning_log.append(f"Adverse Weather Impact ({weather}): Heavy rainfall elevates hazard multiplier to 1.20x")
        elif "heat" in weather_clean:
            if extracted.category.value in ["solid_waste", "public_health"]:
                weather_multiplier = 1.15
                reasoning_log.append(f"Extreme Heat ({weather}): Accelerates waste decomposition/epidemics to 1.15x")

        # Calculate raw and capped score
        raw_score = (base_hazard + pop_mod + urgency_bonus) * weather_multiplier
        final_score = min(100, max(10, int(round(raw_score))))

        # Determine Priority Enum
        if final_score >= 80:
            priority = PriorityLevel.CRITICAL
        elif final_score >= 60:
            priority = PriorityLevel.HIGH
        elif final_score >= 40:
            priority = PriorityLevel.MEDIUM
        else:
            priority = PriorityLevel.LOW

        reasoning_log.append(f"Final Computed Severity Score: {final_score}/100 -> Priority Tier: {priority.value}")

        justification = (
            f"Severity score {final_score}/100 assigned [{priority.value}]. "
            f"Base risk: {base_hazard}, Footfall density: +{pop_mod}, "
            f"Urgency hazards: +{urgency_bonus}, Weather factor: {weather_multiplier}x."
        )

        priority_data = PrioritySeverityData(
            severity_score=final_score,
            priority=priority,
            base_hazard=base_hazard,
            population_density_modifier=pop_mod,
            weather_multiplier=weather_multiplier,
            urgency_bonus=urgency_bonus,
            justification=justification
        )

        duration = round((time.time() - start_time) * 1000, 2)
        trace = AgentExecutionTrace(
            agent_id=self.agent_id,
            agent_name=self.agent_name,
            duration_ms=duration,
            timestamp=datetime.now().isoformat(),
            input_summary=f"Issue: {extracted.issue_type} | Hazards: {len(extracted.urgency_signals)} | Weather: {weather}",
            output_summary=f"Score: {final_score}/100 | Tier: {priority.value}",
            reasoning_log=reasoning_log,
            metadata={"severity_score": final_score, "priority": priority.value}
        )

        return priority_data, trace
