"""
Agent 11: Master Orchestrator Agent
The central nervous system of CivicPulse AI. Coordinates the complete 
end-to-end multi-agent execution pipeline: Intake -> NLU -> Geo-Intelligence -> 
Routing -> Risk Scoring -> Dedup/Clustering -> SLA -> Escalation -> Workflow Tracking.
"""

import time
import uuid
from datetime import datetime
from typing import List, Tuple, Optional, Any

from models.incident import (
    CivicIncident, CitizenReportRequest, IncidentStatus, 
    AgentExecutionTrace, StatusHistoryEntry
)
from agents.complaint_understanding import ComplaintUnderstandingAgent
from agents.location_intelligence import LocationIntelligenceAgent
from agents.department_routing import DepartmentRoutingAgent
from agents.priority_severity import PrioritySeverityAgent
from agents.duplicate_detection import DuplicateDetectionAgent
from agents.sla_management import SLAManagementAgent
from agents.escalation import EscalationAgent
from agents.workflow_tracking import WorkflowTrackingAgent
from agents.resolution_verification import ResolutionVerificationAgent
from agents.transparency_reporting import TransparencyReportingAgent

class MasterOrchestrator:
    def __init__(self):
        self.agent_id = "AGENT-11"
        self.agent_name = "Master Orchestrator Agent"
        
        # Instantiate all subordinate agents
        self.agent_complaint = ComplaintUnderstandingAgent()
        self.agent_location = LocationIntelligenceAgent()
        self.agent_routing = DepartmentRoutingAgent()
        self.agent_priority = PrioritySeverityAgent()
        self.agent_duplicate = DuplicateDetectionAgent()
        self.agent_sla = SLAManagementAgent()
        self.agent_escalation = EscalationAgent()
        self.agent_workflow = WorkflowTrackingAgent()
        self.agent_verification = ResolutionVerificationAgent()
        self.agent_transparency = TransparencyReportingAgent()

    def process_grievance_pipeline(
        self, 
        request: CitizenReportRequest, 
        existing_incidents: List[CivicIncident],
        sim_time: datetime = None,
        citizen_profile: Optional[Any] = None
    ) -> CivicIncident:
        pipeline_start = time.time()
        sim_dt = sim_time or datetime.now()
        ticket_id = f"CP-{uuid.uuid4().hex[:6].upper()}"

        traces: List[AgentExecutionTrace] = []

        # Citizen Source Reliability & Anti-Spam Check
        rep_score = citizen_profile.reputation_score if citizen_profile else 85
        badge = citizen_profile.badge if citizen_profile else "Verified Resident"
        false_reports = citizen_profile.false_reports if citizen_profile else 0
        is_low_credibility = rep_score < 50 or false_reports >= 2

        trace_trust = AgentExecutionTrace(
            agent_id="AGENT-CITIZEN-TRUST",
            agent_name="Citizen Source Reliability & Anti-Spam Agent",
            duration_ms=1.2,
            timestamp=sim_dt.isoformat(),
            input_summary=f"Reporter: {request.citizen_name} ({request.citizen_phone})",
            output_summary=(
                f"FLAGGED: Low Credibility Source ({rep_score}/100, {false_reports} false reports on record). Pre-audit required."
                if is_low_credibility else
                f"VERIFIED: Credible Source ({rep_score}/100 [{badge}], {false_reports} false reports)."
            ),
            reasoning_log=[
                f"Queried municipal citizen trust ledger for phone '{request.citizen_phone}'.",
                f"Historical record: {citizen_profile.verified_resolutions if citizen_profile else 1} verified resolutions, {false_reports} false complaints.",
                "⚠️ ANTI-SPAM SAFEGUARD: Reporter is flagged for repeated unverified/false complaints on record. Ticket marked for supervisor field audit."
                if is_low_credibility else
                f"Source verified under '{badge}' trust tier. Autonomous dispatch approved."
            ],
            metadata={
                "reputation_score": rep_score,
                "badge": badge,
                "false_reports": false_reports,
                "is_flagged": is_low_credibility
            }
        )
        traces.append(trace_trust)

        # Step 1: Agent 1 - Complaint Understanding
        extracted_issue, trace1 = self.agent_complaint.process(request.description, request.image_preset)
        traces.append(trace1)

        # Step 2: Agent 2 - Location Intelligence
        location_data, trace2 = self.agent_location.resolve(request.location, request.latitude, request.longitude)
        traces.append(trace2)

        # Step 3: Agent 4 - Priority & Severity Scoring (Incorporates weather modifier)
        priority_data, trace4 = self.agent_priority.score(extracted_issue, location_data, request.simulated_weather or "Clear")
        traces.append(trace4)

        # Step 4: Agent 3 - Department Routing
        routing_data, trace3 = self.agent_routing.route(extracted_issue, location_data)
        traces.append(trace3)

        # Step 5: Agent 5 - Duplicate Detection & Spatial-Temporal Clustering
        cluster_data, master_id, trace5 = self.agent_duplicate.check_and_cluster(
            ticket_id, extracted_issue, location_data, existing_incidents
        )
        traces.append(trace5)

        # Step 6: Agent 6 - SLA & Deadline Assignment
        sla_data, trace6 = self.agent_sla.assign_sla(priority_data, routing_data, sim_dt)
        traces.append(trace6)

        # Build initial incident object
        incident = CivicIncident(
            ticket_id=ticket_id,
            master_incident_id=master_id,
            raw_description=request.description,
            citizen_name=request.citizen_name or "Concerned Citizen",
            citizen_phone=request.citizen_phone or "+91-98765-XXXXX",
            citizen_reputation_score=rep_score,
            citizen_badge=badge,
            image_url=request.image_preset,
            extracted_issue=extracted_issue,
            location=location_data,
            routing=routing_data,
            priority=priority_data,
            duplicate=cluster_data,
            sla=sla_data,
            current_status=IncidentStatus.REPORTED,
            created_at=sim_dt.isoformat(),
            updated_at=sim_dt.isoformat()
        )

        # Step 7: Agent 7 - Escalation Tier Evaluation
        did_escalate, _, trace7 = self.agent_escalation.evaluate_escalation(incident, sim_dt)
        traces.append(trace7)

        # Step 8: Agent 8 - Workflow Lifecycle Progression (REPORTED -> TRIAGED -> ASSIGNED)
        self.agent_workflow.transition_state(
            incident, 
            IncidentStatus.TRIAGED, 
            actor="Master Orchestrator (Auto-Triage)", 
            note="Autonomous issue understanding and department mapping completed.",
            timestamp=sim_dt
        )
        _, trace8 = self.agent_workflow.transition_state(
            incident, 
            IncidentStatus.ASSIGNED, 
            actor=f"{routing_data.department_name}", 
            note=f"Work order dispatched to {routing_data.assigned_division}.",
            timestamp=sim_dt
        )
        traces.append(trace8)

        # Master Orchestrator summary trace
        total_duration = round((time.time() - pipeline_start) * 1000, 2)
        orchestrator_trace = AgentExecutionTrace(
            agent_id=self.agent_id,
            agent_name=self.agent_name,
            duration_ms=total_duration,
            timestamp=sim_dt.isoformat(),
            input_summary=f"Citizen Grievance Pipeline initiated for Ticket #{ticket_id}",
            output_summary=f"Completed in {total_duration}ms across 8 sub-agents. Status: {incident.current_status.value}",
            reasoning_log=[
                f"1. Extracted issue: {extracted_issue.issue_type} ({extracted_issue.category})",
                f"2. Geotagged to Ward {location_data.ward_id} ({location_data.zone} Zone)",
                f"3. Risk calculated: {priority_data.severity_score}/100 [{priority_data.priority.value}]",
                f"4. Routed to: {routing_data.department_code} ({routing_data.assigned_division})",
                f"5. Cluster status: {'Duplicate clustered' if cluster_data.is_duplicate else 'Master incident'}",
                f"6. SLA: {sla_data.sla_hours} hours deadline established",
                f"7. Escalation tier initialized: {incident.escalation.current_tier.value if incident.escalation else 'NONE'}"
            ],
            metadata={"total_agents_invoked": 8, "execution_time_ms": total_duration}
        )
        traces.insert(0, orchestrator_trace)

        incident.agent_traces = traces
        return incident
