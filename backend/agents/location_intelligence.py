"""
Agent 2: Location Intelligence Agent
Converts vague location descriptions (e.g. "Near temple, Sector 9") into 
actionable geo-tagged GIS data, ward mapping, and administrative jurisdictions.
"""

import time
import math
import random
from datetime import datetime
from typing import Tuple, Optional
from config import CITY_WARDS
from models.incident import ResolvedLocationData, AgentExecutionTrace

class LocationIntelligenceAgent:
    def __init__(self):
        self.agent_id = "AGENT-02"
        self.agent_name = "Location Intelligence Agent"

    def _haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371.0 # Earth radius in km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (math.sin(dlat / 2) ** 2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    def resolve(self, raw_location: str, manual_lat: Optional[float] = None, manual_lng: Optional[float] = None) -> Tuple[ResolvedLocationData, AgentExecutionTrace]:
        start_time = time.time()
        reasoning_log = []
        reasoning_log.append(f"Parsing raw citizen location query: '{raw_location}'")

        text_lower = raw_location.lower()
        selected_ward = None
        landmark = None

        # 1. Landmark & Keyword Spatial Matching
        if any(k in text_lower for k in ["sector 14", "north market", "old market", "subzi mandi"]):
            selected_ward = CITY_WARDS["WARD-02"]
            landmark = "Sector 14 Commercial Market Complex"
            reasoning_log.append("Entity resolution: Matched 'Sector 14' to Ward-02 (North Zone).")
        elif any(k in text_lower for k in ["sector 9", "tech park", "south extension", "cyber", "temple"]):
            selected_ward = CITY_WARDS["WARD-03"]
            landmark = "Sector 9 Hanuman Temple & Tech Corridor"
            reasoning_log.append("Entity resolution: Matched 'Sector 9 / Temple' to Ward-03 (South Zone).")
        elif any(k in text_lower for k in ["riverfront", "industrial", "east", "factory", "yamuna", "ghat"]):
            selected_ward = CITY_WARDS["WARD-04"]
            landmark = "East Industrial Riverfront Ring Road"
            reasoning_log.append("Entity resolution: Matched 'Riverfront/Industrial' to Ward-04 (East Zone).")
        elif any(k in text_lower for k in ["west lake", "sector 22", "lake residency", "block c", "west"]):
            selected_ward = CITY_WARDS["WARD-05"]
            landmark = "West Lake Sector 22 Residential Gate 4"
            reasoning_log.append("Entity resolution: Matched 'West Lake / Sector 22' to Ward-05 (West Zone).")
        elif any(k in text_lower for k in ["civil lines", "university", "campus", "hostel", "college"]):
            selected_ward = CITY_WARDS["WARD-06"]
            landmark = "Civil Lines University Enclave Road"
            reasoning_log.append("Entity resolution: Matched 'Civil Lines / University' to Ward-06 (North-West).")
        elif any(k in text_lower for k in ["metro terminal", "logistics hub", "transport", "bus stand", "depot"]):
            selected_ward = CITY_WARDS["WARD-07"]
            landmark = "South Metro Inter-State Terminal Pier 12"
            reasoning_log.append("Entity resolution: Matched 'Metro Terminal' to Ward-07 (South-West).")
        elif any(k in text_lower for k in ["hospital", "health village", "green meadows", "clinic", "dispensary"]):
            selected_ward = CITY_WARDS["WARD-08"]
            landmark = "City General Hospital & Health Village Lane"
            reasoning_log.append("Entity resolution: Matched 'Hospital/Health' to Ward-08 (East-South).")
        elif any(k in text_lower for k in ["connaught", "central", "main road", "secretariat", "palika", "center"]):
            selected_ward = CITY_WARDS["WARD-01"]
            landmark = "Central Administrative Avenue Plaza"
            reasoning_log.append("Entity resolution: Matched 'Central District' to Ward-01 (Central Zone).")

        # 2. GPS Fallback or Nearest Ward Resolution
        if manual_lat is not None and manual_lng is not None:
            reasoning_log.append(f"Device GPS coordinates provided: ({manual_lat:.4f}, {manual_lng:.4f})")
            best_dist = 99999.0
            best_w = list(CITY_WARDS.values())[0]
            for w in CITY_WARDS.values():
                d = self._haversine_distance(manual_lat, manual_lng, w["lat"], w["lng"])
                if d < best_dist:
                    best_dist = d
                    best_w = w
            selected_ward = best_w
            lat = manual_lat
            lng = manual_lng
            confidence = 0.98
            reasoning_log.append(f"GPS proximity check: Closest ward centroid is {selected_ward['name']} ({best_dist:.2f} km).")
        else:
            if not selected_ward:
                # Default to central ward with random small offset if completely unknown
                selected_ward = CITY_WARDS["WARD-01"]
                landmark = "General Urban Sector"
                reasoning_log.append("Vague location without exact landmark. Defaulting to Central Administrative Ward.")
            
            # Add small realistic spatial jitter (within 200m) around ward center
            jitter_lat = (random.random() - 0.5) * 0.004
            jitter_lng = (random.random() - 0.5) * 0.004
            lat = round(selected_ward["lat"] + jitter_lat, 6)
            lng = round(selected_ward["lng"] + jitter_lng, 6)
            confidence = 0.92

        resolved_address = f"{landmark or raw_location.title()}, {selected_ward['name']}, Zone: {selected_ward['zone']}"
        jurisdiction_office = f"Municipal Ward {selected_ward['id']} Zonal Office, {selected_ward['zone']} Division"

        resolved = ResolvedLocationData(
            raw_location=raw_location,
            resolved_address=resolved_address,
            ward_id=selected_ward["id"],
            ward_name=selected_ward["name"],
            zone=selected_ward["zone"],
            latitude=lat,
            longitude=lng,
            confidence_score=confidence,
            landmark_detected=landmark,
            jurisdiction_office=jurisdiction_office
        )

        duration = round((time.time() - start_time) * 1000, 2)
        trace = AgentExecutionTrace(
            agent_id=self.agent_id,
            agent_name=self.agent_name,
            duration_ms=duration,
            timestamp=datetime.now().isoformat(),
            input_summary=f"Raw text: '{raw_location}'",
            output_summary=f"Ward: {selected_ward['id']} ({selected_ward['name']}) | Lat/Lng: ({lat}, {lng}) | Conf: {confidence}",
            reasoning_log=reasoning_log,
            metadata={"ward_id": selected_ward["id"], "zone": selected_ward["zone"]}
        )

        return resolved, trace
