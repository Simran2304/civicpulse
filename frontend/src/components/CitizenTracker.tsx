import React, { useState } from 'react';
import { 
  CivicIncident, IncidentStatus 
} from '../types';
import { 
  verifyCitizenFeedback, markWorkerResolved 
} from '../api';
import { 
  Search, CheckCircle2, AlertTriangle, Star, Check, X, 
  Clock, MapPin, Building2, User, Phone, ShieldCheck, Sparkles
} from 'lucide-react';

interface CitizenTrackerProps {
  incidents: CivicIncident[];
  selectedIncident: CivicIncident | null;
  onSelectIncident: (inc: CivicIncident) => void;
  onRefresh: () => void;
}

const LIFECYCLE_STAGES: IncidentStatus[] = [
  'REPORTED',
  'ASSIGNED',
  'IN_PROGRESS',
  'INSPECTION',
  'RESOLVED',
  'CLOSED'
];

export const CitizenTracker: React.FC<CitizenTrackerProps> = ({
  incidents,
  selectedIncident,
  onSelectIncident,
  onRefresh
}) => {
  const currentTicket = selectedIncident || (incidents.length > 0 ? incidents[0] : null);
  const [searchTicketId, setSearchTicketId] = useState('');
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('Grievance resolved satisfactorily by the municipal team.');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = incidents.find(i => i.ticket_id.toLowerCase() === searchTicketId.trim().toLowerCase());
    if (found) {
      onSelectIncident(found);
      setVerifyMessage(null);
    } else {
      alert(`Ticket #${searchTicketId} not found in active records.`);
    }
  };

  const handleVerify = async (confirmed: boolean) => {
    if (!currentTicket) return;
    setIsVerifying(true);
    setVerifyMessage(null);

    try {
      const res = await verifyCitizenFeedback(currentTicket.ticket_id, {
        confirmed,
        rating: confirmed ? rating : 1,
        feedback_text: confirmed ? feedbackText : 'Disputed: Issue still exists on site.'
      });

      setVerifyMessage(
        confirmed 
          ? `✓ Thank you! Ticket #${currentTicket.ticket_id} verified and officially CLOSED.`
          : `⚠️ Dispute registered! Ticket #${currentTicket.ticket_id} reopened and escalated to Senior Supervisor.`
      );

      onRefresh();
      onSelectIncident(res.incident);
    } catch (err: any) {
      alert("Verification error: " + err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSimulateWorkerResolve = async () => {
    if (!currentTicket) return;
    setIsVerifying(true);
    try {
      const res = await markWorkerResolved(currentTicket.ticket_id, {
        worker_name: 'Field Crew Team Lead',
        resolution_notes: 'Repairs completed and site cleaned. Ready for citizen verification.'
      });
      onRefresh();
      onSelectIncident(res.incident);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const getStageIndex = (status: IncidentStatus) => {
    if (status === 'REOPENED') return 2; // Treat as IN_PROGRESS
    const idx = LIFECYCLE_STAGES.indexOf(status);
    return idx >= 0 ? idx : 0;
  };

  const activeIndex = currentTicket ? getStageIndex(currentTicket.current_status) : 0;

  return (
    <div className="space-y-6">
      
      {/* Top Search & Ticket Picker */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        
        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTicketId}
              onChange={(e) => setSearchTicketId(e.target.value)}
              placeholder="Track ticket ID (e.g. CP-2026-9014)..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition"
          >
            Track
          </button>
        </form>

        {/* Quick Dropdown Selector */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-slate-400">Or Select:</span>
          <select
            value={currentTicket?.ticket_id || ''}
            onChange={(e) => {
              const found = incidents.find(i => i.ticket_id === e.target.value);
              if (found) {
                onSelectIncident(found);
                setVerifyMessage(null);
              }
            }}
            className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-slate-200 focus:outline-none text-xs"
          >
            {incidents.map(inc => (
              <option key={inc.ticket_id} value={inc.ticket_id}>
                #{inc.ticket_id} ({inc.current_status})
              </option>
            ))}
          </select>
        </div>

      </div>

      {verifyMessage && (
        <div className="bg-indigo-950/60 border border-indigo-500/50 p-3.5 rounded-xl text-xs font-medium text-indigo-200 flex items-center gap-2 shadow-md">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{verifyMessage}</span>
        </div>
      )}

      {currentTicket ? (
        <div className="space-y-6">
          
          {/* Visual Lifecycle Stepper (Agent 8) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono font-bold text-indigo-400">
                  #{currentTicket.ticket_id}
                </span>
                <h3 className="text-base font-bold text-white">
                  Grievance Resolution Lifecycle (Agent 8 Tracking)
                </h3>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                currentTicket.current_status === 'CLOSED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                currentTicket.current_status === 'RESOLVED' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                Current: {currentTicket.current_status}
              </span>
            </div>

            {/* Stepper Progress Bar */}
            <div className="py-2">
              <div className="grid grid-cols-6 gap-2">
                {LIFECYCLE_STAGES.map((stage, idx) => {
                  const isPassed = idx < activeIndex;
                  const isCurrent = idx === activeIndex;

                  return (
                    <div key={stage} className="flex flex-col items-center text-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition ${
                        isCurrent 
                          ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/30 shadow-lg' 
                          : isPassed 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-slate-800 text-slate-500'
                      }`}>
                        {isPassed ? <Check className="w-4 h-4" /> : idx + 1}
                      </div>
                      <span className={`text-[11px] font-semibold tracking-tight ${
                        isCurrent ? 'text-indigo-300 font-bold' : isPassed ? 'text-slate-200' : 'text-slate-500'
                      }`}>
                        {stage.replace('_', ' ')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Ticket Information & Closed-Loop Verification Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Ticket Profile Details (6 Columns) */}
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 text-xs">
              <h4 className="font-bold text-white text-sm border-b border-slate-800 pb-2">
                Grievance Information & Department Routing
              </h4>

              <div className="space-y-3">
                <div>
                  <span className="text-slate-400">Citizen Description:</span>
                  <p className="text-white font-medium mt-0.5">"{currentTicket.raw_description}"</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                  <div>
                    <span className="text-slate-400">Assigned Department:</span>
                    <div className="font-semibold text-indigo-300 mt-0.5">
                      {currentTicket.routing?.department_name || 'Municipal Agency'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Division Squad:</span>
                    <div className="font-medium text-slate-200 mt-0.5">
                      {currentTicket.routing?.assigned_division || 'Field Crew Squad'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                  <div>
                    <span className="text-slate-400">Resolved Location:</span>
                    <div className="font-medium text-slate-200 mt-0.5">
                      {currentTicket.location?.resolved_address || currentTicket.location?.raw_location}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Ward & Office:</span>
                    <div className="font-medium text-slate-200 mt-0.5">
                      {currentTicket.location?.ward_name} ({currentTicket.location?.jurisdiction_office})
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                  <div>
                    <span className="text-slate-400">SLA Window:</span>
                    <div className="font-mono text-amber-300 mt-0.5 font-semibold">
                      {currentTicket.sla?.sla_hours || 48}h ({currentTicket.sla?.countdown_text || 'Active'})
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Escalation Tier:</span>
                    <div className="font-semibold text-slate-200 mt-0.5">
                      {currentTicket.escalation?.current_tier || 'Frontline Crew'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Closed-Loop Citizen Verification (Agent 9) (6 Columns) */}
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 text-xs">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  <h4 className="font-bold text-white text-sm">
                    Resolution Verification Agent (Agent 9)
                  </h4>
                </div>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-semibold">
                  GovTech Closed-Loop
                </span>
              </div>

              {currentTicket.current_status === 'CLOSED' ? (
                <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-4 space-y-2 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <div className="font-bold text-white text-sm">Grievance Verified & Closed</div>
                  <p className="text-slate-300 text-xs">
                    This civic ticket has been confirmed fixed by the citizen. Audit logs recorded.
                  </p>
                  {currentTicket.resolution?.citizen_feedback && (
                    <div className="text-[11px] text-emerald-300 italic pt-1">
                      "{currentTicket.resolution.citizen_feedback}"
                    </div>
                  )}
                </div>
              ) : currentTicket.current_status === 'RESOLVED' ? (
                <div className="space-y-4">
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 font-medium">Worker Completion Notes:</span>
                    <p className="text-slate-200 font-medium mt-1">
                      "{currentTicket.resolution?.resolution_notes || 'Repairs completed and inspected on site.'}"
                    </p>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Worker: {currentTicket.resolution?.worker_name || 'Municipal Field Specialist'}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-slate-300 font-medium">
                      Citizen Satisfaction Rating (1 to 5 Stars):
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setRating(s)}
                          className={`p-1.5 rounded-lg border transition ${
                            rating >= s 
                              ? 'bg-amber-500/20 border-amber-500 text-amber-400' 
                              : 'bg-slate-950 border-slate-800 text-slate-600'
                          }`}
                        >
                          <Star className="w-5 h-5 fill-current" />
                        </button>
                      ))}
                      <span className="text-amber-400 font-bold ml-2">{rating} / 5 Stars</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-300 font-medium">
                      Citizen Feedback / Verification Note:
                    </label>
                    <input
                      type="text"
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Enter resolution feedback..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      disabled={isVerifying}
                      onClick={() => handleVerify(true)}
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 disabled:opacity-50 text-xs"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirm & Close</span>
                    </button>

                    <button
                      type="button"
                      disabled={isVerifying}
                      onClick={() => handleVerify(false)}
                      className="py-2.5 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-200 border border-rose-500/40 font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50 text-xs"
                    >
                      <X className="w-4 h-4" />
                      <span>Dispute Resolution</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 text-center space-y-3">
                  <Clock className="w-8 h-8 text-amber-400 mx-auto" />
                  <div className="font-semibold text-white">Work Currently in Progress</div>
                  <p className="text-slate-400 text-xs max-w-sm mx-auto">
                    The complaint is actively assigned to the field squad ({currentTicket.routing?.assigned_division}). Once the worker finishes and marks it resolved, the closed-loop citizen verification portal will activate.
                  </p>
                  <button
                    type="button"
                    onClick={handleSimulateWorkerResolve}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-semibold text-xs transition"
                  >
                    Simulate Worker Completion Now
                  </button>
                </div>
              )}

            </div>

          </div>

        </div>
      ) : null}

    </div>
  );
};
export default CitizenTracker;
