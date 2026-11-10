"""
Agent 5: Duplicate Detection & Incident Clustering Agent
Performs spatio-temporal clustering and semantic correlation to detect 
duplicate citizen reports and cluster them into a single Master Civic Incident.
"""

import time
import math
from datetime import datetime
from typing import Tuple, List, Optional
from config import DUPLICATE_RADIUS_METERS
from models.incident import ExtractedIssueData, ResolvedLocationData, DuplicateClusterData, CivicIncident, AgentExecutionTrace

class DuplicateDetectionAgent:
    def __init__(self):
        self.agent_id = "AGENT-05"
        self.agent_name = "Duplicate Detection Agent"

    def _haversine_meters(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371000.0 # meters
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (math.sin(dlat / 2) ** 2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    def check_and_cluster(
        self, 
        ticket_id: str,
        extracted: ExtractedIssueData, 
        location: ResolvedLocationData, 
        existing_incidents: List[CivicIncident]
    ) -> Tuple[DuplicateClusterData, Optional[str], AgentExecutionTrace]:
        """
        Returns:
            DuplicateClusterData,
            master_incident_id (if matched with an existing primary ticket),
            AgentExecutionTrace
        """
        start_time = time.time()
        reasoning_log = []
        reasoning_log.append(f"Scanning {len(existing_incidents)} existing active civic incidents for spatio-temporal overlap...")

        matched_incident = None
        closest_dist = float('inf')

        for inc in existing_incidents:
            # Skip closed or non-active tickets
            if inc.current_status in ["RESOLVED", "CLOSED"]:
                continue
            
            # Check issue category/type compatibility
            if not inc.extracted_issue or not inc.location:
                continue

            same_category = (inc.extracted_issue.category == extracted.category)
            same_issue = (inc.extracted_issue.issue_type == extracted.issue_type)

            if same_category or same_issue:
                dist = self._haversine_meters(
                    location.latitude, location.longitude,
                    inc.location.latitude, inc.location.longitude
                )

                if dist <= DUPLICATE_RADIUS_METERS:
                    if dist < closest_dist:
                        closest_dist = dist
                        matched_incident = inc

        if matched_incident:
            master_id = matched_incident.duplicate.cluster_id if (matched_incident.duplicate and matched_incident.duplicate.cluster_id) else matched_incident.ticket_id
            similarity = round(max(0.70, 1.0 - (closest_dist / DUPLICATE_RADIUS_METERS) * 0.3), 2)
            
            reasoning_log.append(
                f"Cluster Match Detected! Matches existing Incident #{master_id} "
                f"located {closest_dist:.1f}m away (Category: {matched_incident.extracted_issue.category})."
            )
            reasoning_log.append(f"Clustering with Master Incident #{master_id} to eliminate duplicate crew dispatch.")

            cluster_data = DuplicateClusterData(
                is_duplicate=True,
                cluster_id=master_id,
                is_primary_ticket=False,
                cluster_size=1, # Individual ticket representation
                similar_complaints=[master_id],
                similarity_score=similarity
            )
            target_master = master_id
            output_summary = f"DUPLICATE DETECTED: Clustered under #{master_id} ({closest_dist:.1f}m distance, Sim: {similarity})"
        else:
            reasoning_log.append("No active duplicate report found within spatial radius (350m). Registering as New Unique Master Civic Incident.")
            cluster_data = DuplicateClusterData(
                is_duplicate=False,
                cluster_id=ticket_id,
                is_primary_ticket=True,
                cluster_size=1,
                similar_complaints=[],
                similarity_score=1.0
            )
            target_master = None
            output_summary = f"UNIQUE INCIDENT: Registered as Master Incident #{ticket_id}"

        duration = round((time.time() - start_time) * 1000, 2)
        trace = AgentExecutionTrace(
            agent_id=self.agent_id,
            agent_name=self.agent_name,
            duration_ms=duration,
            timestamp=datetime.now().isoformat(),
            input_summary=f"Coords: ({location.latitude:.4f}, {location.longitude:.4f}) | Category: {extracted.category}",
            output_summary=output_summary,
            reasoning_log=reasoning_log,
            metadata={"is_duplicate": cluster_data.is_duplicate, "cluster_id": cluster_data.cluster_id}
        )

        return cluster_data, target_master, trace
