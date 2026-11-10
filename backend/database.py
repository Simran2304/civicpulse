"""
CivicPulse AI - Persistence Store and Seed Data Generator
Maintains live in-memory store with rich pre-seeded scenarios for immediate demonstration.
"""

from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
from models.incident import (
    CivicIncident, ExtractedIssueData, ResolvedLocationData, 
    DepartmentRoutingData, PrioritySeverityData, DuplicateClusterData, 
    SLAData, EscalationData, EscalationTier, EscalationHistoryEntry,
    ResolutionVerificationData, IncidentStatus, PriorityLevel, IssueCategory,
    StatusHistoryEntry, AgentExecutionTrace, CitizenReportRequest
)
from models.citizen import CitizenProfile
import uuid
from agents.orchestrator import MasterOrchestrator
from services.simulation_clock import SimulationClock
from config import CITY_WARDS, DEPARTMENTS

class CivicDatabase:
    def __init__(self):
        self.incidents: Dict[str, CivicIncident] = {}
        self.citizens: Dict[str, CitizenProfile] = {}
        self.events_log: List[Dict[str, Any]] = []
        self.clock = SimulationClock()
        self.orchestrator = MasterOrchestrator()
        self.init_seed_data()

    def reset_to_defaults(self):
        self.incidents.clear()
        self.citizens.clear()
        self.events_log.clear()
        self.clock.reset_to_realtime()
        self.init_seed_data()
        return len(self.incidents)

    def log_event(self, event_type: str, title: str, details: str, ticket_id: Optional[str] = None):
        evt = {
            "id": f"EVT-{uuid.uuid4().hex[:6].upper()}",
            "timestamp": self.clock.get_formatted_time(),
            "iso_time": self.clock.get_time().isoformat(),
            "type": event_type,
            "title": title,
            "details": details,
            "ticket_id": ticket_id
        }
        self.events_log.insert(0, evt)
        if len(self.events_log) > 100:
            self.events_log.pop()
        return evt

    def get_events(self, limit: int = 40) -> List[Dict[str, Any]]:
        return self.events_log[:limit]

    def get_all_citizens(self) -> List[CitizenProfile]:
        return sorted(list(self.citizens.values()), key=lambda x: x.reputation_score, reverse=True)

    def get_citizen(self, phone: str) -> Optional[CitizenProfile]:
        return self.citizens.get(phone)

    def record_citizen_activity(self, phone: str, name: str, ticket_id: str, is_new: bool = True):
        if phone not in self.citizens:
            self.citizens[phone] = CitizenProfile(
                phone=phone,
                name=name,
                reputation_score=85,
                badge="Verified Resident",
                total_reported=1,
                verified_resolutions=0,
                recent_tickets=[ticket_id]
            )
        else:
            c = self.citizens[phone]
            c.name = name
            if is_new:
                c.total_reported += 1
            if ticket_id not in c.recent_tickets:
                c.recent_tickets.insert(0, ticket_id)

    def update_citizen_reputation(self, phone: str, delta: int, reason: str):
        if phone in self.citizens:
            c = self.citizens[phone]
            old_score = c.reputation_score
            c.reputation_score = max(5, min(100, c.reputation_score + delta))
            if delta > 0:
                c.verified_resolutions += 1
            elif delta < 0:
                c.false_reports += 1
            
            # Update badge
            if c.reputation_score >= 95:
                c.badge = "Elite Community Watcher"
            elif c.reputation_score >= 85:
                c.badge = "Verified Resident"
            elif c.reputation_score >= 60:
                c.badge = "Active Citizen"
            else:
                c.badge = "Flagged / Low Credibility"

            self.log_event(
                "REPUTATION_UPDATE",
                f"Citizen {c.name} ({phone}) reputation {c.reputation_score}/100",
                f"Delta: {delta:+d} points ({reason}). Tier: {c.badge}"
            )

    def get_all_incidents(self) -> List[CivicIncident]:
        # Return sorted by created_at descending
        return sorted(list(self.incidents.values()), key=lambda x: x.created_at, reverse=True)

    def get_incident(self, ticket_id: str) -> Optional[CivicIncident]:
        return self.incidents.get(ticket_id)

    def add_incident(self, incident: CivicIncident) -> CivicIncident:
        self.incidents[incident.ticket_id] = incident
        return incident

    def update_incident(self, incident: CivicIncident) -> CivicIncident:
        incident.updated_at = self.clock.get_time().isoformat()
        self.incidents[incident.ticket_id] = incident
        return incident

    def fast_forward_time(self, hours: float) -> Dict[str, Any]:
        """
        Advances the urban clock by specified hours.
        Recomputes SLAs, fires automated escalations, and simulates worker updates.
        """
        new_time = self.clock.advance_hours(hours)
        escalations_triggered = []
        breaches_triggered = []

        for inc in self.incidents.values():
            if inc.current_status in [IncidentStatus.RESOLVED, IncidentStatus.CLOSED]:
                continue

            # 1. Recompute SLA countdown
            if inc.sla:
                old_breach = inc.sla.is_breached
                inc.sla = self.orchestrator.agent_sla.recompute_sla(inc.sla, new_time)
                if inc.sla.is_breached and not old_breach:
                    breaches_triggered.append(inc.ticket_id)

            # 2. Check escalation triggers
            did_escalate, hist_entry, trace = self.orchestrator.agent_escalation.evaluate_escalation(inc, new_time)
            if did_escalate:
                inc.agent_traces.append(trace)
                new_tier_val = inc.escalation.current_tier.value if (inc.escalation and inc.escalation.current_tier) else (hist_entry.tier.value if hist_entry else "LEVEL_1_FIELD_CREW")
                reason_text = hist_entry.reason if hist_entry else "Automated SLA escalation"
                escalations_triggered.append({
                    "ticket_id": inc.ticket_id,
                    "new_tier": new_tier_val,
                    "reason": reason_text
                })
                self.log_event(
                    "ESCALATION",
                    f"Ticket #{inc.ticket_id} escalated to {new_tier_val}",
                    reason_text,
                    ticket_id=inc.ticket_id
                )

            # 3. Simulate operational lifecycle if assigned long enough
            if inc.current_status == IncidentStatus.ASSIGNED and hours >= 6:
                inc.current_status = IncidentStatus.IN_PROGRESS
                inc.status_history.append(StatusHistoryEntry(
                    status=IncidentStatus.IN_PROGRESS,
                    timestamp=new_time.isoformat(),
                    actor=f"{inc.routing.assigned_division if inc.routing else 'Field Crew'}",
                    note="Maintenance crew arrived on site. Commenced repair operations."
                ))
                self.log_event(
                    "WORKFLOW_UPDATE",
                    f"Ticket #{inc.ticket_id} progressed to IN_PROGRESS",
                    f"Crew arrived in {inc.location.ward_name if inc.location else 'Ward'}",
                    ticket_id=inc.ticket_id
                )

        self.log_event(
            "TIME_MACHINE",
            f"Urban Operations Clock advanced by +{hours} Hours",
            f"New Simulated Time: {self.clock.get_formatted_time()} | Escalations: {len(escalations_triggered)} | SLA Breaches: {len(breaches_triggered)}"
        )

        return {
            "current_simulated_time": self.clock.get_formatted_time(),
            "hours_advanced": hours,
            "offset_hours": self.clock.get_offset_hours(),
            "is_realtime": self.clock.is_realtime(),
            "escalations_count": len(escalations_triggered),
            "escalations": escalations_triggered,
            "new_breaches": breaches_triggered
        }

    def sync_to_realtime(self) -> Dict[str, Any]:
        """Resets urban simulation clock to exact current real-world local time"""
        new_time = self.clock.reset_to_realtime()
        for inc in self.incidents.values():
            if inc.sla:
                inc.sla = self.orchestrator.agent_sla.recompute_sla(inc.sla, new_time)
            self.orchestrator.agent_escalation.evaluate_escalation(inc, new_time)
        
        self.log_event(
            "TIME_SYNC",
            "Clock Synced to Real-World Time",
            f"Reset urban operations clock to current real time: {self.clock.get_formatted_time()}."
        )
        return {
            "current_simulated_time": self.clock.get_formatted_time(),
            "is_realtime": True,
            "offset_hours": 0.0
        }

    def trigger_bulk_scenario(self, scenario_type: str) -> Dict[str, Any]:
        """
        Simulates realistic real-world surge events to demonstrate autonomous clustering,
        priority escalation, and multi-agent coordination.
        """
        sim_time = self.clock.get_time()
        created_tickets = []

        if scenario_type == "sector_14_garbage_surge":
            # 6 citizens report overflow in Sector 14 within 45 mins
            complaints = [
                ("Garbage overflowing onto main carriageway near Sector 14 sweet shop", "Sector 14 central bazaar", "Ramesh Chand", "+91-98111-55001"),
                ("Dumping bin broken and trash scattered by stray animals in Sector 14", "Sector 14 market lane 2", "Vandana Sethi", "+91-98111-55002"),
                ("Terrible foul smell and flies near Sector 14 grocery stores", "Opposite Sector 14 post office", "Kunal Bakshi", "+91-98111-55003"),
                ("Waste pile blocking pedestrian footpath Sector 14", "Sector 14 market entry gate", "Simi Gill", "+91-98111-55004"),
                ("Solid waste not lifted for days near Sector 14 bank branch", "Sector 14 commercial lane 3", "Harsh Vardhan", "+91-98111-55005")
            ]
            for desc, loc, c_name, c_phone in complaints:
                req = CitizenReportRequest(
                    description=desc,
                    location=loc,
                    citizen_name=c_name,
                    citizen_phone=c_phone,
                    image_preset="garbage",
                    simulated_weather=self.clock.weather
                )
                inc = self.orchestrator.process_grievance_pipeline(req, list(self.incidents.values()), sim_time)
                self.add_incident(inc)
                self.record_citizen_activity(c_phone, c_name, inc.ticket_id)
                created_tickets.append(inc)

            self.log_event(
                "SURGE_EVENT",
                "Sector 14 Solid Waste Surge Detected",
                f"Generated {len(created_tickets)} clustered complaints. Agent 5 merged into Master Incident."
            )

        elif scenario_type == "riverfront_flood_surge":
            # Monsoon stormwater surge in Ward 04
            complaints = [
                ("Stormwater drain clogged and water entering ground floor shops near Riverfront", "East Riverfront Ring Road Ghat 3", "Manoj Tiwari", "+91-98222-66001"),
                ("Dangerous waterlogging 2 feet deep near industrial riverfront underpass", "Riverfront underpass kilometer 4", "Jaspreet Kaur", "+91-98222-66002"),
                ("Sewer backflow and stagnant flood water on industrial access road", "East Industrial Riverfront Lane 6", "Anand Swamy", "+91-98222-66003")
            ]
            for desc, loc, c_name, c_phone in complaints:
                req = CitizenReportRequest(
                    description=desc,
                    location=loc,
                    citizen_name=c_name,
                    citizen_phone=c_phone,
                    image_preset="water_leak",
                    simulated_weather="Monsoon Heavy Downpour"
                )
                inc = self.orchestrator.process_grievance_pipeline(req, list(self.incidents.values()), sim_time)
                self.add_incident(inc)
                self.record_citizen_activity(c_phone, c_name, inc.ticket_id)
                created_tickets.append(inc)

            self.log_event(
                "SURGE_EVENT",
                "Monsoon Riverfront Flash Flood Complaints Surge",
                f"Ingested {len(created_tickets)} high-priority flood tickets across Ward-04."
            )

        return {
            "scenario": scenario_type,
            "generated_tickets_count": len(created_tickets),
            "tickets": [t.ticket_id for t in created_tickets]
        }

    def init_seed_data(self):
        """Populates rich, diverse civic incident scenarios"""
        sim_now = self.clock.get_time()

        # Seed Scenario 1: The Iconic Prompt Example - Garbage in Sector 14 with 12 duplicate complaints!
        inc1_created = sim_now - timedelta(hours=36)
        inc1 = CivicIncident(
            ticket_id="CP-2026-8941",
            raw_description="Garbage not collected in my street for 5 days near Sector 14. Heavy foul odor spreading.",
            citizen_name="Aarav Mehra",
            citizen_phone="+91-98112-44512",
            citizen_reputation_score=92,
            citizen_badge="Community Watcher",
            image_url="https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800&auto=format&fit=crop&q=80",
            current_status=IncidentStatus.IN_PROGRESS,
            created_at=inc1_created.isoformat(),
            updated_at=sim_now.isoformat(),
            extracted_issue=ExtractedIssueData(
                issue_type="garbage_dump",
                category=IssueCategory.SOLID_WASTE,
                summary="Solid Waste Accumulation reported in Sector 14. 2 critical civic factors identified.",
                urgency_signals=[
                    "Public Health Hazard: Vector breeding or contamination potential",
                    "Prolonged Civic Neglect: Issue persisting for 5 days"
                ],
                detected_keywords=["solid_waste", "health_hazard"],
                sentiment="urgent",
                has_safety_hazard=False,
                has_health_hazard=True,
                has_traffic_impact=False
            ),
            location=ResolvedLocationData(
                raw_location="Near Sector 14 Market Lane",
                resolved_address="Sector 14 Commercial Market Complex, North Sector 14 & Old Market, Zone: North",
                ward_id="WARD-02",
                ward_name="North Sector 14 & Old Market",
                zone="North",
                latitude=28.6455,
                longitude=27.2185,
                confidence_score=0.96,
                landmark_detected="Sector 14 Commercial Market",
                jurisdiction_office="Municipal Ward WARD-02 Zonal Office, North Division"
            ),
            routing=DepartmentRoutingData(
                department_id="DEPT-SWM",
                department_name="Municipal Sanitation & Solid Waste Management",
                department_code="SWM",
                assigned_division="North Urban Maintenance Squad (Div-02)",
                lead_officer="Er. K. R. Sharma, Chief Engineer (Sanitation)",
                contact_phone="+91-11-2345-0101",
                dispatch_notes="Priority sanitary clearance dispatched to Sector 14 compactor squad."
            ),
            priority=PrioritySeverityData(
                severity_score=72,
                priority=PriorityLevel.HIGH,
                base_hazard=52,
                population_density_modifier=5,
                weather_multiplier=1.0,
                urgency_bonus=19,
                justification="Severity score 72/100 assigned [HIGH]. Base risk: 52, Footfall density: +5, Urgency hazards: +19."
            ),
            duplicate=DuplicateClusterData(
                is_duplicate=False,
                cluster_id="CP-2026-8941",
                is_primary_ticket=True,
                cluster_size=12,
                similar_complaints=[f"CP-CL-{100+i}" for i in range(11)],
                similarity_score=1.0
            ),
            sla=SLAData(
                sla_hours=48,
                deadline=(inc1_created + timedelta(hours=48)).isoformat(),
                created_at=inc1_created.isoformat(),
                target_resolution_timestamp=(inc1_created + timedelta(hours=48)).isoformat(),
                remaining_hours=12.0,
                is_breached=False,
                breach_risk_level="IMMINENT",
                countdown_text="CRITICAL: Breach risk in 12h 00m"
            ),
            escalation=EscalationData(
                current_tier=EscalationTier.LEVEL_2_WARD_SUPERVISOR,
                escalated_to="Ward Executive Engineer (Sunita Devi, Ward-02)",
                escalation_count=1,
                last_escalation_time=(sim_now - timedelta(hours=10)).isoformat(),
                history=[
                    EscalationHistoryEntry(
                        tier=EscalationTier.LEVEL_2_WARD_SUPERVISOR,
                        timestamp=(sim_now - timedelta(hours=10)).isoformat(),
                        reason="12 citizen complaints clustered in same 300m radius + SLA remaining < 25%.",
                        escalated_to="Ward Executive Engineer (Sunita Devi, Ward-02)",
                        action_taken="Extra 10-ton compactor truck dispatched; Ward Supervisor alerted."
                    )
                ]
            ),
            status_history=[
                StatusHistoryEntry(
                    status=IncidentStatus.REPORTED,
                    timestamp=inc1_created.isoformat(),
                    actor="Citizen Aarav Mehra",
                    note="Initial grievance lodged via CivicPulse App."
                ),
                StatusHistoryEntry(
                    status=IncidentStatus.ASSIGNED,
                    timestamp=(inc1_created + timedelta(minutes=4)).isoformat(),
                    actor="Master Orchestrator",
                    note="Auto-routed to Municipal Sanitation Unit Div-02."
                ),
                StatusHistoryEntry(
                    status=IncidentStatus.IN_PROGRESS,
                    timestamp=(sim_now - timedelta(hours=8)).isoformat(),
                    actor="Sanitation Crew Team 3",
                    note="Inspection completed. Secondary waste removal vehicle on route."
                )
            ]
        )
        self.incidents[inc1.ticket_id] = inc1

        # Seed Scenario 2: Dangerous Open Manhole on Road (Prompt's High Priority Example)
        inc2_created = sim_now - timedelta(hours=4)
        inc2 = CivicIncident(
            ticket_id="CP-2026-9014",
            raw_description="Deep open manhole on road with iron lid missing opposite City General Hospital Gate 2. Huge accident danger for two-wheelers!",
            citizen_name="Dr. Vikram Nair",
            citizen_phone="+91-98230-11299",
            citizen_reputation_score=98,
            citizen_badge="Verified Doctor / First Responder",
            image_url="https://images.unsplash.com/photo-1541888946425-d0fbb18f156f?w=800&auto=format&fit=crop&q=80",
            current_status=IncidentStatus.IN_PROGRESS,
            created_at=inc2_created.isoformat(),
            updated_at=sim_now.isoformat(),
            extracted_issue=ExtractedIssueData(
                issue_type="open_manhole",
                category=IssueCategory.ROADS_INFRASTRUCTURE,
                summary="Open Manhole reported near Hospital. 3 critical civic factors identified.",
                urgency_signals=[
                    "Public Safety Risk: High danger of physical accident or electrocution",
                    "Transit Impact: Arterial road obstruction or commuter delay"
                ],
                detected_keywords=["open_manhole_hazard", "safety_risk"],
                sentiment="urgent",
                has_safety_hazard=True,
                has_health_hazard=False,
                has_traffic_impact=True
            ),
            location=ResolvedLocationData(
                raw_location="Opposite City General Hospital Gate 2",
                resolved_address="City General Hospital & Health Village Lane, Green Meadows & Health Village, Zone: East-South",
                ward_id="WARD-08",
                ward_name="Green Meadows & Health Village",
                zone="East-South",
                latitude=28.5810,
                longitude=77.2960,
                confidence_score=0.98,
                landmark_detected="City General Hospital",
                jurisdiction_office="Municipal Ward WARD-08 Zonal Office, East-South Division"
            ),
            routing=DepartmentRoutingData(
                department_id="DEPT-PWD",
                department_name="Public Works & Road Infrastructure Department",
                department_code="PWD",
                assigned_division="East-South Urban Maintenance Squad (Div-08)",
                lead_officer="Er. Ananya Gupta, Chief Infrastructure Officer",
                contact_phone="+91-11-2345-0102",
                dispatch_notes="RED ALERT: Emergency steel barricade and heavy ductile iron manhole cover dispatch."
            ),
            priority=PrioritySeverityData(
                severity_score=94,
                priority=PriorityLevel.CRITICAL,
                base_hazard=95,
                population_density_modifier=0,
                weather_multiplier=1.0,
                urgency_bonus=26,
                justification="Severity score 94/100 assigned [CRITICAL]. Fatal fall and collision risk near hospital transit zone."
            ),
            duplicate=DuplicateClusterData(
                is_duplicate=False,
                cluster_id="CP-2026-9014",
                is_primary_ticket=True,
                cluster_size=3,
                similar_complaints=["CP-CL-201", "CP-CL-202"],
                similarity_score=1.0
            ),
            sla=SLAData(
                sla_hours=6,
                deadline=(inc2_created + timedelta(hours=6)).isoformat(),
                created_at=inc2_created.isoformat(),
                target_resolution_timestamp=(inc2_created + timedelta(hours=6)).isoformat(),
                remaining_hours=2.0,
                is_breached=False,
                breach_risk_level="IMMINENT",
                countdown_text="CRITICAL: Breach risk in 2h 00m"
            ),
            escalation=EscalationData(
                current_tier=EscalationTier.LEVEL_2_WARD_SUPERVISOR,
                escalated_to="Ward Executive Engineer Anita Deshmukh & PWD Rapid Squad",
                escalation_count=1,
                last_escalation_time=inc2_created.isoformat(),
                history=[
                    EscalationHistoryEntry(
                        tier=EscalationTier.LEVEL_2_WARD_SUPERVISOR,
                        timestamp=inc2_created.isoformat(),
                        reason="Critical Severity Score 94/100 (Open Manhole on Hospital Corridor).",
                        escalated_to="Ward Executive Engineer Anita Deshmukh & PWD Rapid Squad",
                        action_taken="Emergency barricading dispatched. Temporary caution lights erected."
                    )
                ]
            ),
            status_history=[
                StatusHistoryEntry(
                    status=IncidentStatus.REPORTED,
                    timestamp=inc2_created.isoformat(),
                    actor="Dr. Vikram Nair",
                    note="Citizen report with high priority tag."
                ),
                StatusHistoryEntry(
                    status=IncidentStatus.IN_PROGRESS,
                    timestamp=(inc2_created + timedelta(minutes=15)).isoformat(),
                    actor="PWD Emergency Squad",
                    note="Temporary safety cone placed. Replacement cover in transit."
                )
            ]
        )
        self.incidents[inc2.ticket_id] = inc2

        # Seed Scenario 3: Broken Park Bench (Prompt's Low Priority Example)
        inc3_created = sim_now - timedelta(hours=18)
        inc3 = CivicIncident(
            ticket_id="CP-2026-9102",
            raw_description="Wooden park bench broken near jogging track in Green Meadows Park. Splintered wood.",
            citizen_name="Sanjay Verma",
            citizen_phone="+91-98771-88231",
            citizen_reputation_score=78,
            citizen_badge="Verified Citizen",
            current_status=IncidentStatus.ASSIGNED,
            created_at=inc3_created.isoformat(),
            updated_at=sim_now.isoformat(),
            extracted_issue=ExtractedIssueData(
                issue_type="park_bench_broken",
                category=IssueCategory.ROADS_INFRASTRUCTURE,
                summary="Park Bench Broken reported. Minor civic defect.",
                urgency_signals=[],
                detected_keywords=["park_bench"],
                sentiment="neutral",
                has_safety_hazard=False,
                has_health_hazard=False,
                has_traffic_impact=False
            ),
            location=ResolvedLocationData(
                raw_location="Green Meadows Park Jogging Track",
                resolved_address="Green Meadows Park, Green Meadows & Health Village, Zone: East-South",
                ward_id="WARD-08",
                ward_name="Green Meadows & Health Village",
                zone="East-South",
                latitude=28.5830,
                longitude=77.2940,
                confidence_score=0.94,
                landmark_detected="Green Meadows Park",
                jurisdiction_office="Municipal Ward WARD-08 Zonal Office, East-South Division"
            ),
            routing=DepartmentRoutingData(
                department_id="DEPT-PWD",
                department_name="Public Works & Road Infrastructure Department",
                department_code="PWD",
                assigned_division="Horticulture & Parks Division 08",
                lead_officer="Er. Ananya Gupta, Chief Infrastructure Officer",
                contact_phone="+91-11-2345-0102",
                dispatch_notes="Scheduled for carpentry maintenance during weekly park upkeep cycle."
            ),
            priority=PrioritySeverityData(
                severity_score=18,
                priority=PriorityLevel.LOW,
                base_hazard=18,
                population_density_modifier=0,
                weather_multiplier=1.0,
                urgency_bonus=0,
                justification="Severity score 18/100 assigned [LOW]. Non-hazardous recreational furniture defect."
            ),
            duplicate=DuplicateClusterData(
                is_duplicate=False,
                cluster_id="CP-2026-9102",
                is_primary_ticket=True,
                cluster_size=1,
                similar_complaints=[],
                similarity_score=1.0
            ),
            sla=SLAData(
                sla_hours=144,
                deadline=(inc3_created + timedelta(hours=144)).isoformat(),
                created_at=inc3_created.isoformat(),
                target_resolution_timestamp=(inc3_created + timedelta(hours=144)).isoformat(),
                remaining_hours=126.0,
                is_breached=False,
                breach_risk_level="LOW",
                countdown_text="126h 00m remaining"
            ),
            escalation=EscalationData(
                current_tier=EscalationTier.LEVEL_1_FIELD_CREW,
                escalated_to="Parks Carpentry Squad",
                escalation_count=0
            ),
            status_history=[
                StatusHistoryEntry(
                    status=IncidentStatus.REPORTED,
                    timestamp=inc3_created.isoformat(),
                    actor="Sanjay Verma",
                    note="Grievance logged."
                ),
                StatusHistoryEntry(
                    status=IncidentStatus.ASSIGNED,
                    timestamp=(inc3_created + timedelta(minutes=5)).isoformat(),
                    actor="Master Orchestrator",
                    note="Assigned to Parks & Horticulture Unit."
                )
            ]
        )
        self.incidents[inc3.ticket_id] = inc3

        # Seed Scenario 4: Fully Resolved Complaint with Citizen 5-Star Feedback (Shows Verification Agent)
        inc4_created = sim_now - timedelta(hours=50)
        inc4_resolved = sim_now - timedelta(hours=14)
        inc4 = CivicIncident(
            ticket_id="CP-2026-8720",
            raw_description="Streetlight pole #42 completely dark for 3 days near West Lake Residency Block C.",
            citizen_name="Pooja Sharma",
            citizen_phone="+91-98101-77884",
            citizen_reputation_score=95,
            citizen_badge="Verified Citizen",
            current_status=IncidentStatus.CLOSED,
            created_at=inc4_created.isoformat(),
            updated_at=sim_now.isoformat(),
            extracted_issue=ExtractedIssueData(
                issue_type="broken_streetlight",
                category=IssueCategory.ELECTRICAL_POWER,
                summary="Broken Streetlight reported in West Lake Residency.",
                urgency_signals=["Nighttime safety hazard"],
                detected_keywords=["electrical_hazard"],
                sentiment="neutral"
            ),
            location=ResolvedLocationData(
                raw_location="West Lake Residency Block C",
                resolved_address="West Lake Sector 22 Residential Gate 4, West Lake Residency & Sector 22, Zone: West",
                ward_id="WARD-05",
                ward_name="West Lake Residency & Sector 22",
                zone="West",
                latitude=28.6105,
                longitude=77.1510,
                confidence_score=0.95,
                landmark_detected="West Lake Residency",
                jurisdiction_office="Municipal Ward WARD-05 Zonal Office, West Division"
            ),
            routing=DepartmentRoutingData(
                department_id="DEPT-PSUB",
                department_name="Power Utility & Streetlight Board",
                department_code="PSUB",
                assigned_division="West Electrical Grid Squad (Div-05)",
                lead_officer="Er. Manish Chawla, Supt. Engineer (Electrical)",
                contact_phone="+91-11-2345-0104",
                dispatch_notes="LED driver replacement and wiring restoration completed."
            ),
            priority=PrioritySeverityData(
                severity_score=45,
                priority=PriorityLevel.MEDIUM,
                base_hazard=40,
                population_density_modifier=5,
                weather_multiplier=1.0,
                urgency_bonus=0,
                justification="Severity score 45/100 assigned [MEDIUM]."
            ),
            duplicate=DuplicateClusterData(
                is_duplicate=False,
                cluster_id="CP-2026-8720",
                is_primary_ticket=True,
                cluster_size=1
            ),
            sla=SLAData(
                sla_hours=48,
                deadline=(inc4_created + timedelta(hours=48)).isoformat(),
                created_at=inc4_created.isoformat(),
                target_resolution_timestamp=(inc4_created + timedelta(hours=48)).isoformat(),
                remaining_hours=0.0,
                is_breached=False,
                breach_risk_level="LOW",
                countdown_text="Resolved within SLA"
            ),
            resolution=ResolutionVerificationData(
                is_resolved=True,
                resolution_timestamp=inc4_resolved.isoformat(),
                resolution_notes="Replaced faulty 120W LED driver unit and waterproof junction box. Streetlight fully illuminated.",
                resolution_photo_url="https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=600&auto=format&fit=crop&q=60",
                worker_name="Lineman Rajesh Kumar (Badge #E-402)",
                citizen_verified=True,
                citizen_rating=5,
                citizen_feedback="Outstanding work! Repaired cleanly by the team the same evening. Street is well lit now.",
                verification_method="CITIZEN_CONFIRMED"
            ),
            status_history=[
                StatusHistoryEntry(
                    status=IncidentStatus.REPORTED,
                    timestamp=inc4_created.isoformat(),
                    actor="Pooja Sharma",
                    note="Streetlight dark report filed."
                ),
                StatusHistoryEntry(
                    status=IncidentStatus.RESOLVED,
                    timestamp=inc4_resolved.isoformat(),
                    actor="Lineman Rajesh Kumar",
                    note="Work completed. LED driver unit restored."
                ),
                StatusHistoryEntry(
                    status=IncidentStatus.CLOSED,
                    timestamp=(inc4_resolved + timedelta(hours=2)).isoformat(),
                    actor="Citizen Pooja Sharma",
                    note="Citizen submitted 5-star rating and confirmed resolution."
                )
            ]
        )
        self.incidents[inc4.ticket_id] = inc4

        # Seed Scenario 5: Breached / Escalated to Level 3 District Commissioner (Shows Escalation Agent in Action)
        inc5_created = sim_now - timedelta(hours=76)
        inc5 = CivicIncident(
            ticket_id="CP-2026-7819",
            raw_description="Contaminated drinking water mixed with sewage line in Sector 22 apartments. Foul odor in taps for 3 days.",
            citizen_name="Deepak Goel",
            citizen_phone="+91-98711-22900",
            citizen_reputation_score=88,
            citizen_badge="Verified Resident",
            current_status=IncidentStatus.IN_PROGRESS,
            created_at=inc5_created.isoformat(),
            updated_at=sim_now.isoformat(),
            extracted_issue=ExtractedIssueData(
                issue_type="sewage_overflow",
                category=IssueCategory.WATER_SEWERAGE,
                summary="Sewage Cross-Contamination in Water Line.",
                urgency_signals=[
                    "Public Health Hazard: Vector breeding or contamination potential",
                    "Prolonged Civic Neglect: Issue persisting for 3 days"
                ],
                detected_keywords=["water_sewerage", "health_hazard"],
                has_health_hazard=True
            ),
            location=ResolvedLocationData(
                raw_location="Sector 22 Lake Residency Lane 4",
                resolved_address="West Lake Sector 22 Residential Gate 4, West Lake Residency & Sector 22, Zone: West",
                ward_id="WARD-05",
                ward_name="West Lake Residency & Sector 22",
                zone="West",
                latitude=28.6110,
                longitude=77.1520,
                confidence_score=0.96,
                jurisdiction_office="Municipal Ward WARD-05 Zonal Office, West Division"
            ),
            routing=DepartmentRoutingData(
                department_id="DEPT-WSSB",
                department_name="Water Supply & Sewerage Board",
                department_code="WSSB",
                assigned_division="West Hydrology & Water Pipeline Div",
                lead_officer="Er. Tariq Ahmed, Director (Water & Hydrology)",
                contact_phone="+91-11-2345-0103",
                dispatch_notes="Hydraulic pressure testing and isolating crossover pipeline valve."
            ),
            priority=PrioritySeverityData(
                severity_score=88,
                priority=PriorityLevel.CRITICAL,
                base_hazard=75,
                population_density_modifier=5,
                weather_multiplier=1.0,
                urgency_bonus=19,
                justification="Severity score 88/100 [CRITICAL]. Severe microbial contamination danger."
            ),
            duplicate=DuplicateClusterData(
                is_duplicate=False,
                cluster_id="CP-2026-7819",
                is_primary_ticket=True,
                cluster_size=6,
                similar_complaints=["CP-CL-301", "CP-CL-302", "CP-CL-303"]
            ),
            sla=SLAData(
                sla_hours=18,
                deadline=(inc5_created + timedelta(hours=18)).isoformat(),
                created_at=inc5_created.isoformat(),
                target_resolution_timestamp=(inc5_created + timedelta(hours=18)).isoformat(),
                remaining_hours=0.0,
                is_breached=True,
                breach_risk_level="BREACHED",
                countdown_text="OVERDUE by 58h 00m"
            ),
            escalation=EscalationData(
                current_tier=EscalationTier.LEVEL_3_DISTRICT_COMMISSIONER,
                escalated_to="District Municipal Commissioner & Rapid Urban Taskforce",
                escalation_count=2,
                last_escalation_time=(sim_now - timedelta(hours=48)).isoformat(),
                history=[
                    EscalationHistoryEntry(
                        tier=EscalationTier.LEVEL_2_WARD_SUPERVISOR,
                        timestamp=(inc5_created + timedelta(hours=12)).isoformat(),
                        reason="Critical Severity Score 88/100 (Contaminated water supply).",
                        escalated_to="Ward Executive Engineer",
                        action_taken="Alternate clean water tanker dispatched."
                    ),
                    EscalationHistoryEntry(
                        tier=EscalationTier.LEVEL_3_DISTRICT_COMMISSIONER,
                        timestamp=(inc5_created + timedelta(hours=19)).isoformat(),
                        reason="CRITICAL BREACH: SLA deadline exceeded by >24h. Public health risk.",
                        escalated_to="District Municipal Commissioner & Rapid Urban Taskforce",
                        action_taken="Emergency ministerial hearing initiated; pipeline excavation contractor summoned."
                    )
                ]
            ),
            status_history=[
                StatusHistoryEntry(
                    status=IncidentStatus.REPORTED,
                    timestamp=inc5_created.isoformat(),
                    actor="Deepak Goel",
                    note="Severe water contamination reported."
                ),
                StatusHistoryEntry(
                    status=IncidentStatus.IN_PROGRESS,
                    timestamp=(sim_now - timedelta(hours=30)).isoformat(),
                    actor="WSSB Engineering Taskforce",
                    note="Emergency bypass trenching started."
                )
            ]
        )
        self.incidents[inc5.ticket_id] = inc5

        # Seed Scenario 6: High Pressure Water Main Burst on Arterial Road
        inc6_created = sim_now - timedelta(hours=8)
        inc6 = CivicIncident(
            ticket_id="CP-2026-9240",
            raw_description="Major water pipe burst near Ring Road / Tech Park Sector 9. Clean water gushing like a fountain, road flooded.",
            citizen_name="Manish Rastogi",
            citizen_phone="+91-98188-33421",
            citizen_reputation_score=90,
            image_url="https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=800&auto=format&fit=crop&q=80",
            current_status=IncidentStatus.IN_PROGRESS,
            created_at=inc6_created.isoformat(),
            updated_at=sim_now.isoformat(),
            extracted_issue=ExtractedIssueData(
                issue_type="burst_pipeline",
                category=IssueCategory.WATER_SEWERAGE,
                summary="Pressurized Pipeline Rupture reported in Sector 9.",
                urgency_signals=[
                    "Transit Impact: Arterial road obstruction or commuter delay",
                    "Public Safety Risk: High danger of physical accident"
                ],
                detected_keywords=["pipe_burst", "water_loss"],
                has_safety_hazard=True,
                has_traffic_impact=True
            ),
            location=ResolvedLocationData(
                raw_location="Ring Road near Sector 9 Tech Park",
                resolved_address="Sector 9 Hanuman Temple & Tech Corridor, South Extension & Tech Park Sector 9, Zone: South",
                ward_id="WARD-03",
                ward_name="South Extension & Tech Park Sector 9",
                zone="South",
                latitude=28.5720,
                longitude=77.2260,
                confidence_score=0.97,
                landmark_detected="Sector 9 Tech Park Ring Road",
                jurisdiction_office="Municipal Ward WARD-03 Zonal Office, South Division"
            ),
            routing=DepartmentRoutingData(
                department_id="DEPT-WSSB",
                department_name="Water Supply & Sewerage Board",
                department_code="WSSB",
                assigned_division="South High-Pressure Hydraulic Squad (Div-03)",
                lead_officer="Er. Tariq Ahmed, Director (Water & Hydrology)",
                contact_phone="+91-11-2345-0103",
                dispatch_notes="Valve gate 4B closed to isolate leak. Heavy excavation crew deployed."
            ),
            priority=PrioritySeverityData(
                severity_score=85,
                priority=PriorityLevel.CRITICAL,
                base_hazard=85,
                population_density_modifier=8,
                weather_multiplier=1.0,
                urgency_bonus=26,
                justification="Severity score 85/100 [CRITICAL]. High volume treated water loss and asphalt erosion."
            ),
            duplicate=DuplicateClusterData(
                is_duplicate=False,
                cluster_id="CP-2026-9240",
                is_primary_ticket=True,
                cluster_size=4,
                similar_complaints=["CP-CL-401", "CP-CL-402", "CP-CL-403"]
            ),
            sla=SLAData(
                sla_hours=18,
                deadline=(inc6_created + timedelta(hours=18)).isoformat(),
                created_at=inc6_created.isoformat(),
                target_resolution_timestamp=(inc6_created + timedelta(hours=18)).isoformat(),
                remaining_hours=10.0,
                is_breached=False,
                breach_risk_level="MODERATE",
                countdown_text="10h 00m remaining"
            ),
            escalation=EscalationData(
                current_tier=EscalationTier.LEVEL_2_WARD_SUPERVISOR,
                escalated_to="Ward Executive Engineer Amitabh Sen",
                escalation_count=1,
                last_escalation_time=inc6_created.isoformat()
            )
        )
        self.incidents[inc6.ticket_id] = inc6

        # Seed Citizen Reputation Directory
        seed_citizens = [
            CitizenProfile(phone="+91-98230-11299", name="Dr. Vikram Nair", reputation_score=98, badge="Elite Community Watcher", total_reported=12, verified_resolutions=11, false_reports=0, disputes_filed=0, recent_tickets=["CP-2026-9014"]),
            CitizenProfile(phone="+91-98101-77884", name="Pooja Sharma", reputation_score=95, badge="Verified Resident", total_reported=8, verified_resolutions=8, false_reports=0, disputes_filed=0, recent_tickets=["CP-2026-8720"]),
            CitizenProfile(phone="+91-98112-44512", name="Aarav Mehra", reputation_score=92, badge="Community Watcher", total_reported=6, verified_resolutions=5, false_reports=0, disputes_filed=1, recent_tickets=["CP-2026-8941"]),
            CitizenProfile(phone="+91-98188-33421", name="Manish Rastogi", reputation_score=90, badge="Verified Resident", total_reported=4, verified_resolutions=4, false_reports=0, disputes_filed=0, recent_tickets=["CP-2026-9240"]),
            CitizenProfile(phone="+91-98711-22900", name="Deepak Goel", reputation_score=88, badge="Verified Resident", total_reported=3, verified_resolutions=2, false_reports=0, disputes_filed=1, recent_tickets=["CP-2026-7819"]),
            CitizenProfile(phone="+91-98771-88231", name="Sanjay Verma", reputation_score=78, badge="Active Citizen", total_reported=2, verified_resolutions=1, false_reports=0, disputes_filed=0, recent_tickets=["CP-2026-9102"]),
            CitizenProfile(phone="+91-98999-12345", name="Rohit V. (Spam Warning)", reputation_score=35, badge="Flagged / Low Credibility", total_reported=5, verified_resolutions=0, false_reports=3, disputes_filed=2, recent_tickets=["CP-FLAGGED-01"])
        ]
        for c in seed_citizens:
            self.citizens[c.phone] = c

        # Initial Autonomous System Audit Events
        self.log_event("SYSTEM_BOOT", "CivicPulse AI Control Center Online", "Autonomous multi-agent pipeline ready across 8 wards.")
        self.log_event("ESCALATION", "Ticket #CP-2026-7819 escalated to Level 3", "District Municipal Commissioner alerted due to SLA breach on sewage contamination.", ticket_id="CP-2026-7819")
        self.log_event("CLUSTER_MERGE", "12 citizen complaints clustered in Sector 14", "Agent 5 merged 12 duplicate complaints into Master Incident #CP-2026-8941.", ticket_id="CP-2026-8941")
        self.log_event("CLOSED_LOOP", "Grievance #CP-2026-8720 closed by Citizen", "Pooja Sharma confirmed 5-star resolution of broken streetlight.", ticket_id="CP-2026-8720")

