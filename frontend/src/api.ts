import { 
  CivicIncident, WardInfo, PredictiveRisk, TransparencyReportData,
  CitizenProfile, SimulationEvent 
} from './types';

const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchIncidents(params?: {
  status?: string;
  ward_id?: string;
  priority?: string;
  category?: string;
  search?: string;
}): Promise<{ count: number; total: number; simulated_time: string; incidents: CivicIncident[] }> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.ward_id) query.set('ward_id', params.ward_id);
  if (params?.priority) query.set('priority', params.priority);
  if (params?.category) query.set('category', params.category);
  if (params?.search) query.set('search', params.search);

  const res = await fetch(`${API_BASE}/incidents?${query.toString()}`);
  return res.json();
}

export async function fetchIncidentDetail(ticketId: string): Promise<CivicIncident> {
  const res = await fetch(`${API_BASE}/incidents/${ticketId}`);
  if (!res.ok) throw new Error('Incident not found');
  return res.json();
}

export async function createGrievance(data: {
  description: string;
  location: string;
  citizen_name?: string;
  citizen_phone?: string;
  image_preset?: string;
  image_base64?: string;
  latitude?: number;
  longitude?: number;
  simulated_weather?: string;
}): Promise<{ message: string; ticket_id: string; incident: CivicIncident }> {
  const res = await fetch(`${API_BASE}/incidents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to register complaint');
  return res.json();
}

export async function markWorkerResolved(ticketId: string, data: {
  worker_name: string;
  resolution_notes: string;
  resolution_photo_url?: string;
}) {
  const res = await fetch(`${API_BASE}/incidents/${ticketId}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function verifyCitizenFeedback(ticketId: string, data: {
  confirmed: boolean;
  rating: number;
  feedback_text: string;
}) {
  const res = await fetch(`${API_BASE}/incidents/${ticketId}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function flagIncidentAsFalse(ticketId: string, reason?: string) {
  const res = await fetch(`${API_BASE}/incidents/${ticketId}/flag-false`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: reason || 'Physical inspection confirmed no issue on site. Fabricated / false report.' })
  });
  if (!res.ok) throw new Error('Failed to flag false complaint');
  return res.json();
}

export async function transitionIncidentStatus(ticketId: string, data: {
  new_status: string;
  actor: string;
  note: string;
}) {
  const res = await fetch(`${API_BASE}/incidents/${ticketId}/transition`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function advanceIncidentStage(ticketId: string): Promise<{
  message: string;
  ticket_id: string;
  previous_status: string;
  current_status: string;
  incident: CivicIncident;
}> {
  const res = await fetch(`${API_BASE}/incidents/${ticketId}/advance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'Failed to advance stage');
  }
  return res.json();
}

export async function escalateIncidentTier(ticketId: string, reason?: string): Promise<{
  message: string;
  ticket_id: string;
  new_tier: string;
  escalated_to: string;
  action_taken: string;
  incident: CivicIncident;
}> {
  const query = reason ? `?reason=${encodeURIComponent(reason)}` : '';
  const res = await fetch(`${API_BASE}/incidents/${ticketId}/escalate${query}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'Failed to escalate ticket');
  }
  return res.json();
}

export async function resetDatabase(): Promise<{ message: string; count: number }> {
  const res = await fetch(`${API_BASE}/incidents/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'Failed to reset database');
  }
  return res.json();
}

export async function fetchTransparencyReport(): Promise<{
  report: TransparencyReportData;
  agent_trace: any;
}> {
  const res = await fetch(`${API_BASE}/transparency/report`);
  return res.json();
}

export async function fetchPredictiveRisks(): Promise<{
  simulated_time: string;
  weather_condition: string;
  rainfall_mm: number;
  active_risks_count: number;
  predictive_risks: PredictiveRisk[];
}> {
  const res = await fetch(`${API_BASE}/predictive/risks`);
  return res.json();
}

export async function advanceSimulationTime(hours: number) {
  const res = await fetch(`${API_BASE}/simulation/advance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hours })
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || `Server returned error status ${res.status}`);
  }
  return res.json();
}

export async function syncClockToRealtime(): Promise<{
  current_simulated_time: string;
  is_realtime: boolean;
  offset_hours: number;
}> {
  const res = await fetch(`${API_BASE}/simulation/sync-realtime`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || 'Failed to sync clock to real time');
  }
  return res.json();
}

export async function setSimulatedWeather(weather: string, rainfall_mm: number) {
  const res = await fetch(`${API_BASE}/simulation/weather`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ weather, rainfall_mm })
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || `Server returned error status ${res.status}`);
  }
  return res.json();
}

export async function fetchWards(): Promise<WardInfo[]> {
  const res = await fetch(`${API_BASE}/wards`);
  return res.json();
}

export async function fetchImagePresets() {
  const res = await fetch(`${API_BASE}/image-analysis/presets`);
  return res.json();
}

export async function fetchCitizens(): Promise<{ count: number; citizens: CitizenProfile[] }> {
  const res = await fetch(`${API_BASE}/citizens`);
  return res.json();
}

export async function fetchCitizenProfile(phone: string): Promise<CitizenProfile> {
  const res = await fetch(`${API_BASE}/citizens/${encodeURIComponent(phone)}`);
  if (!res.ok) throw new Error('Citizen not found');
  return res.json();
}

export async function fetchSimulationEvents(limit = 40): Promise<{ count: number; events: SimulationEvent[] }> {
  const res = await fetch(`${API_BASE}/simulation/events?limit=${limit}`);
  return res.json();
}

export async function triggerSurgeScenario(scenario: string): Promise<{
  scenario: string;
  generated_tickets_count: number;
  tickets: string[];
}> {
  const res = await fetch(`${API_BASE}/simulation/surge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario })
  });
  return res.json();
}
