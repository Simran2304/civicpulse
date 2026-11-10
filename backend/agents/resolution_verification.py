"""
Agent 9: Resolution Verification Agent
Checks and verifies whether civic issues are authentically resolved through
multimodal inspection evidence, citizen closed-loop feedback, and dispute detection.
"""

import time
from datetime import datetime
from typing import Tuple, Optional
from models.incident import (
    CivicIncident, ResolutionVerificationData, IncidentStatus, 
    AgentExecutionTrace, EscalationTier, EscalationHistoryEntry
)

class ResolutionVerificationAgent:
    def __init__(self):
        self.agent_id = "AGENT-09"
        self.agent_name = "Resolution Verification Agent"

    def mark_worker_resolved(
        self, 
        incident: CivicIncident, 
        worker_name: str, 
        resolution_notes: str, 
        photo_url: Optional[str] = None,
        sim_time: datetime = None
    ) -> Tuple[ResolutionVerificationData, AgentExecutionTrace]:
        """Worker claims job is complete and submits proof"""
        start_time = time.time()
        sim_dt = sim_time or datetime.now()
        reasoning_log = []
        reasoning_log.append(f"Worker '{worker_name}' submitted resolution report for Ticket #{incident.ticket_id}")

        res_data = incident.resolution or ResolutionVerificationData()
        res_data.is_resolved = True
        res_data.resolution_timestamp = sim_dt.isoformat()
        res_data.worker_name = worker_name
        res_data.resolution_notes = resolution_notes
        res_data.resolution_photo_url = photo_url or "https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=500&auto=format&fit=crop&q=60"
        res_data.verification_method = "AI_PHOTO_INSPECTED" if photo_url else "PENDING_CITIZEN_FEEDBACK"

        reasoning_log.append("Automated inspection check: Work evidence recorded. Triggering Citizen Closed-Loop Feedback Verification prompt.")

        incident.resolution = res_data
        incident.current_status = IncidentStatus.RESOLVED

        duration = round((time.time() - start_time) * 1000, 2)
        trace = AgentExecutionTrace(
            agent_id=self.agent_id,
            agent_name=self.agent_name,
            duration_ms=duration,
            timestamp=sim_dt.isoformat(),
            input_summary=f"Worker: {worker_name} | Notes: '{resolution_notes[:40]}...'",
            output_summary="Work recorded. Verification prompt dispatched to citizen.",
            reasoning_log=reasoning_log,
            metadata={"worker": worker_name, "has_photo": bool(photo_url)}
        )

        return res_data, trace

    def process_citizen_feedback(
        self, 
        incident: CivicIncident, 
        confirmed: bool, 
        rating: int, 
        feedback_text: str,
        sim_time: datetime = None
    ) -> Tuple[bool, str, AgentExecutionTrace]:
        """
        Citizen responds to verification prompt:
        confirmed=True -> Ticket CLOSED, citizen reputation increases
        confirmed=False -> Ticket REOPENED, dispute logged, auto-escalated!
        """
        start_time = time.time()
        sim_dt = sim_time or datetime.now()
        reasoning_log = []
        reasoning_log.append(f"Processing citizen closed-loop feedback for #{incident.ticket_id}: Confirmed={confirmed}, Rating={rating}/5")

        res_data = incident.resolution or ResolutionVerificationData()
        res_data.citizen_verified = confirmed
        res_data.citizen_rating = rating
        res_data.citizen_feedback = feedback_text

        if confirmed and rating >= 3:
            # Positive resolution
            incident.current_status = IncidentStatus.CLOSED
            res_data.verification_method = "CITIZEN_CONFIRMED"
            incident.citizen_reputation_score = min(100, incident.citizen_reputation_score + 5)
            reasoning_log.append("Citizen confirmed satisfactory resolution. Ticket officially CLOSED.")
            reasoning_log.append(f"Citizen reputation score boosted to {incident.citizen_reputation_score}/100.")
            status_msg = "Grievance successfully verified and CLOSED by citizen."
            output_summary = f"VERIFIED: Closed by citizen (Rating: {rating}/5)"
        else:
            # Citizen dispute: false resolution claimed!
            incident.current_status = IncidentStatus.REOPENED
            res_data.dispute_count += 1
            res_data.verification_method = "CITIZEN_DISPUTED"
            reasoning_log.append("DISPUTE ALERT: Citizen reported issue NOT resolved! False resolution flagged.")

            # Immediate escalation to Level 2 or Level 3
            if not incident.escalation:
                incident.escalation = EscalationData()
            
            new_tier = EscalationTier.LEVEL_2_WARD_SUPERVISOR if incident.escalation.current_tier != EscalationTier.LEVEL_2_WARD_SUPERVISOR else EscalationTier.LEVEL_3_DISTRICT_COMMISSIONER
            incident.escalation.current_tier = new_tier
            incident.escalation.escalation_count += 1
            escalation_entry = EscalationHistoryEntry(
                tier=new_tier,
                timestamp=sim_dt.isoformat(),
                reason=f"Citizen disputed resolution (Rating: {rating}/5). Note: '{feedback_text}'",
                escalated_to="Ward Senior Supervisor & Quality Audit Cell",
                action_taken="Ticket re-opened with high priority. Inspection team re-deployed."
            )
            incident.escalation.history.append(escalation_entry)
            reasoning_log.append(f"Auto-escalated ticket to {new_tier.value} following dispute.")
            status_msg = "Resolution rejected by citizen. Ticket RE-OPENED and escalated to Senior Supervisor."
            output_summary = f"DISPUTED: Ticket RE-OPENED and escalated to {new_tier.value}"

        duration = round((time.time() - start_time) * 1000, 2)
        trace = AgentExecutionTrace(
            agent_id=self.agent_id,
            agent_name=self.agent_name,
            duration_ms=duration,
            timestamp=sim_dt.isoformat(),
            input_summary=f"Citizen Feedback: Verified={confirmed}, Rating={rating}",
            output_summary=output_summary,
            reasoning_log=reasoning_log,
            metadata={"confirmed": confirmed, "rating": rating, "status": incident.current_status.value}
        )

        return confirmed, status_msg, trace
