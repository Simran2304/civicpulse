import React, { useState } from 'react';
import { 
  CivicIncident, AgentExecutionTrace 
} from '../types';
import { 
  Terminal, CheckCircle2, Clock, ChevronDown, ChevronRight, 
  Sparkles, Layers, ShieldCheck, Cpu, ArrowDown, ExternalLink
} from 'lucide-react';

interface AgentPipelineViewerProps {
  selectedIncident: CivicIncident | null;
  allIncidents: CivicIncident[];
  onSelectAnotherIncident: (inc: CivicIncident) => void;
}

export const AgentPipelineViewer: React.FC<AgentPipelineViewerProps> = ({
  selectedIncident,
  allIncidents,
  onSelectAnotherIncident
}) => {
  const [expandedTraceIdx, setExpandedTraceIdx] = useState<number | null>(0);

  // Fallback to first incident if none selected
  const activeIncident = selectedIncident || (allIncidents.length > 0 ? allIncidents[0] : null);

  const agentsCatalog = [
    { id: 'AGENT-01', name: 'Complaint Understanding Agent', role: 'NLP Entity & Urgency Extraction', icon: '🧠' },
    { id: 'AGENT-02', name: 'Location Intelligence Agent', role: 'Vague Location Geocoding & Ward Mapping', icon: '📍' },
    { id: 'AGENT-04', name: 'Priority & Severity Agent', role: 'Multi-factor Risk Scoring (0-100)', icon: '⚖️' },
    { id: 'AGENT-03', name: 'Department Routing Agent', role: 'Jurisdiction & Lead Officer Assignment', icon: '🏛️' },
    { id: 'AGENT-05', name: 'Duplicate Detection Agent', role: 'Spatio-Temporal DBSCAN Clustering', icon: '🔍' },
    { id: 'AGENT-06', name: 'SLA & Deadline Agent', role: 'Dynamic Countdown & Breach Forecasting', icon: '⏱️' },
    { id: 'AGENT-07', name: 'Multi-Tier Escalation Agent', role: 'Autonomous Hierarchical Advancement', icon: '🚨' },
    { id: 'AGENT-08', name: 'Workflow Tracking Agent', role: 'Deterministic Lifecycle State Machine', icon: '🔄' },
    { id: 'AGENT-09', name: 'Resolution Verification Agent', role: 'Closed-Loop Citizen Confirmation & Inspection', icon: '✅' },
    { id: 'AGENT-10', name: 'Transparency Reporting Agent', role: 'Ward Efficiency Index & Open Data', icon: '📊' },
    { id: 'AGENT-11', name: 'Master Orchestrator Agent', role: 'Pipeline Bus & Telemetry Director', icon: '⚡' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 font-mono text-xs border border-cyan-800/80 font-bold">
              Autonomous Multi-Agent Architecture
            </span>
            <span className="text-xs text-slate-400">11 Specialized AI Agents</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            Agentic Pipeline & Telemetry Inspector
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl">
            Inspect step-by-step intermediate reasoning, sub-agent microsecond latencies, confidence scores, and heuristic rule matches for any civic complaint.
          </p>
        </div>

        {/* Incident Selector */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-2 rounded-xl text-xs">
          <span className="text-slate-400 font-mono">Inspecting Ticket:</span>
          <select
            value={activeIncident?.ticket_id || ''}
            onChange={(e) => {
              const inc = allIncidents.find(i => i.ticket_id === e.target.value);
              if (inc) onSelectAnotherIncident(inc);
            }}
            className="bg-slate-900 border border-slate-700 text-cyan-300 font-mono font-bold rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-indigo-500"
          >
            {allIncidents.map(i => (
              <option key={i.ticket_id} value={i.ticket_id}>
                #{i.ticket_id} — {i.extracted_issue?.issue_type || 'Civic Ticket'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Visual Pipeline Flow Chart (Horizontal / Flowing) */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl overflow-x-auto">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-indigo-400" />
          <span>Autonomous Multi-Agent Execution Flow</span>
        </div>

        <div className="flex items-center min-w-[950px] gap-2 pb-2">
          {[
            { step: '1. Citizen Input', sub: 'Voice / Photo / Text', color: 'border-slate-700 bg-slate-900' },
            { step: '2. Understand', sub: 'Agent 1: NLU & Urgency', color: 'border-indigo-600 bg-indigo-950/60' },
            { step: '3. Geotag & Ward', sub: 'Agent 2: GIS Spatial', color: 'border-indigo-600 bg-indigo-950/60' },
            { step: '4. Risk Scoring', sub: 'Agent 4: Multi-Factor', color: 'border-indigo-600 bg-indigo-950/60' },
            { step: '5. Route Dept', sub: 'Agent 3: Jurisdiction', color: 'border-indigo-600 bg-indigo-950/60' },
            { step: '6. Dedup Cluster', sub: 'Agent 5: 350m Radius', color: 'border-indigo-600 bg-indigo-950/60' },
            { step: '7. Dynamic SLA', sub: 'Agent 6: Deadline Clock', color: 'border-indigo-600 bg-indigo-950/60' },
            { step: '8. Auto Escalate', sub: 'Agent 7: Tier 1/2/3', color: 'border-indigo-600 bg-indigo-950/60' },
            { step: '9. Closed-Loop', sub: 'Agent 9: Citizen Verify', color: 'border-emerald-600 bg-emerald-950/60' },
          ].map((item, idx) => (
            <React.Fragment key={idx}>
              <div className={`p-2.5 rounded-xl border ${item.color} text-center flex-1 min-w-[100px] shadow-sm`}>
                <div className="text-xs font-bold text-white whitespace-nowrap">{item.step}</div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{item.sub}</div>
              </div>
              {idx < 8 && (
                <div className="text-indigo-400 font-bold text-xs shrink-0">→</div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Traces View & Agents Catalog */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Step-by-Step Execution Traces for Selected Incident (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-cyan-400" />
                Live Agent Execution Traces
              </h3>
              <p className="text-xs text-slate-400">
                Ticket #{activeIncident?.ticket_id} • Status: <span className="text-indigo-400 font-semibold">{activeIncident?.current_status}</span>
              </p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
              {activeIncident?.agent_traces?.length || 0} Agent Invocations
            </span>
          </div>

          {activeIncident?.agent_traces && activeIncident.agent_traces.length > 0 ? (
            <div className="space-y-3">
              {activeIncident.agent_traces.map((trace, idx) => {
                const isExpanded = expandedTraceIdx === idx;
                return (
                  <div
                    key={idx}
                    className={`rounded-xl border transition-all overflow-hidden ${
                      isExpanded 
                        ? 'border-indigo-500/80 bg-slate-950/90 shadow-lg' 
                        : 'border-slate-800/80 bg-slate-950/50 hover:border-slate-700'
                    }`}
                  >
                    {/* Collapsible Header */}
                    <div
                      onClick={() => setExpandedTraceIdx(isExpanded ? null : idx)}
                      className="p-3.5 flex items-center justify-between cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="font-mono text-xs font-bold text-cyan-300">
                          {trace.agent_id}
                        </span>
                        <span className="text-xs font-semibold text-white">
                          {trace.agent_name}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[11px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {trace.duration_ms} ms
                        </span>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Summary row */}
                    <div className="px-3.5 pb-2.5 text-xs text-slate-300 flex items-center justify-between">
                      <span className="truncate max-w-[420px] text-slate-400">
                        {trace.output_summary}
                      </span>
                    </div>

                    {/* Expanded Reasoning & Telemetry Log */}
                    {isExpanded && (
                      <div className="px-3.5 pb-3.5 pt-2 border-t border-slate-800/80 bg-slate-950 space-y-2 text-xs">
                        <div className="text-[10px] text-slate-500 font-mono uppercase">
                          Execution Reasoning & Heuristic Traces:
                        </div>

                        <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1 overflow-x-auto">
                          {trace.reasoning_log && trace.reasoning_log.map((log, lIdx) => (
                            <div key={lIdx} className="flex items-start gap-2">
                              <span className="text-indigo-400 font-bold shrink-0">›</span>
                              <span>{log}</span>
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono pt-1">
                          <div>Input: <span className="text-slate-200">{trace.input_summary}</span></div>
                          <div>Timestamp: <span className="text-slate-200">{trace.timestamp.split('T')[1]?.slice(0, 8)}</span></div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              No traces recorded for this incident. Submit a new complaint via Citizen Portal to generate live telemetry!
            </div>
          )}

        </div>

        {/* Right: Complete 11-Agent Architecture Catalog (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              11-Agent System Specification
            </h3>
            <p className="text-xs text-slate-400">
              GovTech Autonomous Urban Operations Architecture
            </p>
          </div>

          <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
            {agentsCatalog.map((agent) => (
              <div
                key={agent.id}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-indigo-500/60 transition-colors space-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{agent.icon}</span>
                    <span className="font-bold text-xs text-white">{agent.name}</span>
                  </div>
                  <span className="font-mono text-[10px] text-cyan-400 font-semibold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">
                    {agent.id}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 pl-7">
                  {agent.role}
                </p>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
};
