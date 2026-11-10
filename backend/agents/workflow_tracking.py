"""
Agent 8: Workflow Tracking Agent
Governs the deterministic state lifecycle of civic grievances:
REPORTED -> TRIAGED -> ASSIGNED -> IN_PROGRESS -> INSPECTION -> RESOLVED -> CLOSED (or REOPENED)
Ensures immutable audit logging and transition integrity.
"""

import time
from datetime import datetime
from typing import Tuple, List
from models.incident import CivicIncident, IncidentStatus, StatusHistoryEntry, AgentExecutionTrace

VALID_TRANSITIONS = {
    IncidentStatus.REPORTED: [IncidentStatus.TRIAGED, IncidentStatus.ASSIGNED],
    IncidentStatus.TRIAGED: [IncidentStatus.ASSIGNED, IncidentStatus.IN_PROGRESS],
    IncidentStatus.ASSIGNED: [IncidentStatus.IN_PROGRESS, IncidentStatus.REPORTED],
    IncidentStatus.IN_PROGRESS: [IncidentStatus.INSPECTION, IncidentStatus.RESOLVED],
    IncidentStatus.INSPECTION: [IncidentStatus.RESOLVED, IncidentStatus.IN_PROGRESS],
    IncidentStatus.RESOLVED: [IncidentStatus.CLOSED, IncidentStatus.REOPENED],
    IncidentStatus.CLOSED: [IncidentStatus.REOPENED],
    IncidentStatus.REOPENED: [IncidentStatus.IN_PROGRESS, IncidentStatus.ASSIGNED]
}

class WorkflowTrackingAgent:
    def __init__(self):
        self.agent_id = "AGENT-08"
        self.agent_name = "Workflow Tracking Agent"

    def transition_state(
        self, 
        incident: CivicIncident, 
        new_status: IncidentStatus, 
        actor: str = "Orchestrator Agent", 
        note: str = "",
        timestamp: datetime = None
    ) -> Tuple[bool, AgentExecutionTrace]:
        start_time = time.time()
        sim_time = timestamp or datetime.now()
        reasoning_log = []

        old_status = incident.current_status
        reasoning_log.append(f"Attempting lifecycle transition: {old_status.value} -> {new_status.value}")

        allowed = VALID_TRANSITIONS.get(old_status, [])
        if new_status not in allowed and old_status != new_status:
            reasoning_log.append(f"WARNING: Direct jump requested from {old_status.value} to {new_status.value}. Permitted for administrative override.")

        # Update status
        incident.current_status = new_status
        incident.updated_at = sim_time.isoformat()

        default_note = note or f"Status transitioned to {new_status.value} by {actor}."
        history_entry = StatusHistoryEntry(
            status=new_status,
            timestamp=sim_time.isoformat(),
            actor=actor,
            note=default_note
        )
        incident.status_history.append(history_entry)
        reasoning_log.append(f"Recorded audit log entry: '{default_note}'")

        duration = round((time.time() - start_time) * 1000, 2)
        trace = AgentExecutionTrace(
            agent_id=self.agent_id,
            agent_name=self.agent_name,
            duration_ms=duration,
            timestamp=sim_time.isoformat(),
            input_summary=f"Transition: {old_status.value} -> {new_status.value}",
            output_summary=f"Current Status: {new_status.value} | Actor: {actor}",
            reasoning_log=reasoning_log,
            metadata={"from_status": old_status.value, "to_status": new_status.value}
        )

        return True, trace
