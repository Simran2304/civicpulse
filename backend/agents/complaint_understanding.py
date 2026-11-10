"""
Agent 1: Complaint Understanding Agent
Extracts structured issue from citizen text, detects urgency signals, 
and processes multimodal civic image indicators.
"""

import time
import re
from datetime import datetime
from typing import Tuple, Dict, Any, List
from models.incident import ExtractedIssueData, IssueCategory, AgentExecutionTrace

class ComplaintUnderstandingAgent:
    def __init__(self):
        self.agent_id = "AGENT-01"
        self.agent_name = "Complaint Understanding Agent"

    def process(self, text: str, image_preset: str = None) -> Tuple[ExtractedIssueData, AgentExecutionTrace]:
        start_time = time.time()
        reasoning_log = []
        reasoning_log.append(f"Analyzing incoming citizen grievance: '{text[:60]}...'")

        clean_text = text.lower()
        urgency_signals = []
        detected_keywords = []

        # 1. Detect Category and Issue Type
        issue_type = "general_civic_issue"
        category = IssueCategory.GENERAL
        
        # Taxonomy rule matching
        if any(w in clean_text for w in ["garbage", "trash", "waste", "dump", "debris", "dirt", "litter", "rubbish", "sweeper"]):
            category = IssueCategory.SOLID_WASTE
            issue_type = "garbage_dump"
            detected_keywords.append("solid_waste")
            reasoning_log.append("Pattern match: Solid Waste & Sanitation keywords detected.")
        elif any(w in clean_text for w in ["pothole", "crater", "road broken", "damaged road", "cave-in", "footpath", "divider", "pavement"]):
            category = IssueCategory.ROADS_INFRASTRUCTURE
            issue_type = "road_pothole"
            detected_keywords.append("road_damage")
            reasoning_log.append("Pattern match: Road Infrastructure damage detected.")
        elif any(w in clean_text for w in ["manhole", "open sewer", "gutter open", "cover missing", "open drain"]):
            category = IssueCategory.ROADS_INFRASTRUCTURE
            issue_type = "open_manhole"
            detected_keywords.append("open_manhole_hazard")
            reasoning_log.append("Critical Hazard match: Open manhole/drain detected.")
        elif any(w in clean_text for w in ["water leak", "pipeline", "pipe burst", "no water", "dirty water", "sewage", "drainage", "waterlogging", "flooding"]):
            category = IssueCategory.WATER_SEWERAGE
            if "sewage" in clean_text or "drain" in clean_text or "overflow" in clean_text:
                issue_type = "sewage_overflow"
            elif "burst" in clean_text or "heavy leak" in clean_text:
                issue_type = "burst_pipeline"
            else:
                issue_type = "water_leakage"
            detected_keywords.append("water_sewerage")
            reasoning_log.append("Pattern match: Water Supply / Sewerage anomaly detected.")
        elif any(w in clean_text for w in ["streetlight", "street light", "wire", "cable", "transformer", "spark", "electric shock", "blackout", "pole"]):
            category = IssueCategory.ELECTRICAL_POWER
            if "spark" in clean_text or "transformer" in clean_text:
                issue_type = "transformer_sparking"
            elif "wire" in clean_text or "hanging" in clean_text:
                issue_type = "hanging_wire"
            else:
                issue_type = "broken_streetlight"
            detected_keywords.append("electrical_hazard")
            reasoning_log.append("Pattern match: Electrical / Streetlight infrastructure issue detected.")
        elif any(w in clean_text for w in ["traffic light", "signal", "traffic jam", "congestion", "signboard", "zebra crossing"]):
            category = IssueCategory.TRAFFIC_MOBILITY
            issue_type = "broken_traffic_signal"
            detected_keywords.append("traffic_hazard")
            reasoning_log.append("Pattern match: Traffic & Urban Mobility obstruction detected.")
        elif any(w in clean_text for w in ["mosquito", "dengue", "malaria", "stagnant water", "foul smell", "epidemic"]):
            category = IssueCategory.PUBLIC_HEALTH
            issue_type = "stagnant_water_mosquitoes"
            detected_keywords.append("health_hazard")
            reasoning_log.append("Pattern match: Public Health / Vector Control vector detected.")

        # 2. Urgency and Hazard Signal Extraction
        has_safety = False
        has_health = False
        has_traffic = False

        if any(w in clean_text for w in ["accident", "danger", "injur", "death", "hazard", "fall", "shock", "collapse", "risk to life", "manhole"]):
            has_safety = True
            urgency_signals.append("Public Safety Risk: High danger of physical accident or electrocution")
            reasoning_log.append("Urgency Flag: Public Safety Risk detected.")

        if any(w in clean_text for w in ["stink", "smell", "disease", "health", "hospital", "dengue", "rats", "contamination", "toxic", "days"]):
            has_health = True
            urgency_signals.append("Public Health Hazard: Vector breeding or contamination potential")
            reasoning_log.append("Urgency Flag: Public Health Hazard detected.")

        if any(w in clean_text for w in ["traffic", "jam", "main road", "highway", "blocked", "bus", "commute", "junction"]):
            has_traffic = True
            urgency_signals.append("Transit Impact: Arterial road obstruction or commuter delay")
            reasoning_log.append("Urgency Flag: Transit & Traffic Impact detected.")

        # Check for duration / temporal urgency indicators
        days_match = re.search(r'(\d+)\s*(days|weeks|months)', clean_text)
        if days_match:
            days_count = int(days_match.group(1))
            if days_count >= 3:
                urgency_signals.append(f"Prolonged Civic Neglect: Issue persisting for {days_count} days")
                reasoning_log.append(f"Temporal analysis: Recurring complaint spanning {days_count} days.")

        # 3. Multimodal Image Analysis Fusion (if image preset provided)
        visual_features = None
        if image_preset:
            reasoning_log.append(f"Visual AI Input: Analyzing civic image stream '{image_preset}'")
            if "pothole" in image_preset.lower():
                category = IssueCategory.ROADS_INFRASTRUCTURE
                issue_type = "road_pothole"
                visual_features = {"surface_damage_m2": 2.4, "depth_cm": 14, "confidence": 0.96, "label": "Severe asphalt depression / pothole"}
                has_safety = True
            elif "garbage" in image_preset.lower() or "trash" in image_preset.lower():
                category = IssueCategory.SOLID_WASTE
                issue_type = "garbage_dump"
                visual_features = {"waste_volume_m3": 4.8, "organic_waste": True, "confidence": 0.94, "label": "Municipal solid waste dump overflow"}
                has_health = True
            elif "manhole" in image_preset.lower():
                category = IssueCategory.ROADS_INFRASTRUCTURE
                issue_type = "open_manhole"
                visual_features = {"cover_missing": True, "diameter_m": 0.8, "confidence": 0.98, "label": "Uncovered drainage manhole"}
                has_safety = True
            elif "water" in image_preset.lower() or "leak" in image_preset.lower():
                category = IssueCategory.WATER_SEWERAGE
                issue_type = "water_leakage"
                visual_features = {"surface_water_spread_m2": 18.0, "pipeline_rupture": True, "confidence": 0.93, "label": "Pressurized potable water pipe breach"}

        # 4. Generate Structured Summary
        clean_issue_title = issue_type.replace("_", " ").title()
        summary = f"{clean_issue_title} reported. {len(urgency_signals)} critical civic factors identified."

        extracted = ExtractedIssueData(
            issue_type=issue_type,
            category=category,
            summary=summary,
            urgency_signals=urgency_signals,
            detected_keywords=detected_keywords,
            sentiment="urgent" if (has_safety or has_health) else "frustrated",
            has_safety_hazard=has_safety,
            has_health_hazard=has_health,
            has_traffic_impact=has_traffic,
            visual_features=visual_features
        )

        duration = round((time.time() - start_time) * 1000, 2)
        trace = AgentExecutionTrace(
            agent_id=self.agent_id,
            agent_name=self.agent_name,
            duration_ms=duration,
            timestamp=datetime.now().isoformat(),
            input_summary=f"Citizen text ({len(text)} chars)",
            output_summary=f"Category: {category.value} | Issue: {issue_type} | Hazards: S={has_safety}, H={has_health}, T={has_traffic}",
            reasoning_log=reasoning_log,
            metadata={"keywords": detected_keywords, "urgency_count": len(urgency_signals)}
        )

        return extracted, trace
