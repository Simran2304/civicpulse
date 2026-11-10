import React, { useState, useEffect } from 'react';
import { 
  SimulationEvent 
} from '../types';
import { 
  fetchSimulationEvents, triggerSurgeScenario, advanceSimulationTime, syncClockToRealtime 
} from '../api';
import { 
  FastForward, Play, AlertTriangle, Layers, Clock, 
  Sparkles, RefreshCw, Zap, ShieldAlert, CheckCircle2, Terminal
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SimulationHubProps {
  simulatedTime: string;
  onAdvanceTime: (hours: number) => void;
  onRefreshData: () => void;
  isSimulating: boolean;
}

export const SimulationHub: React.FC<SimulationHubProps> = ({
  simulatedTime,
  onAdvanceTime,
  onRefreshData,
  isSimulating
}) => {
  const [events, setEvents] = useState<SimulationEvent[]>([]);
  const [customHours, setCustomHours] = useState<number>(6);
  const [isSurging, setIsSurging] = useState<boolean>(false);
  const [surgeMessage, setSurgeMessage] = useState<string>('');

  const loadEvents = async () => {
    try {
      const res = await fetchSimulationEvents(50);
      setEvents(res.events);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadEvents();
    const interval = setInterval(loadEvents, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerSurge = async (scenario: string) => {
    setIsSurging(true);
    setSurgeMessage('');
    try {
      const res = await triggerSurgeScenario(scenario);
      setSurgeMessage(`Simulated burst generated ${res.generated_tickets_count} citizen complaints! Autonomous duplicate clustering & priority upscaling active.`);
      confetti({ particleCount: 80, spread: 60 });
      onRefreshData();
      loadEvents();
    } catch (err: any) {
      alert("Surge trigger error: " + err.message);
    } finally {
      setIsSurging(false);
    }
  };

  const handleResetToRealtime = async () => {
    try {
      await syncClockToRealtime();
      onRefreshData();
      loadEvents();
      setSurgeMessage("Urban operations clock synced to current real-world local time.");
    } catch (err: any) {
      alert("Sync error: " + err.message);
    }
  };

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'ESCALATION':
        return { bg: 'bg-rose-950/80 text-rose-300 border-rose-800', label: 'Escalation Alert' };
      case 'CLUSTER_MERGE':
        return { bg: 'bg-indigo-950/80 text-indigo-300 border-indigo-800', label: 'Cluster Merged' };
      case 'CLOSED_LOOP':
        return { bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-800', label: 'Citizen Confirmed' };
      case 'DISPUTE':
        return { bg: 'bg-amber-950/80 text-amber-300 border-amber-800', label: 'False Resolution Flag' };
      case 'INTAKE':
        return { bg: 'bg-cyan-950/80 text-cyan-300 border-cyan-800', label: 'New Grievance' };
      default:
        return { bg: 'bg-slate-800 text-slate-300 border-slate-700', label: type };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-950/50 via-slate-900 to-indigo-950/50 border border-purple-800/40 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-xs border border-purple-500/30 font-bold">
              Urban Operations Time-Machine
            </span>
            <span className="text-xs text-slate-400">Deterministic Simulation Engine</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            Simulate Urban Clock & Surge Complaint Influx
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Advance municipal time forward to test automated SLA countdowns, Level 2/3 Commissioner escalations, and inject real-time complaint spikes to watch Agent 5 cluster duplicate tickets.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-xs font-mono">
          <Clock className="w-4 h-4 text-purple-400" />
          <span className="text-slate-300">{simulatedTime}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Simulation Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Time Fast-Forward Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FastForward className="w-4 h-4 text-indigo-400" /> Fast-Forward City Clock
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">SLA & Escalation Trigger</span>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {[6, 12, 24].map((hrs) => (
                  <button
                    key={hrs}
                    onClick={() => onAdvanceTime(hrs)}
                    disabled={isSimulating}
                    className="py-2.5 bg-slate-950 hover:bg-indigo-600 hover:text-white border border-slate-800 rounded-xl text-xs font-bold text-slate-200 transition-colors disabled:opacity-50"
                  >
                    +{hrs} Hours
                  </button>
                ))}
              </div>

              {/* Custom Slider */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Custom Advance:</span>
                  <span className="font-mono font-bold text-cyan-400">+{customHours} Hours</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="48"
                  value={customHours}
                  onChange={(e) => setCustomHours(parseInt(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <button
                  onClick={() => onAdvanceTime(customHours)}
                  disabled={isSimulating}
                  className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-lg text-xs shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  Advance +{customHours}h & Check Escalations
                </button>
              </div>

              {/* Reset to Real Time */}
              <button
                onClick={handleResetToRealtime}
                disabled={isSimulating}
                className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-emerald-400 border border-emerald-800/80 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Reset / Sync to Current Real-World Time</span>
              </button>
            </div>
          </div>

          {/* Surge Complaint Spikes (Agent 5 Clustering Demo) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" /> Inject Complaint Surge
              </h3>
              <span className="text-[11px] text-cyan-400 font-mono">Agent 5 Test</span>
            </div>

            <p className="text-xs text-slate-400">
              Trigger high-volume citizen call spikes to demonstrate automated 350m spatial clustering and priority escalation:
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => handleTriggerSurge("sector_14_garbage_surge")}
                disabled={isSurging}
                className="w-full text-left p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500 transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-white group-hover:text-indigo-300">
                  <span>Sector 14 Solid Waste Surge</span>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Injects 5 concurrent citizen calls in Sector 14 market $\rightarrow$ Clusters into Master Incident #CP-2026-8941.
                </div>
              </button>

              <button
                onClick={() => handleTriggerSurge("riverfront_flood_surge")}
                disabled={isSurging}
                className="w-full text-left p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500 transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-white group-hover:text-cyan-300">
                  <span>Monsoon Riverfront Flash Flood</span>
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Injects 3 critical waterlogging reports in Ward-04 $\rightarrow$ Validates predictive engine correlation.
                </div>
              </button>
            </div>

            {surgeMessage && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs animate-in fade-in duration-200">
                {surgeMessage}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Real-Time Autonomous Agent Event Log (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-cyan-400" />
                Live Autonomous System Audit Feed
              </h3>
              <p className="text-xs text-slate-400">
                Real-time chronological events stream across all 11 agents
              </p>
            </div>
            <button
              onClick={loadEvents}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Refresh Event Feed"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
            {events.map((evt) => {
              const badge = getEventBadge(evt.type);
              return (
                <div
                  key={evt.id}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${badge.bg}`}>
                      {badge.label}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {evt.timestamp}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-white">
                    {evt.title}
                  </div>

                  <p className="text-[11px] text-slate-400">
                    {evt.details}
                  </p>
                </div>
              );
            })}
          </div>

        </div>

      </div>

    </div>
  );
};
