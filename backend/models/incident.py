"""
CivicPulse AI - Data Models for Incidents, Agents, and Governance
"""

from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
import uuid

class IssueCategory(str, Enum):
    SOLID_WASTE = "solid_waste"
    ROADS_INFRASTRUCTURE = "roads_infrastructure"
    WATER_SEWERAGE = "water_sewerage"
    ELECTRICAL_POWER = "electrical_power"
    TRAFFIC_MOBILITY = "traffic_mobility"
    PUBLIC_HEALTH = "public_health"
    GENERAL = "general"

class PriorityLevel(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class IncidentStatus(str, Enum):
    REPORTED = "REPORTED"
    TRIAGED = "TRIAGED"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    INSPECTION = "INSPECTION"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"
    REOPENED = "REOPENED"

class EscalationTier(str, Enum):
    NONE = "NONE"
    LEVEL_1_FIELD_CREW = "LEVEL_1_FIELD_CREW"
    LEVEL_2_WARD_SUPERVISOR = "LEVEL_2_WARD_SUPERVISOR"
    LEVEL_3_DISTRICT_COMMISSIONER = "LEVEL_3_DISTRICT_COMMISSIONER"

class AgentExecutionTrace(BaseModel):
    agent_id: str
    agent_name: str
    status: str = "completed"
    duration_ms: float
    timestamp: str
    input_summary: str
    output_summary: str
    reasoning_log: List[str] = []
    metadata: Dict[str, Any] = {}

class StatusHistoryEntry(BaseModel):
    status: IncidentStatus
    timestamp: str
    actor: str
    note: str

class EscalationHistoryEntry(BaseModel):
    tier: EscalationTier
    timestamp: str
    reason: str
    escalated_to: str
    action_taken: str

class ExtractedIssueData(BaseModel):
    issue_type: str
    category: IssueCategory
    summary: str
    urgency_signals: List[str] = []
    detected_keywords: List[str] = []
    sentiment: str = "neutral"
    has_safety_hazard: bool = False
    has_health_hazard: bool = False
    has_traffic_impact: bool = False
    visual_features: Optional[Dict[str, Any]] = None

class ResolvedLocationData(BaseModel):
    raw_location: str
    resolved_address: str
    ward_id: str
    ward_name: str
    zone: str
    latitude: float
    longitude: float
    confidence_score: float = 0.95
    landmark_detected: Optional[str] = None
    jurisdiction_office: str

class DepartmentRoutingData(BaseModel):
    department_id: str
    department_name: str
    department_code: str
    assigned_division: str
    lead_officer: str
    contact_phone: str
    dispatch_notes: str

class PrioritySeverityData(BaseModel):
    severity_score: int  # 0 to 100
    priority: PriorityLevel
    base_hazard: int
    population_density_modifier: int
    weather_multiplier: float
    urgency_bonus: int
    justification: str

class DuplicateClusterData(BaseModel):
    is_duplicate: bool = False
    cluster_id: Optional[str] = None
    is_primary_ticket: bool = True
    cluster_size: int = 1
    similar_complaints: List[str] = []
    similarity_score: float = 0.0

class SLAData(BaseModel):
    sla_hours: int
    deadline: str
    created_at: str
    target_resolution_timestamp: str
    remaining_hours: float
    is_breached: bool = False
    breach_risk_level: str = "LOW"  # LOW, MODERATE, HIGH, IMMINENT, BREACHED
    countdown_text: str = ""

class EscalationData(BaseModel):
    current_tier: EscalationTier = EscalationTier.NONE
    escalated_to: Optional[str] = None
    escalation_count: int = 0
    last_escalation_time: Optional[str] = None
    history: List[EscalationHistoryEntry] = []

class ResolutionVerificationData(BaseModel):
    is_resolved: bool = False
    resolution_timestamp: Optional[str] = None
    resolution_notes: Optional[str] = None
    resolution_photo_url: Optional[str] = None
    worker_name: Optional[str] = None
    citizen_verified: Optional[bool] = None
    citizen_rating: Optional[int] = None  # 1-5
    citizen_feedback: Optional[str] = None
    verification_method: str = "PENDING"  # PENDING, CITIZEN_CONFIRMED, AI_PHOTO_INSPECTED, AUTO_CLOSED
    dispute_count: int = 0

class CivicIncident(BaseModel):
    ticket_id: str = Field(default_factory=lambda: f"CP-{uuid.uuid4().hex[:6].upper()}")
    master_incident_id: Optional[str] = None
    raw_description: str
    citizen_name: str = "Concerned Citizen"
    citizen_phone: str = "+91-98765-XXXXX"
    citizen_reputation_score: int = 85
    citizen_badge: str = "Verified Citizen"
    image_url: Optional[str] = None

    # Agent outputs
    extracted_issue: Optional[ExtractedIssueData] = None
    location: Optional[ResolvedLocationData] = None
    routing: Optional[DepartmentRoutingData] = None
    priority: Optional[PrioritySeverityData] = None
    duplicate: Optional[DuplicateClusterData] = None
    sla: Optional[SLAData] = None
    escalation: EscalationData = Field(default_factory=EscalationData)
    resolution: ResolutionVerificationData = Field(default_factory=ResolutionVerificationData)
    
    # Status & Trail
    current_status: IncidentStatus = IncidentStatus.REPORTED
    status_history: List[StatusHistoryEntry] = []
    agent_traces: List[AgentExecutionTrace] = []
    
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())

class CitizenReportRequest(BaseModel):
    description: str
    location: str
    citizen_name: Optional[str] = "Priya Sharma"
    citizen_phone: Optional[str] = "+91-98765-43210"
    image_preset: Optional[str] = None
    image_base64: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    simulated_weather: Optional[str] = "Clear"
