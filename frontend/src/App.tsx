import React, { useState, useEffect, useCallback } from 'react';
import { 
  CivicIncident, WardInfo 
} from './types';
import { 
  fetchIncidents, fetchWards, resetDatabase 
} from './api';
import { Header } from './components/Header';
import { GrievanceIntakePipeline } from './components/GrievanceIntakePipeline';
import { OperationsDesk } from './components/OperationsDesk';
import { CityHeatmapPredictive } from './components/CityHeatmapPredictive';
import { TransparencyReport } from './components/TransparencyReport';
import { CitizenReputationHub } from './components/CitizenReputationHub';

export const App: React.FC = () => {
  // Default tab is 'intake' - crystal clear 1st screen for users & judges!
  const [currentTab, setCurrentTab] = useState<string>('intake');
  const [incidents, setIncidents] = useState<CivicIncident[]>([]);
  const [wards, setWards] = useState<WardInfo[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Derived selected incident using ticket_id string (avoids infinite loops)
  const selectedIncident = incidents.find(i => i.ticket_id === selectedTicketId) 
    || (incidents.length > 0 ? incidents[0] : null);

  // Derived counts for GovTech live metrics
  const activeCount = incidents.filter(i => !['CLOSED', 'RESOLVED'].includes(i.current_status)).length;
  const breachCount = incidents.filter(i => i.sla?.breach_risk_level === 'IMMINENT' || i.sla?.is_breached).length;
  const escalatedCount = incidents.filter(i => i.escalation && !['NONE', 'LEVEL_1_FIELD_CREW'].includes(i.escalation.current_tier)).length;
  const resolvedCount = incidents.filter(i => ['RESOLVED', 'CLOSED'].includes(i.current_status)).length;

  // Stable loadData with NO object reference dependencies
  const loadData = useCallback(async () => {
    try {
      const [incRes, wRes] = await Promise.all([
        fetchIncidents(),
        fetchWards()
      ]);
      setIncidents(incRes.incidents);
      setWards(wRes);
    } catch (err) {
      console.error("Data refresh failed", err);
    }
  }, []);

  // Poll every 20 seconds to keep live SLA countdowns and statuses synchronized
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 20000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const handleReset = async () => {
    if (confirm("Reset database to clean default sample scenarios from Problem Statement PS-10?")) {
      setIsRefreshing(true);
      try {
        await resetDatabase();
        await loadData();
        setSelectedTicketId(null);
        alert("✓ Database reset to clean default scenarios from PS-10!");
      } catch (err: any) {
        alert("Reset failed: " + err.message);
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const handleSelectIncident = (inc: CivicIncident) => {
    setSelectedTicketId(inc.ticket_id);
  };

  const handleOpenPipeline = (inc: CivicIncident) => {
    setSelectedTicketId(inc.ticket_id);
    setCurrentTab('intake');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Top Header with Real-Time Clock & Metrics */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        activeCount={activeCount}
        breachCount={breachCount}
        escalatedCount={escalatedCount}
        resolvedCount={resolvedCount}
        onRefresh={handleRefresh}
        onReset={handleReset}
        isRefreshing={isRefreshing}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* TAB 1: Grievance Intake & 11-Agent AI Flow (Primary step-by-step workflow) */}
        {currentTab === 'intake' && (
          <GrievanceIntakePipeline
            allIncidents={incidents}
            selectedIncident={selectedIncident}
            onSelectIncident={handleSelectIncident}
            onIncidentUpdated={loadData}
          />
        )}

        {/* TAB 2: Operations Control Desk & Department Routing (Real-Time City Dashboard) */}
        {currentTab === 'operations' && (
          <OperationsDesk
            incidents={incidents}
            onSelectIncident={handleSelectIncident}
            onRefresh={loadData}
            onOpenPipeline={handleOpenPipeline}
          />
        )}

        {/* TAB 3: City Heatmap & Predictive AI (Advanced Features 1 & 2) */}
        {currentTab === 'heatmap' && (
          <CityHeatmapPredictive
            incidents={incidents}
            wards={wards}
            onSelectIncident={handleSelectIncident}
            onOpenPipeline={handleOpenPipeline}
          />
        )}

        {/* TAB 4: Transparency & Governance Reports (Agent 10 & Advanced Feature 6) */}
        {currentTab === 'transparency' && (
          <TransparencyReport />
        )}

        {/* TAB 5: Citizen Trust & Reputation Hub (Advanced Feature 3) */}
        {currentTab === 'reputation' && (
          <CitizenReputationHub />
        )}

      </main>

      {/* GovTech Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-3.5 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span className="font-semibold text-slate-300">CivicPulse AI (PS-10)</span>
            <span>— Smart City Grievance & Urban Operations System</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Multi-Agent Architecture: 11 AI Agents • Real-Time Location & Time Enabled
          </div>
        </div>
      </footer>

    </div>
  );
};
export default App;
