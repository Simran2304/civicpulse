import React, { useState } from 'react';
import { 
  CivicIncident 
} from '../types';
import { 
  advanceIncidentStage, escalateIncidentTier, markWorkerResolved 
} from '../api';
import { 
  Search, Filter, Clock, AlertTriangle, ArrowRight, CheckCircle2, 
  Eye, Building2, UserCheck, ShieldAlert
} from 'lucide-react';

interface OperationsDeskProps {
  incidents: CivicIncident[];
  onSelectIncident: (inc: CivicIncident) => void;
  onRefresh: () => void;
  onOpenPipeline: (inc: CivicIncident) => void;
}

export const OperationsDesk: React.FC<OperationsDeskProps> = ({
  incidents,
  onSelectIncident,
  onRefresh,
  onOpenPipeline
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const filtered = incidents.filter(inc => {
    if (departmentFilter !== 'ALL' && inc.routing?.department_code !== departmentFilter) return false;
    if (statusFilter !== 'ALL' && inc.current_status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && inc.priority?.priority !== priorityFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match = 
        inc.ticket_id.toLowerCase().includes(q) ||
        inc.raw_description.toLowerCase().includes(q) ||
        (inc.location && inc.location.resolved_address.toLowerCase().includes(q)) ||
        (inc.routing && inc.routing.department_name.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const handleAdvance = async (ticketId: string) => {
    setActionLoadingId(ticketId);
    try {
      await advanceIncidentStage(ticketId);
      onRefresh();
    } catch (err: any) {
      alert("Advance failed: " + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleEscalate = async (ticketId: string) => {
    setActionLoadingId(ticketId);
    try {
      await escalateIncidentTier(ticketId, "SLA Delay / Unresolved delay threshold triggered");
      onRefresh();
    } catch (err: any) {
      alert("Escalation failed: " + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResolve = async (ticketId: string) => {
    setActionLoadingId(ticketId);
    try {
      await markWorkerResolved(ticketId, {
        worker_name: 'Municipal Field Specialist',
        resolution_notes: 'Repairs completed on site. Compaction and cleanup verified.'
      });
      onRefresh();
    } catch (err: any) {
      alert("Resolve failed: " + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Top Controls & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Ticket ID, street, or description..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Department Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5">
            <span className="text-slate-400">Dept:</span>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none text-xs"
            >
              <option value="ALL">All Departments</option>
              <option value="SWM">Solid Waste (SWM)</option>
              <option value="PWD">Public Works (PWD)</option>
              <option value="WSSB">Water & Sewerage (WSSB)</option>
              <option value="POWER">Power Utility (EB)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5">
            <span className="text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none text-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="REPORTED">REPORTED</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="INSPECTION">INSPECTION</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5">
            <span className="text-slate-400">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none text-xs"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

        </div>

      </div>

      {/* Grievances List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
            <Building2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <div className="text-sm font-semibold text-white">No complaints match your filters</div>
            <p className="text-xs text-slate-400 mt-1">Try clearing filters or search terms.</p>
          </div>
        ) : (
          filtered.map(inc => {
            const isLoading = actionLoadingId === inc.ticket_id;
            const isClosed = inc.current_status === 'CLOSED';
            const isResolved = ['RESOLVED', 'CLOSED'].includes(inc.current_status);

            return (
              <div 
                key={inc.ticket_id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 shadow-lg transition space-y-3 text-xs"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-white text-sm">
                      #{inc.ticket_id}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      inc.priority?.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      inc.priority?.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      inc.priority?.priority === 'MEDIUM' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {inc.priority?.priority || 'MEDIUM'} ({inc.priority?.severity_score || 50}/100)
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-indigo-300 font-semibold">
                      {inc.routing?.department_name || 'Municipal Agency'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      inc.current_status === 'CLOSED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      inc.current_status === 'RESOLVED' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                      inc.current_status === 'IN_PROGRESS' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                      inc.current_status === 'INSPECTION' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                      'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {inc.current_status}
                    </span>
                  </div>
                </div>

                {/* Body Details */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  
                  {/* Left: Description & Location */}
                  <div className="md:col-span-7 space-y-1">
                    <p className="text-slate-200 font-medium leading-relaxed">
                      "{inc.raw_description}"
                    </p>
                    <div className="flex items-center gap-2 text-slate-400 text-[11px] pt-1">
                      <span>📍 {inc.location?.resolved_address || inc.location?.raw_location}</span>
                      <span>•</span>
                      <span>👤 {inc.citizen_name}</span>
                    </div>
                  </div>

                  {/* Middle: SLA & Escalation Details */}
                  <div className="md:col-span-5 bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/80 flex flex-col justify-between space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">SLA Window:</span>
                      <span className="font-mono text-slate-200">{inc.sla?.sla_hours || 48}h ({inc.sla?.countdown_text || 'Active'})</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Escalation Tier:</span>
                      <span className={`font-semibold ${
                        inc.escalation?.current_tier === 'LEVEL_3_DISTRICT_COMMISSIONER' ? 'text-rose-400' :
                        inc.escalation?.current_tier === 'LEVEL_2_WARD_SUPERVISOR' ? 'text-amber-400' :
                        'text-slate-300'
                      }`}>
                        {inc.escalation?.current_tier || 'Frontline Crew'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Similar Clustered:</span>
                      <span className="text-purple-300 font-medium">{inc.duplicate?.cluster_size || 1} complaints</span>
                    </div>
                  </div>

                </div>

                {/* Action Buttons Row */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 gap-2 flex-wrap">
                  
                  <div className="text-[11px] text-slate-400">
                    Lead Officer: <span className="text-slate-300">{inc.routing?.lead_officer || 'Duty Officer'}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    
                    <button
                      type="button"
                      disabled={isLoading || isClosed}
                      onClick={() => handleAdvance(inc.ticket_id)}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 text-[11px] font-semibold transition flex items-center gap-1 disabled:opacity-40"
                    >
                      <ArrowRight className="w-3 h-3 text-indigo-400" />
                      <span>Advance Stage</span>
                    </button>

                    <button
                      type="button"
                      disabled={isLoading || isClosed}
                      onClick={() => handleEscalate(inc.ticket_id)}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-200 border border-amber-500/40 text-[11px] font-semibold transition flex items-center gap-1 disabled:opacity-40"
                    >
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      <span>Escalate</span>
                    </button>

                    <button
                      type="button"
                      disabled={isLoading || isResolved}
                      onClick={() => handleResolve(inc.ticket_id)}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-200 border border-blue-500/40 text-[11px] font-semibold transition flex items-center gap-1 disabled:opacity-40"
                    >
                      <UserCheck className="w-3 h-3 text-blue-400" />
                      <span>Resolve</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectIncident(inc);
                        onOpenPipeline(inc);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-semibold transition flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3 text-slate-400" />
                      <span>View Agents</span>
                    </button>

                  </div>

                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
export default OperationsDesk;
