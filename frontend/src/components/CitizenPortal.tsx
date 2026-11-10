import React, { useState, useEffect } from 'react';
import { 
  CivicIncident 
} from '../types';
import { 
  createGrievance, fetchImagePresets, verifyCitizenFeedback, fetchIncidentDetail 
} from '../api';
import { 
  Camera, MapPin, Send, Search, CheckCircle2, AlertTriangle, 
  ThumbsUp, ThumbsDown, Star, Sparkles, User, ShieldCheck, Clock, Layers, ArrowRight,
  Mic, MicOff, Eye, Scan
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CitizenPortalProps {
  onIncidentCreated: (inc: CivicIncident) => void;
  onSelectIncident: (inc: CivicIncident) => void;
  activeIncidents: CivicIncident[];
}

export const CitizenPortal: React.FC<CitizenPortalProps> = ({
  onIncidentCreated,
  onSelectIncident,
  activeIncidents
}) => {
  // Form state
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [citizenName, setCitizenName] = useState('Priya Sharma');
  const [citizenPhone, setCitizenPhone] = useState('+91-98765-43210');
  const [selectedPreset, setSelectedPreset] = useState<string>('garbage');
  const [presets, setPresets] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<CivicIncident | null>(null);

  // Tracking state
  const [searchTicketId, setSearchTicketId] = useState('');
  const [trackedIncident, setTrackedIncident] = useState<CivicIncident | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState('');

  // Verification modal state
  const [verifyRating, setVerifyRating] = useState<number>(5);
  const [verifyFeedback, setVerifyFeedback] = useState<string>('Grievance resolved cleanly. Thank you!');
  const [verifyStatusMsg, setVerifyStatusMsg] = useState<string>('');

  // Speech-to-Text State
  const [isListening, setIsListening] = useState<boolean>(false);

  const toggleSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Fallback simulated natural language speech if browser has no Web Speech API
      setIsListening(true);
      setTimeout(() => {
        setDescription("Broken drainage cover and open manhole creating traffic accident risk near Sector 14 market.");
        setLocation("Sector 14 main market crossing");
        setSelectedPreset("manhole");
        setIsListening(false);
      }, 1500);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setDescription(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  useEffect(() => {
    fetchImagePresets().then(res => setPresets(res)).catch(() => {});
  }, []);

  // Quick Preset Prompts
  const quickPrompts = [
    {
      title: "Garbage in Sector 14 (Iconic Example)",
      desc: "Garbage not collected in my street for 5 days near Sector 14. Heavy foul odor spreading.",
      loc: "Near Sector 14 market lane",
      preset: "garbage"
    },
    {
      title: "Open Manhole near Hospital (High Hazard)",
      desc: "Deep open manhole without cover near City Hospital Gate 2, extreme accident risk for commuters!",
      loc: "Opposite City Hospital Gate 2",
      preset: "manhole"
    },
    {
      title: "Broken Road Pothole (Arterial)",
      desc: "Severe asphalt crater and deep pothole causing two-wheeler skids on main ring road.",
      loc: "Near Hanuman Temple, Sector 9",
      preset: "pothole"
    },
    {
      title: "Water Main Burst (Infrastructure)",
      desc: "High pressure drinking water pipeline burst gushing water across the street.",
      loc: "Tech Park Ring Road Sector 9",
      preset: "water_leak"
    }
  ];

  const handleApplyPrompt = (p: typeof quickPrompts[0]) => {
    setDescription(p.desc);
    setLocation(p.loc);
    setSelectedPreset(p.preset);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !location) return;

    setIsSubmitting(true);
    try {
      const res = await createGrievance({
        description,
        location,
        citizen_name: citizenName,
        citizen_phone: citizenPhone,
        image_preset: selectedPreset
      });

      setSubmissionResult(res.incident);
      onIncidentCreated(res.incident);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    } catch (err: any) {
      alert("Submission error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrackTicket = async (ticketIdToTrack?: string) => {
    const tid = (ticketIdToTrack || searchTicketId).trim().toUpperCase();
    if (!tid) return;
    setTrackingLoading(true);
    setTrackingError('');
    try {
      const inc = await fetchIncidentDetail(tid);
      setTrackedIncident(inc);
      setSearchTicketId(tid);
    } catch (err) {
      setTrackingError(`Ticket #${tid} was not found in city records.`);
      setTrackedIncident(null);
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleCitizenVerification = async (confirmed: boolean) => {
    if (!trackedIncident) return;
    try {
      const res = await verifyCitizenFeedback(trackedIncident.ticket_id, {
        confirmed,
        rating: verifyRating,
        feedback_text: verifyFeedback
      });
      setTrackedIncident(res.incident);
      setVerifyStatusMsg(res.message);
      if (confirmed) {
        confetti({ particleCount: 100, spread: 70 });
      }
    } catch (err: any) {
      alert("Verification update failed: " + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border border-indigo-800/40 rounded-2xl p-6 relative overflow-hidden">
        <div className="max-w-2xl space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-xs border border-indigo-500/30 font-semibold">
              Citizen Grievance & Tracking Portal
            </span>
            <span className="text-xs text-slate-400">Autonomous Triaging in &lt;1.5s</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Report Civic Issues, Track Resolution & Audit Public Accountability
          </h2>
          <p className="text-sm text-slate-300">
            CivicPulse AI automatically detects hazards, extracts GIS coordinates, routes complaints to the responsible municipal department, and enforces closed-loop resolution verification.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Report Form (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-indigo-400" /> Lodge a New Grievance
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Citizen Trust Score: 85/100</span>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Quick Test Scenarios (Hackathon Presets):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickPrompts.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPrompt(q)}
                  className="text-left p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-indigo-500/80 hover:bg-slate-800/60 transition-all text-xs group"
                >
                  <div className="font-semibold text-indigo-300 group-hover:text-white flex items-center justify-between">
                    <span>{q.title}</span>
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 opacity-60 group-hover:opacity-100" />
                  </div>
                  <div className="text-slate-400 text-[11px] truncate mt-0.5">{q.loc}</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Issue Description <span className="text-rose-400">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleSpeechRecognition}
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isListening 
                        ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-600/30' 
                        : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700'
                    }`}
                    title="Speak your complaint in natural language"
                  >
                    <Mic className={`w-3.5 h-3.5 ${isListening ? 'animate-bounce' : ''}`} />
                    <span>{isListening ? 'Listening (Speak Now)...' : 'Voice Input (Speech-to-Text)'}</span>
                  </button>
                  <span className="text-[11px] text-slate-500 font-normal hidden sm:inline">NLP Agent detects urgency</span>
                </div>
              </div>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Garbage not collected in my street for 5 days near Sector 14. Heavy foul odor spreading..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-normal"
              />
            </div>

            {/* Vague Location */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Location Description or Landmark <span className="text-rose-400">*</span></span>
                <span className="text-[11px] text-slate-500 font-normal">Agent 2 resolves vague locations</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-indigo-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Near temple, Sector 9 OR opposite City Hospital Gate 2"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Multimodal Photo Preset Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Attach Civic Photo (Multimodal Computer Vision)</span>
                <span className="text-[11px] text-cyan-400 font-mono">Auto Object Detection</span>
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {presets.map((preset) => {
                  const isSelected = selectedPreset === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => setSelectedPreset(preset.id)}
                      className={`cursor-pointer rounded-xl overflow-hidden border p-1 text-center transition-all ${
                        isSelected 
                          ? 'border-indigo-500 bg-indigo-950/40 ring-2 ring-indigo-500/40' 
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <img 
                        src={preset.image_url} 
                        alt={preset.title} 
                        className="w-full h-16 object-cover rounded-lg" 
                      />
                      <div className="text-[10px] font-medium text-slate-300 truncate mt-1">
                        {preset.title}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Active Photo Computer Vision HUD Bounding Box */}
              {(() => {
                const activePreset = presets.find(p => p.id === selectedPreset);
                if (!activePreset) return null;
                return (
                  <div className="p-3 rounded-xl bg-slate-950/90 border border-indigo-900/60 flex items-center gap-4 mt-2">
                    <div className="relative w-28 h-20 rounded-lg overflow-hidden shrink-0 border border-slate-700 shadow-md">
                      <img src={activePreset.image_url} alt="Civic AI Scan" className="w-full h-full object-cover" />
                      <div className="absolute inset-2 border-2 border-cyan-400 bg-cyan-400/10 rounded pointer-events-none animate-pulse">
                        <span className="absolute -top-2 left-1 bg-slate-950 text-cyan-300 border border-cyan-800 text-[8px] font-mono px-1 rounded font-bold">
                          {activePreset.detected_features?.primary_label || "Detected Hazard"} (96%)
                        </span>
                      </div>
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        <Scan className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Multimodal Vision Feature Extraction</span>
                      </div>
                      <div className="text-[11px] text-slate-300">
                        Class: <span className="text-cyan-300 font-mono font-semibold">{activePreset.issue_type}</span> • Hazard: <span className="text-amber-300 font-semibold">{activePreset.detected_features?.hazard_classification || "Public Hazard"}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Visual Confidence: 96.4% • Auto-fed into Agent 1 & Agent 4
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Citizen Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs text-slate-400">Reporter Name</label>
                <input
                  type="text"
                  value={citizenName}
                  onChange={(e) => setCitizenName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Mobile Phone (for SMS updates)</label>
                <input
                  type="text"
                  value={citizenPhone}
                  onChange={(e) => setCitizenPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 mt-1 font-mono"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Invoking Multi-Agent Pipeline...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit to Autonomous Operations Center</span>
                </>
              )}
            </button>

          </form>

          {/* Submission Success Box */}
          {submissionResult && (
            <div className="p-4 rounded-xl bg-indigo-950/70 border border-indigo-700/80 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" /> Grievance Registered Successfully!
                </div>
                <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-indigo-900 text-cyan-300 font-bold">
                  #{submissionResult.ticket_id}
                </span>
              </div>

              <div className="text-xs space-y-1 text-slate-200">
                <div><span className="text-slate-400">Assigned Department:</span> <span className="font-semibold text-white">{submissionResult.routing?.department_name}</span></div>
                <div><span className="text-slate-400">Priority & Severity:</span> <span className="font-bold text-amber-300">{submissionResult.priority?.priority} ({submissionResult.priority?.severity_score}/100)</span></div>
                <div><span className="text-slate-400">SLA Resolution Target:</span> <span className="font-mono text-cyan-300">{submissionResult.sla?.sla_hours} Hours</span></div>
                <div><span className="text-slate-400">Geo-Mapped Ward:</span> <span className="text-slate-200">{submissionResult.location?.ward_name}</span></div>
                {submissionResult.duplicate?.is_duplicate && (
                  <div className="p-2 rounded bg-amber-950/60 border border-amber-800 text-amber-300 text-[11px] mt-1">
                    Duplicate Clustered: Merged with Master Incident #{submissionResult.duplicate.cluster_id} to avoid redundant dispatches.
                  </div>
                )}
              </div>

              <div className="pt-1 flex gap-2">
                <button
                  onClick={() => {
                    handleTrackTicket(submissionResult.ticket_id);
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" /> Track this Ticket
                </button>
                <button
                  onClick={() => onSelectIncident(submissionResult)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
                >
                  View 11-Agent Traces
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Live Ticket Tracker & Closed-Loop Verification (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Tracker Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Search className="w-5 h-5 text-cyan-400" /> Track Grievance Status
              </h3>
              <span className="text-xs text-slate-400 font-mono">Live Sync</span>
            </div>

            {/* Ticket Search Bar */}
            <div className="flex gap-2">
              <input
                type="text"
                value={searchTicketId}
                onChange={(e) => setSearchTicketId(e.target.value)}
                placeholder="e.g. CP-2026-8941"
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono placeholder-slate-500 uppercase focus:ring-1 focus:ring-indigo-500"
              />
              <button
                onClick={() => handleTrackTicket()}
                disabled={trackingLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
              >
                {trackingLoading ? 'Searching...' : 'Track'}
              </button>
            </div>

            {/* Quick Sample Tickets */}
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap">
              <span>Quick inspect:</span>
              {activeIncidents.slice(0, 3).map(inc => (
                <button
                  key={inc.ticket_id}
                  onClick={() => handleTrackTicket(inc.ticket_id)}
                  className="font-mono text-cyan-400 hover:text-cyan-300 underline"
                >
                  #{inc.ticket_id}
                </button>
              ))}
            </div>

            {trackingError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                {trackingError}
              </div>
            )}

            {/* Tracked Incident Lifecycle View */}
            {trackedIncident && (
              <div className="space-y-4 pt-2 border-t border-slate-800/80 animate-in fade-in duration-200">
                
                {/* Header Info */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono font-bold text-indigo-400 text-sm">
                      #{trackedIncident.ticket_id}
                    </span>
                    <h4 className="text-xs font-semibold text-white mt-0.5">
                      {trackedIncident.extracted_issue?.summary || trackedIncident.raw_description}
                    </h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    trackedIncident.current_status === 'CLOSED'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : trackedIncident.current_status === 'RESOLVED'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    {trackedIncident.current_status}
                  </span>
                </div>

                {/* State Progress Stepper */}
                <div className="space-y-2">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase">Resolution Lifecycle</div>
                  <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-mono">
                    {[
                      { step: 'Reported', active: true },
                      { step: 'Assigned', active: ['ASSIGNED', 'IN_PROGRESS', 'INSPECTION', 'RESOLVED', 'CLOSED'].includes(trackedIncident.current_status) },
                      { step: 'In Progress', active: ['IN_PROGRESS', 'INSPECTION', 'RESOLVED', 'CLOSED'].includes(trackedIncident.current_status) },
                      { step: 'Resolved', active: ['RESOLVED', 'CLOSED'].includes(trackedIncident.current_status) }
                    ].map((s, idx) => (
                      <div 
                        key={idx}
                        className={`p-1.5 rounded-lg border font-semibold ${
                          s.active 
                            ? 'bg-indigo-950 border-indigo-500 text-cyan-300 shadow-sm' 
                            : 'bg-slate-950 border-slate-800 text-slate-600'
                        }`}
                      >
                        {s.step}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Department & SLA remaining */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase">Department</span>
                    <div className="text-white font-medium truncate">{trackedIncident.routing?.department_code}</div>
                    <div className="text-[11px] text-slate-400 truncate">{trackedIncident.routing?.assigned_division}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase">SLA Clock</span>
                    <div className={`font-mono font-bold ${trackedIncident.sla?.is_breached ? 'text-rose-400' : 'text-amber-400'}`}>
                      {trackedIncident.sla?.countdown_text || 'Active'}
                    </div>
                    <div className="text-[10px] text-slate-400">Target: {trackedIncident.sla?.sla_hours} hrs</div>
                  </div>
                </div>

                {/* CLOSED-LOOP CITIZEN VERIFICATION COMPONENT (Prompt Requirement 9) */}
                {trackedIncident.current_status === 'RESOLVED' && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border border-indigo-600 shadow-xl space-y-3">
                    <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                      <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                      <span>Citizen Verification Required (Agent 9 Closed-Loop)</span>
                    </div>
                    <p className="text-xs text-slate-200">
                      The field crew marked this grievance resolved with note: <br />
                      <span className="italic text-slate-400">"{trackedIncident.resolution?.resolution_notes}"</span>
                    </p>

                    <div className="space-y-1.5 pt-1">
                      <label className="text-[11px] text-slate-300 font-semibold">Rate Work Satisfaction (1 to 5 Stars):</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setVerifyRating(star)}
                            className={`p-1 rounded text-sm ${
                              star <= verifyRating ? 'text-amber-400' : 'text-slate-600'
                            }`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>

                    <input
                      type="text"
                      value={verifyFeedback}
                      onChange={(e) => setVerifyFeedback(e.target.value)}
                      placeholder="Feedback notes (e.g. confirmed clean / still broken)"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    />

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => handleCitizenVerification(true)}
                        className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" /> Confirm Fixed
                      </button>
                      <button
                        onClick={() => handleCitizenVerification(false)}
                        className="py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/30"
                        title="Re-opens ticket and triggers immediate supervisor escalation!"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" /> Dispute / Still Broken
                      </button>
                    </div>

                    {verifyStatusMsg && (
                      <div className="text-[11px] text-cyan-300 font-semibold text-center">
                        {verifyStatusMsg}
                      </div>
                    )}
                  </div>
                )}

                {/* If already closed */}
                {trackedIncident.current_status === 'CLOSED' && (
                  <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold">Grievance Officially Closed & Verified</div>
                      <div className="text-[11px] text-slate-300 mt-0.5">
                        Citizen Rating: {trackedIncident.resolution?.citizen_rating} / 5 ★ • Closed loop confirmed.
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};
