"""
Agent 7: Multi-Tier Escalation Agent
Detects SLA breaches, operational stalls, and high-hazard thresholds to 
escalate unresolved grievances through municipal command hierarchies.
"""

import time
from datetime import datetime
from typing import Tuple, Optional
from models.incident import (
    CivicIncident, EscalationData, EscalationTier, 
    EscalationHistoryEntry, AgentExecutionTrace, PriorityLevel, IncidentStatus
)

class EscalationAgent:
    def __init__(self):
        self.agent_id = "AGENT-07"
        self.agent_name = "Multi-Tier Escalation Agent"

    def evaluate_escalation(self, incident: CivicIncident, current_sim_time: datetime = None) -> Tuple[bool, Optional[EscalationHistoryEntry], AgentExecutionTrace]:
        """
        Evaluates whether an incident requires tier advancement.
        Returns: (did_escalate, new_history_entry, trace)
        """
        start_time = time.time()
        sim_time = current_sim_time or datetime.now()
        reasoning_log = []
        reasoning_log.append(f"Checking escalation triggers for Ticket #{incident.ticket_id} (Status: {incident.current_status.value})")

        # Skip resolved or closed incidents
        if incident.current_status in [IncidentStatus.RESOLVED, IncidentStatus.CLOSED]:
            trace = AgentExecutionTrace(
                agent_id=self.agent_id,
                agent_name=self.agent_name,
                duration_ms=round((time.time() - start_time) * 1000, 2),
                timestamp=sim_time.isoformat(),
                input_summary=f"Ticket #{incident.ticket_id} ({incident.current_status.value})",
                output_summary="No escalation: Ticket resolved/closed",
                reasoning_log=["Ticket already resolved. No escalation needed."]
            )
            return False, None, trace

        if not incident.escalation:
            incident.escalation = EscalationData()
        escalation_data = incident.escalation
        current_tier = escalation_data.current_tier
        sla = incident.sla
        priority = incident.priority

        new_tier = current_tier
        reason = ""
        escalated_to = ""
        action_taken = ""

        # Check Level 3: SLA Breached or multiple disputes
        if sla and sla.is_breached and current_tier != EscalationTier.LEVEL_3_DISTRICT_COMMISSIONER:
            new_tier = EscalationTier.LEVEL_3_DISTRICT_COMMISSIONER
            reason = f"CRITICAL BREACH: SLA deadline exceeded ({sla.countdown_text}). Municipal accountability trigger activated."
            escalated_to = "District Municipal Commissioner & Rapid Urban Taskforce"
            action_taken = "Automated high-priority red alert issued. Field supervisor summoned for emergency hearing."
            reasoning_log.append(f"SLA Breach detected! Escalating directly to Tier 3: {escalated_to}")

        # Check Level 2: SLA Imminent Breach (<25% time left) or Critical Priority unassigned
        elif sla and (sla.breach_risk_level == "IMMINENT" or (priority and priority.priority == PriorityLevel.CRITICAL)) and current_tier == EscalationTier.NONE:
            new_tier = EscalationTier.LEVEL_2_WARD_SUPERVISOR
            reason = f"IMMINENT RISK: High severity civic hazard ({priority.severity_score}/100) requires supervisory oversight."
            escalated_to = f"Ward Executive Engineer ({incident.location.ward_name if incident.location else 'Zonal Supervisor'})"
            action_taken = "Dispatched priority SMS/radio notification to Zonal Duty Officer. Crew priority re-sequenced."
            reasoning_log.append(f"Imminent breach or critical priority. Escalating to Tier 2: {escalated_to}")

        # Check Level 1: Default initial assignment if not yet set
        elif current_tier == EscalationTier.NONE:
            new_tier = EscalationTier.LEVEL_1_FIELD_CREW
            reason = "Initial intake dispatch to field crew"
            escalated_to = f"{incident.routing.assigned_division if incident.routing else 'Field Crew Squad'}"
            action_taken = "Standard work order generated and queued in field worker tablet app."
            reasoning_log.append(f"Standard Level 1 assignment: {escalated_to}")

        did_escalate = (new_tier != current_tier)

        history_entry = None
        if did_escalate:
            history_entry = EscalationHistoryEntry(
                tier=new_tier,
                timestamp=sim_time.isoformat(),
                reason=reason,
                escalated_to=escalated_to,
                action_taken=action_taken
            )
            escalation_data.current_tier = new_tier
            escalation_data.escalated_to = escalated_to
            escalation_data.escalation_count += 1
            escalation_data.last_escalation_time = sim_time.isoformat()
            escalation_data.history.append(history_entry)
            output_summary = f"ESCALATED to {new_tier.value} -> {escalated_to}"
        else:
            output_summary = f"Status Quo: Maintained at {current_tier.value}"
            reasoning_log.append(f"No threshold reached. Incident remains at {current_tier.value}.")

        duration = round((time.time() - start_time) * 1000, 2)
        trace = AgentExecutionTrace(
            agent_id=self.agent_id,
            agent_name=self.agent_name,
            duration_ms=duration,
            timestamp=sim_time.isoformat(),
            input_summary=f"Tier: {current_tier.value} | Risk: {sla.breach_risk_level if sla else 'N/A'}",
            output_summary=output_summary,
            reasoning_log=reasoning_log,
            metadata={"did_escalate": did_escalate, "new_tier": new_tier.value}
        )

        return did_escalate, history_entry, trace
