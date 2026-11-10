import React, { useState, useEffect } from 'react';
import { 
  TransparencyReportData 
} from '../types';
import { 
  fetchTransparencyReport 
} from '../api';
import { 
  Building, Award, CheckCircle2, Clock, Download, 
  BarChart3, TrendingUp, Users, Shield, FileText, Printer
} from 'lucide-react';

export const TransparencyPortal: React.FC = () => {
  const [reportData, setReportData] = useState<TransparencyReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchTransparencyReport()
      .then(res => setReportData(res.report))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadJson = () => {
    if (!reportData) return;
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CivicPulse_Transparency_Report_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const handlePrintAudit = () => {
    window.print();
  };

  if (loading || !reportData) {
    return (
      <div className="text-center py-24 text-slate-400">
        <span className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin inline-block mb-3" />
        <p className="text-sm">Compiling autonomous governance audit data...</p>
      </div>
    );
  }

  const { summary, top_civic_issues, ward_efficiency_rankings, department_leaderboard } = reportData;

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Export Actions */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-800/40 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs border border-emerald-500/30 font-bold">
              Open Governance & Public Accountability
            </span>
            <span className="text-xs text-slate-400">Agent 10 Transparency Engine</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            Metropolis City Municipal Performance Index
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Live public scorecard tracking resolution speed, SLA compliance, department accountability, and Ward Efficiency Ratings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadJson}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4 text-cyan-400" /> Export Open Data (JSON)
          </button>
          <button
            onClick={handlePrintAudit}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-colors"
          >
            <Printer className="w-4 h-4" /> Print Governance Audit Card
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 shadow-lg">
          <div className="text-slate-400 text-xs font-semibold uppercase flex items-center justify-between">
            <span>Total Grievances</span>
            <FileText className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{summary.total_complaints}</div>
          <div className="text-[11px] text-emerald-400 font-medium">
            {summary.overall_resolution_rate}% Resolved / Closed
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 shadow-lg">
          <div className="text-slate-400 text-xs font-semibold uppercase flex items-center justify-between">
            <span>SLA Compliance</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">{summary.sla_compliance_rate}%</div>
          <div className="text-[11px] text-slate-400">
            {summary.breached_count} Overdue Breaches
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 shadow-lg">
          <div className="text-slate-400 text-xs font-semibold uppercase flex items-center justify-between">
            <span>Avg Resolution Time</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400 font-mono">{summary.average_resolution_hours}h</div>
          <div className="text-[11px] text-slate-400">
            Mean Time to Resolve (MTTR)
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 shadow-lg">
          <div className="text-slate-400 text-xs font-semibold uppercase flex items-center justify-between">
            <span>Citizen CSAT Rating</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">{summary.citizen_satisfaction_csat} / 5.0</div>
          <div className="text-[11px] text-slate-400">
            Closed-Loop Verification Feedback
          </div>
        </div>

      </div>

      {/* Ward Efficiency Rankings & Department Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Ward Efficiency Scorecards (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-400" />
                Ward Efficiency Index (0 to 100)
              </h3>
              <p className="text-xs text-slate-400">
                Calculated dynamically from backlog ratio, speed, and dispute frequency
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400 font-bold">8 Wards Audited</span>
          </div>

          <div className="space-y-3">
            {ward_efficiency_rankings.map((ward, idx) => {
              const score = ward.efficiency_score;
              const isTop = idx === 0;

              return (
                <div
                  key={ward.ward_id}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-400">
                          {ward.ward_id}
                        </span>
                        <span className="text-xs font-bold text-white">
                          {ward.ward_name}
                        </span>
                        {isTop && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold text-[9px] border border-amber-500/40">
                            ★ Rank #1
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {ward.counselor} • {ward.zone} Zone • Pop: {(ward.population / 1000).toFixed(0)}k
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-base font-bold font-mono ${
                        score >= 85 ? 'text-emerald-400' : score >= 70 ? 'text-cyan-400' : 'text-amber-400'
                      }`}>
                        {score} <span className="text-xs font-normal text-slate-500">/ 100</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {ward.resolved_tickets} solved | {ward.active_tickets} pending
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        score >= 85 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : score >= 70 ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gradient-to-r from-amber-500 to-orange-400'
                      }`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Department Leaderboard & Category Breakdown (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Department Leaderboard */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                Department SLA Accountability
              </h3>
              <p className="text-xs text-slate-400">
                Resolution rates by municipal authority
              </p>
            </div>

            <div className="space-y-3">
              {department_leaderboard.map((dept) => (
                <div key={dept.department_id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{dept.name} ({dept.code})</span>
                    <span className="font-mono text-emerald-400 font-semibold">{dept.sla_compliance_rate}% SLA</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Officer: {dept.lead.split(',')[0]}</span>
                    <span>{dept.resolved} solved / {dept.total_grievances} total</span>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Top Issues Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Top Reported Grievance Categories:
            </h4>
            <div className="space-y-2">
              {top_civic_issues.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-950">
                  <span className="font-medium text-slate-200">{cat.category}</span>
                  <span className="font-mono font-bold text-indigo-400">{cat.count} Reports</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
