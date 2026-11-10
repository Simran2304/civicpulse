export type PriorityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type IncidentStatus = 
  | 'REPORTED' 
  | 'TRIAGED' 
  | 'ASSIGNED' 
  | 'IN_PROGRESS' 
  | 'INSPECTION' 
  | 'RESOLVED' 
  | 'CLOSED' 
  | 'REOPENED';

export type EscalationTier = 
  | 'NONE' 
  | 'LEVEL_1_FIELD_CREW' 
  | 'LEVEL_2_WARD_SUPERVISOR' 
  | 'LEVEL_3_DISTRICT_COMMISSIONER';

export interface AgentExecutionTrace {
  agent_id: string;
  agent_name: string;
  status: string;
  duration_ms: number;
  timestamp: string;
  input_summary: string;
  output_summary: string;
  reasoning_log: string[];
  metadata?: Record<string, any>;
}

export interface ExtractedIssueData {
  issue_type: string;
  category: string;
  summary: string;
  urgency_signals: string[];
  detected_keywords: string[];
  sentiment: string;
  has_safety_hazard: boolean;
  has_health_hazard: boolean;
  has_traffic_impact: boolean;
  visual_features?: any;
}

export interface ResolvedLocationData {
  raw_location: string;
  resolved_address: string;
  ward_id: string;
  ward_name: string;
  zone: string;
  latitude: number;
  longitude: number;
  confidence_score: number;
  landmark_detected?: string;
  jurisdiction_office: string;
}

export interface DepartmentRoutingData {
  department_id: string;
  department_name: string;
  department_code: string;
  assigned_division: string;
  lead_officer: string;
  contact_phone: string;
  dispatch_notes: string;
}

export interface PrioritySeverityData {
  severity_score: number;
  priority: PriorityLevel;
  base_hazard: number;
  population_density_modifier: number;
  weather_multiplier: number;
  urgency_bonus: number;
  justification: string;
}

export interface DuplicateClusterData {
  is_duplicate: boolean;
  cluster_id: string;
  is_primary_ticket: boolean;
  cluster_size: number;
  similar_complaints: string[];
  similarity_score: number;
}

export interface SLAData {
  sla_hours: number;
  deadline: string;
  created_at: string;
  target_resolution_timestamp: string;
  remaining_hours: number;
  is_breached: boolean;
  breach_risk_level: 'LOW' | 'MODERATE' | 'IMMINENT' | 'BREACHED';
  countdown_text: string;
}

export interface EscalationHistoryEntry {
  tier: EscalationTier;
  timestamp: string;
  reason: string;
  escalated_to: string;
  action_taken: string;
}

export interface EscalationData {
  current_tier: EscalationTier;
  escalated_to?: string;
  escalation_count: number;
  last_escalation_time?: string;
  history: EscalationHistoryEntry[];
}

export interface StatusHistoryEntry {
  status: IncidentStatus;
  timestamp: string;
  actor: string;
  note: string;
}

export interface ResolutionVerificationData {
  is_resolved: boolean;
  resolution_timestamp?: string;
  resolution_notes?: string;
  resolution_photo_url?: string;
  worker_name?: string;
  citizen_verified?: boolean;
  citizen_rating?: number;
  citizen_feedback?: string;
  verification_method: string;
  dispute_count: number;
}

export interface CivicIncident {
  ticket_id: string;
  master_incident_id?: string;
  raw_description: string;
  citizen_name: string;
  citizen_phone: string;
  citizen_reputation_score: number;
  citizen_badge: string;
  image_url?: string;
  extracted_issue?: ExtractedIssueData;
  location?: ResolvedLocationData;
  routing?: DepartmentRoutingData;
  priority?: PrioritySeverityData;
  duplicate?: DuplicateClusterData;
  sla?: SLAData;
  escalation?: EscalationData;
  resolution?: ResolutionVerificationData;
  current_status: IncidentStatus;
  status_history: StatusHistoryEntry[];
  agent_traces: AgentExecutionTrace[];
  created_at: string;
  updated_at: string;
}

export interface WardInfo {
  id: string;
  name: string;
  zone: string;
  lat: number;
  lng: number;
  population: number;
  counselor: string;
  risk_factors: string[];
  base_efficiency: number;
}

export interface PredictiveRisk {
  id: string;
  risk_type: string;
  severity: PriorityLevel;
  probability: number;
  impacted_wards: string[];
  affected_areas: string;
  trigger_factor: string;
  suggested_preventative_action: string;
  forecast_window: string;
}

export interface CitizenProfile {
  phone: string;
  name: string;
  reputation_score: number;
  badge: string;
  total_reported: number;
  verified_resolutions: number;
  false_reports: number;
  disputes_filed: number;
  joined_date: string;
  recent_tickets: string[];
  trust_tier: string;
}

export interface SimulationEvent {
  id: string;
  timestamp: string;
  iso_time: string;
  type: string;
  title: string;
  details: string;
  ticket_id?: string;
}

export interface TransparencyReportData {
  city_name: string;
  generated_at: string;
  summary: {
    total_complaints: number;
    resolved_complaints: number;
    closed_complaints: number;
    in_progress: number;
    breached_count: number;
    escalated_count: number;
    sla_compliance_rate: number;
    overall_resolution_rate: number;
    average_resolution_hours: number;
    citizen_satisfaction_csat: number;
  };
  top_civic_issues: Array<{ category: string; count: number }>;
  ward_efficiency_rankings: Array<{
    ward_id: string;
    ward_name: string;
    zone: string;
    counselor: string;
    population: number;
    efficiency_score: number;
    active_tickets: number;
    resolved_tickets: number;
    breached_tickets: number;
    lat: number;
    lng: number;
  }>;
  department_leaderboard: Array<{
    department_id: string;
    name: string;
    code: string;
    lead: string;
    total_grievances: number;
    resolved: number;
    pending: number;
    sla_compliance_rate: number;
    resolution_rate: number;
  }>;
}
