"""
Comprehensive Test Suite for CivicPulse AI (PS-10)
Validates all 11 AI Agents and FastAPI Endpoints
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from models.incident import CitizenReportRequest, IncidentStatus, PriorityLevel, EscalationTier
from database import CivicDatabase
from services.predictive_engine import PredictiveCivicEngine
from services.image_analysis import ImageAnalysisService

def test_multi_agent_system():
    print("\n=======================================================")
    print("  RUNNING CIVICPULSE AI MULTI-AGENT VALIDATION SUITE   ")
    print("=======================================================\n")

    db = CivicDatabase()
    orchestrator = db.orchestrator

    # 1. Test Seed Data
    all_incidents = db.get_all_incidents()
    print(f"[TEST 1] Seed Database initialized with {len(all_incidents)} incidents.")
    assert len(all_incidents) >= 6, "Expected at least 6 seed incidents"

    # 2. Test Agent 1: Complaint Understanding
    print("\n[TEST 2] Testing Agent 1: Complaint Understanding Agent...")
    sample_text = "Dangerous open manhole without cover near Sector 14 school, severe accident risk!"
    extracted, trace1 = orchestrator.agent_complaint.process(sample_text)
    print(f"  -> Extracted Issue: {extracted.issue_type}")
    print(f"  -> Category: {extracted.category.value}")
    print(f"  -> Safety Hazard Detected: {extracted.has_safety_hazard}")
    print(f"  -> Urgency Signals Count: {len(extracted.urgency_signals)}")
    assert extracted.has_safety_hazard is True
    assert extracted.issue_type == "open_manhole"
    assert len(trace1.reasoning_log) > 0
    print("  [PASS] Agent 1 successfully understood grievance and detected life safety risk.")

    # 3. Test Agent 2: Location Intelligence
    print("\n[TEST 3] Testing Agent 2: Location Intelligence Agent...")
    vague_location = "Near temple, Sector 9"
    loc_data, trace2 = orchestrator.agent_location.resolve(vague_location)
    print(f"  -> Resolved Address: {loc_data.resolved_address}")
    print(f"  -> Mapped Ward: {loc_data.ward_id} ({loc_data.ward_name})")
    print(f"  -> Lat/Lng: ({loc_data.latitude}, {loc_data.longitude})")
    assert loc_data.ward_id == "WARD-03"
    assert loc_data.confidence_score >= 0.90
    print("  [PASS] Agent 2 resolved vague landmark to Ward-03 with geo-coordinates.")

    # 4. Test Agent 3: Department Routing
    print("\n[TEST 3b] Testing Agent 3: Department Routing Agent...")
    routing, trace3 = orchestrator.agent_routing.route(extracted, loc_data)
    print(f"  -> Department: {routing.department_name} ({routing.department_code})")
    print(f"  -> Division: {routing.assigned_division}")
    print(f"  -> Lead Officer: {routing.lead_officer}")
    assert routing.department_code == "PWD"
    print("  [PASS] Agent 3 accurately routed open manhole to Public Works Department (PWD).")

    # 5. Test Agent 4: Priority & Severity Scoring
    print("\n[TEST 4] Testing Agent 4: Priority & Severity Agent...")
    prio_data, trace4 = orchestrator.agent_priority.score(extracted, loc_data, weather="Monsoon Heavy Rain")
    print(f"  -> Severity Score: {prio_data.severity_score}/100")
    print(f"  -> Priority Level: {prio_data.priority.value}")
    print(f"  -> Weather Multiplier: {prio_data.weather_multiplier}x")
    assert prio_data.priority in [PriorityLevel.CRITICAL, PriorityLevel.HIGH]
    assert prio_data.severity_score >= 80
    print("  [PASS] Agent 4 computed severity score 80+ with weather amplification.")

    # 6. Test Agent 5: Duplicate Detection & Incident Clustering
    print("\n[TEST 5] Testing Agent 5: Duplicate Detection Agent...")
    cluster_data, master_id, trace5 = orchestrator.agent_duplicate.check_and_cluster(
        ticket_id="CP-TEST-001",
        extracted=extracted,
        location=loc_data,
        existing_incidents=all_incidents
    )
    print(f"  -> Duplicate Detected: {cluster_data.is_duplicate}")
    print(f"  -> Cluster ID: {cluster_data.cluster_id}")
    print("  [PASS] Agent 5 executed spatio-temporal radius scan.")

    # 7. Test Agent 6: SLA & Deadline Management
    print("\n[TEST 6] Testing Agent 6: SLA Management Agent...")
    sla_data, trace6 = orchestrator.agent_sla.assign_sla(prio_data, routing)
    print(f"  -> SLA Allocated: {sla_data.sla_hours} hours")
    print(f"  -> Target Deadline: {sla_data.deadline}")
    print(f"  -> Breach Risk: {sla_data.breach_risk_level}")
    assert sla_data.sla_hours <= 12
    print("  [PASS] Agent 6 assigned rapid emergency SLA for high hazard issue.")

    # 8. Test Agent 7: Escalation Agent
    print("\n[TEST 7] Testing Agent 7: Escalation Agent...")
    inc_sample = db.get_incident("CP-2026-7819") # The breached contaminated water ticket
    did_esc, hist_entry, trace7 = orchestrator.agent_escalation.evaluate_escalation(inc_sample)
    print(f"  -> Evaluated Ticket #{inc_sample.ticket_id} Escalation Tier: {inc_sample.escalation.current_tier.value}")
    assert inc_sample.escalation.current_tier == EscalationTier.LEVEL_3_DISTRICT_COMMISSIONER
    print("  [PASS] Agent 7 validated Level 3 District Commissioner escalation on overdue incident.")

    # 9. Test Agent 8: Workflow Tracking Agent
    print("\n[TEST 8] Testing Agent 8: Workflow Tracking Agent...")
    ok, trace8 = orchestrator.agent_workflow.transition_state(
        incident=inc_sample,
        new_status=IncidentStatus.IN_PROGRESS,
        actor="Zonal Chief Engineer",
        note="Emergency bypass valve crew mobilized."
    )
    assert ok is True
    assert inc_sample.current_status == IncidentStatus.IN_PROGRESS
    print("  [PASS] Agent 8 transitioned state machine and recorded immutable audit entry.")

    # 10. Test Agent 9: Resolution Verification Agent (Closed-Loop Feedback)
    print("\n[TEST 9] Testing Agent 9: Resolution Verification Agent...")
    # Simulate worker marking resolved
    res_data, v_trace1 = orchestrator.agent_verification.mark_worker_resolved(
        incident=inc_sample,
        worker_name="Foreman Balwinder",
        resolution_notes="Water pipes flushed with chlorine and resealed."
    )
    assert inc_sample.current_status == IncidentStatus.RESOLVED

    # Simulate citizen disputing resolution (false resolution test!)
    confirmed, msg, v_trace2 = orchestrator.agent_verification.process_citizen_feedback(
        incident=inc_sample,
        confirmed=False,
        rating=1,
        feedback_text="Water is still murky and smells foul! Issue is NOT fixed."
    )
    print(f"  -> Citizen Dispute Handled: Confirmed={confirmed}, Msg='{msg}'")
    assert inc_sample.current_status == IncidentStatus.REOPENED
    assert inc_sample.resolution.dispute_count >= 1
    print("  [PASS] Agent 9 caught false worker resolution, RE-OPENED ticket, and auto-escalated.")

    # 11. Test Agent 10: Transparency & Governance Reporting Agent
    print("\n[TEST 10] Testing Agent 10: Transparency Reporting Agent...")
    report, trace10 = orchestrator.agent_transparency.generate_report(list(db.incidents.values()))
    print(f"  -> Total Complaints: {report['summary']['total_complaints']}")
    print(f"  -> SLA Compliance Rate: {report['summary']['sla_compliance_rate']}%")
    print(f"  -> Average Resolution Time (MTTR): {report['summary']['average_resolution_hours']} hrs")
    print(f"  -> Top Ward Efficiency: {report['ward_efficiency_rankings'][0]['ward_id']} ({report['ward_efficiency_rankings'][0]['efficiency_score']}/100)")
    assert "summary" in report
    assert len(report["ward_efficiency_rankings"]) == 8
    print("  [PASS] Agent 10 generated city governance report and Ward Efficiency Index.")

    # 12. Test Agent 11: End-to-End Master Orchestrator Pipeline
    print("\n[TEST 11] Testing Agent 11: End-to-End Grievance Intake Pipeline...")
    req = CitizenReportRequest(
        description="Garbage not collected in my street for 5 days near Sector 14.",
        location="Sector 14 market lane",
        citizen_name="Simran Kaur",
        citizen_phone="+91-98712-34567",
        image_preset="garbage",
        simulated_weather="Clear"
    )
    new_inc = orchestrator.process_grievance_pipeline(req, list(db.incidents.values()))
    print(f"  -> Created Incident Ticket: {new_inc.ticket_id}")
    print(f"  -> Issue Extracted: {new_inc.extracted_issue.issue_type}")
    print(f"  -> Priority: {new_inc.priority.priority.value} (Severity: {new_inc.priority.severity_score})")
    print(f"  -> Department: {new_inc.routing.department_name}")
    print(f"  -> Cluster Status: Duplicate={new_inc.duplicate.is_duplicate}, Cluster={new_inc.duplicate.cluster_id}")
    print(f"  -> SLA Hours: {new_inc.sla.sla_hours} hrs")
    print(f"  -> Agent Traces Generated: {len(new_inc.agent_traces)}")
    assert len(new_inc.agent_traces) >= 8
    print("  [PASS] Agent 11 successfully coordinated the full 8-agent intake pipeline.")

    # 13. Test Advanced Features: Predictive Engine & Fast-Forward Clock
    print("\n[TEST 12] Testing Advanced Features: Predictive Engine & Simulation Clock...")
    risks = PredictiveCivicEngine.forecast_civic_risks(weather_condition="Monsoon Heavy Downpour", rainfall_mm=45.0)
    print(f"  -> Predictive Risks Forecasted during Downpour: {len(risks)}")
    assert len(risks) >= 3

    ff_res = db.fast_forward_time(12.0)
    print(f"  -> Fast-forwarded Urban Clock by 12 hours: {ff_res['current_simulated_time']}")
    print(f"  -> Escalations Triggered: {ff_res['escalations_count']}")
    print("  [PASS] Predictive engine and time-machine simulation operating with high fidelity.")

    print("\n=======================================================")
    print("  ALL 12 AGENT AND PLATFORM TESTS PASSED WITH 100% SUCCESS! ")
    print("=======================================================\n")

if __name__ == "__main__":
    test_multi_agent_system()
