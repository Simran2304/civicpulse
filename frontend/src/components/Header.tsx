import React, { useState, useEffect } from 'react';
import { 
  FileText, Shield, CheckCircle2, AlertTriangle, 
  RotateCcw, RefreshCw, BarChart3, MapPin, Users, Clock, Radio
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  activeCount: number;
  breachCount: number;
  escalatedCount: number;
  resolvedCount: number;
  onRefresh: () => void;
  onReset: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  activeCount,
  breachCount,
  escalatedCount,
  resolvedCount,
  onRefresh,
  onReset,
  isRefreshing
}) => {
  // Real-time live ticking clock updating every second
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-xl backdrop-blur-md bg-slate-900/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Brand Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between py-3.5 gap-3 border-b border-slate-800/80">
          
          {/* Logo & System Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black text-xl tracking-tighter">
              CP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">CivicPulse AI</h1>
                <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  PS-10 GovTech Core
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-medium px-2 py-0.5 rounded-full">
                  <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
                  11 AI Agents Live
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Autonomous Smart City Grievance & Urban Operations System
              </p>
            </div>
          </div>

          {/* Real-Time Live Clock + Live Metrics & Reset Controls */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-between lg:justify-end">
            
            {/* Real-Time Live Clock Badge */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 shadow-inner">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono text-emerald-400 font-bold">{formattedTime}</span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="text-slate-400 hidden sm:inline text-[11px]">{formattedDate}</span>
            </div>

            {/* Stat Badges */}
            <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
              <span className="text-slate-400">Active:</span>
              <span className="font-bold text-amber-400">{activeCount}</span>
              <span className="text-slate-700">|</span>
              <span className="text-slate-400">Escalated:</span>
              <span className="font-bold text-rose-400">{escalatedCount}</span>
              <span className="text-slate-700">|</span>
              <span className="text-slate-400">SLA Breach:</span>
              <span className="font-bold text-red-400">{breachCount}</span>
              <span className="text-slate-700">|</span>
              <span className="text-slate-400">Resolved:</span>
              <span className="font-bold text-emerald-400">{resolvedCount}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                title="Refresh all records"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
                <span className="hidden md:inline">Refresh</span>
              </button>

              <button
                onClick={onReset}
                title="Reset database to clean default sample scenarios from doc"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset Samples</span>
              </button>
            </div>

          </div>

        </div>

        {/* Clean 5-Tab Navigation Bar Matching Features in Doc */}
        <div className="flex items-center space-x-1 sm:space-x-2 py-2 overflow-x-auto no-scrollbar">
          
          {/* Tab 1: Grievance Intake & Multi-Agent Flow (Core Step-by-Step Flow) */}
          <button
            onClick={() => setCurrentTab('intake')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              currentTab === 'intake'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>1. File Grievance & AI Flow</span>
          </button>

          {/* Tab 2: Operations Control Desk (Real-Time City Dashboard) */}
          <button
            onClick={() => setCurrentTab('operations')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              currentTab === 'operations'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>2. Operations Control Desk</span>
          </button>

          {/* Tab 3: City Heatmap & Predictive AI (Advanced Features 1 & 2) */}
          <button
            onClick={() => setCurrentTab('heatmap')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              currentTab === 'heatmap'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>3. City Heatmap & Predictive AI</span>
          </button>

          {/* Tab 4: Transparency & Governance Report (Agent 10 & Advanced Feature 6) */}
          <button
            onClick={() => setCurrentTab('transparency')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              currentTab === 'transparency'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>4. Transparency Report (Agent 10)</span>
          </button>

          {/* Tab 5: Citizen Reputation Hub (Advanced Feature 3) */}
          <button
            onClick={() => setCurrentTab('reputation')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              currentTab === 'reputation'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>5. Citizen Trust Hub</span>
          </button>

        </div>

      </div>
    </header>
  );
};
export default Header;
