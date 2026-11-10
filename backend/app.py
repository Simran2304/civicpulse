"""
CivicPulse AI - FastAPI Urban Operations Control Center Backend
Smart City Grievance & Civic Issue Resolution System (PS-10)
"""

from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

from models.incident import (
    CivicIncident, CitizenReportRequest, IncidentStatus, PriorityLevel, IssueCategory
)
from database import CivicDatabase
from services.predictive_engine import PredictiveCivicEngine
from services.image_analysis import ImageAnalysisService
from config import CITY_WARDS, DEPARTMENTS, CITY_NAME

app = FastAPI(
    title="CivicPulse AI — Smart City Grievance & Urban Operations System",
    description="Multi-Agent Autonomous Civic Grievance & Operations Control Center",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global persistence instance
db = CivicDatabase()

class AdvanceTimeRequest(BaseModel):
    hours: float = 6.0

class WeatherChangeRequest(BaseModel):
    weather: str = "Monsoon Heavy Downpour"
    rainfall_mm: float = 45.0

class BulkSurgeRequest(BaseModel):
    scenario: str = "sector_14_garbage_surge"

class WorkerResolveRequest(BaseModel):
    worker_name: str = "Er. Dilip Kumar (Senior Field Tech)"
    resolution_notes: str = "Debris cleared, new ductile manhole cover seated securely and asphalt ring tamped."
    resolution_photo_url: Optional[str] = "https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=500&auto=format&fit=crop&q=60"

class CitizenVerifyRequest(BaseModel):
    confirmed: bool = True
    rating: int = 5
    feedback_text: str = "Grievance fixed quickly and satisfactorily by the municipal crew."

class StatusTransitionRequest(BaseModel):
    new_status: IncidentStatus
    actor: str = "City Operations Officer"
    note: str = "Administrative status transition update."

class FlagFalseRequest(BaseModel):
    officer_name: str = "Insp. Rakesh Sharma (Municipal Zonal Inspector)"
    reason: str = "Physical inspection conducted on site. No reported defect or hazard found. Verified as false/fabricated complaint."

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "city": CITY_NAME,
        "simulated_time": db.clock.get_formatted_time(),
        "is_realtime": db.clock.is_realtime(),
        "offset_hours": db.clock.get_offset_hours(),
        "weather": db.clock.weather,
        "active_incidents": len(db.incidents),
        "system_version": "1.0.0 (Multi-Agentic Core)"
    }

@app.get("/api/incidents")
def list_incidents(
    status: Optional[str] = None,
    ward_id: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None
):
    incidents = db.get_all_incidents()
    filtered = []

    for inc in incidents:
        if status and inc.current_status.value != status:
            continue
        if ward_id and (not inc.location or inc.location.ward_id != ward_id):
            continue
        if priority and (not inc.priority or inc.priority.priority.value != priority):
            continue
        if category and (not inc.extracted_issue or inc.extracted_issue.category.value != category):
            continue
        if search:
            query = search.lower()
            text_match = (
                query in inc.ticket_id.lower() or 
                query in inc.raw_description.lower() or 
                (inc.location and query in inc.location.resolved_address.lower()) or
                (inc.extracted_issue and query in inc.extracted_issue.summary.lower())
            )
            if not text_match:
                continue
        filtered.append(inc)

    return {
        "count": len(filtered),
        "total": len(incidents),
        "simulated_time": db.clock.get_formatted_time(),
        "incidents": filtered
    }

@app.get("/api/incidents/{ticket_id}")
def get_incident_detail(ticket_id: str):
    inc = db.get_incident(ticket_id)
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident #{ticket_id} not found")
    return inc

@app.post("/api/incidents")
def create_citizen_grievance(request: CitizenReportRequest):
    """
    Submits a new citizen complaint.
    Invokes the Master Orchestrator and 8+ specialized agents:
    Intake -> Geo-Intelligence -> Risk Scoring -> Department Routing ->
    DBSCAN Clustering -> SLA Assignment -> Escalation -> Workflow Tracking.
    """
    sim_time = db.clock.get_time()
    existing = list(db.incidents.values())
    citizen = db.get_citizen(request.citizen_phone) if request.citizen_phone else None
    
    # Process through multi-agent orchestrator
    incident = db.orchestrator.process_grievance_pipeline(request, existing, sim_time, citizen_profile=citizen)
    db.add_incident(incident)

    # Record citizen activity and log event
    if request.citizen_phone and request.citizen_name:
        db.record_citizen_activity(request.citizen_phone, request.citizen_name, incident.ticket_id)

    db.log_event(
        "INTAKE",
        f"New Grievance #{incident.ticket_id} ({incident.extracted_issue.issue_type if incident.extracted_issue else 'civic'})",
        f"Priority: {incident.priority.priority.value if incident.priority else 'MEDIUM'} ({incident.priority.severity_score if incident.priority else 50}/100) -> Routed to {incident.routing.department_code if incident.routing else 'Agency'}",
        ticket_id=incident.ticket_id
    )

    return {
        "message": "Citizen grievance successfully processed by Autonomous Multi-Agent Pipeline.",
        "ticket_id": incident.ticket_id,
        "is_duplicate": incident.duplicate.is_duplicate if incident.duplicate else False,
        "master_incident_id": incident.master_incident_id,
        "cluster_size": incident.duplicate.cluster_size if incident.duplicate else 1,
        "severity_score": incident.priority.severity_score if incident.priority else 50,
        "priority": incident.priority.priority.value if incident.priority else "MEDIUM",
        "assigned_department": incident.routing.department_name if incident.routing else "Municipal Agency",
        "sla_hours": incident.sla.sla_hours if incident.sla else 48,
        "incident": incident
    }

@app.post("/api/incidents/{ticket_id}/resolve")
def worker_mark_resolved(ticket_id: str, request: WorkerResolveRequest):
    """Worker claims ticket resolution (Agent 9)"""
    inc = db.get_incident(ticket_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    sim_time = db.clock.get_time()
    res_data, trace = db.orchestrator.agent_verification.mark_worker_resolved(
        incident=inc,
        worker_name=request.worker_name,
        resolution_notes=request.resolution_notes,
        photo_url=request.resolution_photo_url,
        sim_time=sim_time
    )
    inc.agent_traces.append(trace)
    
    # Record status transition
    db.orchestrator.agent_workflow.transition_state(
        incident=inc,
        new_status=IncidentStatus.RESOLVED,
        actor=request.worker_name,
        note=f"Resolution work reported: '{request.resolution_notes}'",
        timestamp=sim_time
    )
    db.update_incident(inc)

    db.log_event(
        "WORKER_RESOLVED",
        f"Worker marked #{ticket_id} RESOLVED",
        f"Notes: {request.resolution_notes[:60]}... Dispatched citizen verification.",
        ticket_id=ticket_id
    )

    return {
        "message": "Resolution registered. Citizen verification prompt dispatched.",
        "ticket_id": ticket_id,
        "status": inc.current_status.value,
        "incident": inc
    }

@app.post("/api/incidents/{ticket_id}/verify")
def citizen_verify_feedback(ticket_id: str, request: CitizenVerifyRequest):
    """Citizen confirms or disputes resolution (Agent 9 Closed-Loop Verification)"""
    inc = db.get_incident(ticket_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    sim_time = db.clock.get_time()
    confirmed, status_msg, trace = db.orchestrator.agent_verification.process_citizen_feedback(
        incident=inc,
        confirmed=request.confirmed,
        rating=request.rating,
        feedback_text=request.feedback_text,
        sim_time=sim_time
    )
    inc.agent_traces.append(trace)

    # Log transition in workflow
    actor_label = f"Citizen ({inc.citizen_name})"
    db.orchestrator.agent_workflow.transition_state(
        incident=inc,
        new_status=inc.current_status,
        actor=actor_label,
        note=f"Closed-loop verification: Confirmed={confirmed}, Rating={request.rating}/5. Note: {request.feedback_text}",
        timestamp=sim_time
    )
    db.update_incident(inc)

    # Update citizen reputation
    if confirmed and request.rating >= 3:
        db.update_citizen_reputation(inc.citizen_phone, +5, "Resolution verified positively by citizen")
        db.log_event(
            "CLOSED_LOOP",
            f"Ticket #{ticket_id} officially CLOSED by citizen",
            f"Citizen Rating: {request.rating}/5 ★. Citizen reputation increased +5 points.",
            ticket_id=ticket_id
        )
    else:
        db.log_event(
            "DISPUTE",
            f"FALSE RESOLUTION ALERT: Ticket #{ticket_id} disputed by citizen",
            f"Feedback: '{request.feedback_text}'. Auto-escalated to Senior Supervisor.",
            ticket_id=ticket_id
        )

    return {
        "message": status_msg,
        "ticket_id": ticket_id,
        "confirmed": confirmed,
        "current_status": inc.current_status.value,
        "escalated_tier": inc.escalation.current_tier.value if inc.escalation else "NONE",
        "citizen_reputation_score": inc.citizen_reputation_score,
        "incident": inc
    }

@app.post("/api/incidents/{ticket_id}/flag-false")
def flag_incident_as_false(ticket_id: str, req: FlagFalseRequest = Body(default=FlagFalseRequest())):
    """
    Municipal Inspector marks an incident as false/fraudulent after physical ground inspection.
    Penalizes citizen reputation by -20 points and increments false_reports.
    """
    inc = db.get_incident(ticket_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    sim_time = db.clock.get_time()
    db.orchestrator.agent_workflow.transition_state(
        incident=inc,
        new_status=IncidentStatus.CLOSED,
        actor=req.officer_name,
        note=f"FLAGGED AS FALSE / FAULTY COMPLAINT: {req.reason}",
        timestamp=sim_time
    )
    
    # Penalize citizen
    db.update_citizen_reputation(inc.citizen_phone, -20, f"False complaint verified on ground by {req.officer_name}")
    citizen = db.get_citizen(inc.citizen_phone)
    if citizen:
        inc.citizen_reputation_score = citizen.reputation_score
        inc.citizen_badge = citizen.badge
        
    db.update_incident(inc)
    
    db.log_event(
        "FLAG_FALSE_COMPLAINT",
        f"Ticket #{ticket_id} verified FALSE by Municipal Inspector",
        f"Citizen {inc.citizen_name} ({inc.citizen_phone}) penalized -20 pts. Current reputation: {inc.citizen_reputation_score}/100.",
        ticket_id=ticket_id
    )
    
    return {
        "message": "Incident marked as false. Citizen penalized -20 reputation points.",
        "ticket_id": ticket_id,
        "citizen_reputation_score": inc.citizen_reputation_score,
        "citizen_badge": inc.citizen_badge,
        "incident": inc
    }

@app.post("/api/incidents/{ticket_id}/transition")
def administrative_transition(ticket_id: str, req: StatusTransitionRequest):
    """Admin manual override of status (Agent 8)"""
    inc = db.get_incident(ticket_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    sim_time = db.clock.get_time()
    _, trace = db.orchestrator.agent_workflow.transition_state(
        incident=inc,
        new_status=req.new_status,
        actor=req.actor,
        note=req.note,
        timestamp=sim_time
    )
    inc.agent_traces.append(trace)
    db.update_incident(inc)

    return {
        "message": f"Status updated to {req.new_status.value}",
        "ticket_id": ticket_id,
        "status": inc.current_status.value,
        "incident": inc
    }

@app.post("/api/incidents/{ticket_id}/advance")
def advance_incident_stage(ticket_id: str):
    """
    Advances the incident to its next natural lifecycle stage:
    REPORTED -> ASSIGNED -> IN_PROGRESS -> INSPECTION -> RESOLVED -> CLOSED
    """
    from models.incident import IncidentStatus
    inc = db.get_incident(ticket_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    sim_time = db.clock.get_time()
    current = inc.current_status
    next_map = {
        IncidentStatus.REPORTED: (IncidentStatus.ASSIGNED, "Assigned to departmental field maintenance squad"),
        IncidentStatus.TRIAGED: (IncidentStatus.ASSIGNED, "Assigned to departmental field maintenance squad"),
        IncidentStatus.ASSIGNED: (IncidentStatus.IN_PROGRESS, "Field crew dispatched and actively working on site"),
        IncidentStatus.IN_PROGRESS: (IncidentStatus.INSPECTION, "Site inspection scheduled and underway"),
        IncidentStatus.INSPECTION: (IncidentStatus.RESOLVED, "Inspection complete; repairs verified on site by inspector"),
        IncidentStatus.RESOLVED: (IncidentStatus.CLOSED, "Citizen confirmed resolution; ticket officially closed"),
        IncidentStatus.REOPENED: (IncidentStatus.IN_PROGRESS, "Investigation resumed following dispute"),
        IncidentStatus.CLOSED: (IncidentStatus.CLOSED, "Incident is already closed")
    }

    next_status, note = next_map.get(current, (current, "Maintained current state"))
    if next_status == current and current == IncidentStatus.CLOSED:
        return {
            "message": "Incident is already CLOSED.",
            "ticket_id": ticket_id,
            "status": inc.current_status.value,
            "incident": inc
        }

    # If transitioning to RESOLVED, also update resolution fields if not set
    if next_status == IncidentStatus.RESOLVED and (not inc.resolution or not inc.resolution.is_resolved):
        db.orchestrator.agent_verification.mark_worker_resolved(
            incident=inc,
            worker_name="Field Unit Specialist",
            resolution_notes="On-site civic restoration completed according to municipal standards.",
            sim_time=sim_time
        )

    _, trace = db.orchestrator.agent_workflow.transition_state(
        incident=inc,
        new_status=next_status,
        actor="Workflow Tracking Agent (Autonomous Progression)",
        note=note,
        timestamp=sim_time
    )
    inc.agent_traces.append(trace)
    db.update_incident(inc)

    db.log_event(
        "WORKFLOW_ADVANCE",
        f"Ticket #{ticket_id} progressed: {current.value} ➔ {next_status.value}",
        note,
        ticket_id=ticket_id
    )

    return {
        "message": f"Incident progressed from {current.value} to {next_status.value}",
        "ticket_id": ticket_id,
        "previous_status": current.value,
        "current_status": next_status.value,
        "incident": inc
    }

@app.post("/api/incidents/{ticket_id}/escalate")
def escalate_incident_tier(ticket_id: str, reason: Optional[str] = None):
    """
    Agent 7: Autonomous/Manual Escalation Trigger.
    Escalates through municipal command hierarchy:
    LEVEL_1_FIELD_CREW -> LEVEL_2_WARD_SUPERVISOR -> LEVEL_3_DISTRICT_COMMISSIONER
    """
    from models.incident import EscalationData, EscalationTier, EscalationHistoryEntry, AgentExecutionTrace
    inc = db.get_incident(ticket_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    sim_time = db.clock.get_time()
    if not inc.escalation:
        inc.escalation = EscalationData()

    cur_tier = inc.escalation.current_tier
    if cur_tier == EscalationTier.NONE:
        new_tier = EscalationTier.LEVEL_1_FIELD_CREW
        escalated_to = f"{inc.routing.assigned_division if inc.routing else 'Zonal Field Crew'}"
        act = "Work order dispatched to frontline crew."
        default_reason = "Initial intake SLA escalation."
    elif cur_tier == EscalationTier.LEVEL_1_FIELD_CREW:
        new_tier = EscalationTier.LEVEL_2_WARD_SUPERVISOR
        escalated_to = f"Ward Executive Engineer & Zonal Supervisor ({inc.location.ward_name if inc.location else 'Zone Office'})"
        act = "High-priority SMS & radio dispatch sent to Zonal Supervisor. Resource reallocated."
        default_reason = "Unresolved within SLA timeline / delay detected."
    else:
        new_tier = EscalationTier.LEVEL_3_DISTRICT_COMMISSIONER
        escalated_to = "District Municipal Commissioner & Emergency Urban Taskforce"
        act = "Emergency red alert registered at Municipal Control Headquarters. Special taskforce mobilized."
        default_reason = "Critical SLA delay threshold breached. District commissioner intervened."

    actual_reason = reason or default_reason
    entry = EscalationHistoryEntry(
        tier=new_tier,
        timestamp=sim_time.isoformat(),
        reason=actual_reason,
        escalated_to=escalated_to,
        action_taken=act
    )

    inc.escalation.current_tier = new_tier
    inc.escalation.escalated_to = escalated_to
    inc.escalation.escalation_count += 1
    inc.escalation.last_escalation_time = sim_time.isoformat()
    inc.escalation.history.append(entry)

    # Agent trace
    trace = AgentExecutionTrace(
        agent_id="AGENT-07",
        agent_name="Multi-Tier Escalation Agent",
        duration_ms=4.2,
        timestamp=sim_time.isoformat(),
        input_summary=f"Escalation trigger on #{ticket_id} (From {cur_tier.value})",
        output_summary=f"ESCALATED to {new_tier.value} -> {escalated_to}",
        reasoning_log=[
            f"Escalation event triggered for #{ticket_id}",
            f"Reason: {actual_reason}",
            f"New designated authority: {escalated_to}",
            f"Action: {act}"
        ],
        metadata={"previous_tier": cur_tier.value, "new_tier": new_tier.value}
    )
    inc.agent_traces.append(trace)
    db.update_incident(inc)

    db.log_event(
        "ESCALATION",
        f"ESCALATION: Ticket #{ticket_id} escalated to {new_tier.value}",
        f"Assigned to: {escalated_to}. Reason: {actual_reason}",
        ticket_id=ticket_id
    )

    return {
        "message": f"Ticket #{ticket_id} successfully escalated to {new_tier.value}",
        "ticket_id": ticket_id,
        "new_tier": new_tier.value,
        "escalated_to": escalated_to,
        "action_taken": act,
        "incident": inc
    }

@app.post("/api/incidents/reset")
def reset_incident_database():
    """Resets database to clean default seed state"""
    count = db.reset_to_defaults()
    db.log_event(
        "SYSTEM_RESET",
        "Operations Database Reset to Defaults",
        f"Seeded {count} active baseline civic grievances across all city wards."
    )
    return {
        "message": f"Successfully reset database with {count} seed incidents.",
        "count": count
    }

@app.get("/api/transparency/report")
def get_transparency_governance_report():
    """Agent 10: Transparency & Governance Report"""
    incidents = list(db.incidents.values())
    report, trace = db.orchestrator.agent_transparency.generate_report(incidents)
    return {
        "report": report,
        "agent_trace": trace
    }

@app.get("/api/predictive/risks")
def get_predictive_civic_risks():
    """Predictive Civic Issues Engine (weather & historical correlations)"""
    risks = PredictiveCivicEngine.forecast_civic_risks(
        weather_condition=db.clock.weather,
        rainfall_mm=db.clock.rainfall_mm
    )
    return {
        "simulated_time": db.clock.get_formatted_time(),
        "weather_condition": db.clock.weather,
        "rainfall_mm": db.clock.rainfall_mm,
        "active_risks_count": len(risks),
        "predictive_risks": risks
    }

@app.post("/api/simulation/advance")
def advance_simulation_clock(req: AdvanceTimeRequest):
    """Advances urban operations clock by hours (+6h, +12h, +24h)"""
    result = db.fast_forward_time(req.hours)
    return result

@app.post("/api/simulation/sync-realtime")
def sync_clock_to_realtime():
    """Resets urban operations clock to exact current real-world system time"""
    res = db.sync_to_realtime()
    return res

@app.post("/api/simulation/weather")
def change_simulated_weather(req: WeatherChangeRequest):
    """Simulates changing environmental conditions (e.g. downpour)"""
    db.clock.set_weather(req.weather, req.rainfall_mm)
    return {
        "message": f"Simulated weather updated to {req.weather} ({req.rainfall_mm} mm/hr)",
        "weather": req.weather,
        "rainfall_mm": req.rainfall_mm
    }

@app.get("/api/image-analysis/presets")
def get_image_presets():
    """Returns preset civic photos and multimodal vision inference data"""
    return ImageAnalysisService.get_presets()

@app.get("/api/wards")
def get_wards():
    return list(CITY_WARDS.values())

@app.get("/api/departments")
def get_departments():
    return list(DEPARTMENTS.values())

@app.get("/api/simulation/events")
def get_simulation_events(limit: int = 40):
    """Real-time log of autonomous agent activities, escalations, and lifecycle events"""
    return {
        "count": len(db.events_log),
        "events": db.get_events(limit)
    }

@app.post("/api/simulation/surge")
def trigger_surge_scenario(req: BulkSurgeRequest):
    """Generates bulk realistic citizen complaint bursts (demonstrates Agent 5 clustering)"""
    res = db.trigger_bulk_scenario(req.scenario)
    return res

@app.get("/api/citizens")
def list_citizens():
    """Citizen reputation directory & credibility scorecard"""
    citizens = db.get_all_citizens()
    return {
        "count": len(citizens),
        "citizens": [
            {
                **c.model_dump(),
                "trust_tier": c.get_trust_tier()
            } for c in citizens
        ]
    }

@app.get("/api/citizens/{phone}")
def get_citizen_profile(phone: str):
    c = db.get_citizen(phone)
    if not c:
        raise HTTPException(status_code=404, detail="Citizen profile not found")
    return {
        **c.model_dump(),
        "trust_tier": c.get_trust_tier()
    }

# Serve production frontend dist if built
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="API route not found")
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Page not found")

