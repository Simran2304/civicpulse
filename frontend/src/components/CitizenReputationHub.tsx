import React, { useState, useEffect } from 'react';
import { 
  CitizenProfile 
} from '../types';
import { 
  fetchCitizens 
} from '../api';
import { 
  Users, Award, ShieldCheck, AlertTriangle, Search, 
  ThumbsUp, ThumbsDown, CheckCircle2, TrendingUp, UserCheck
} from 'lucide-react';

export const CitizenReputationHub: React.FC = () => {
  const [citizens, setCitizens] = useState<CitizenProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchCitizens()
      .then(res => setCitizens(res.citizens))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = citizens.filter(c => {
    if (selectedTier !== 'ALL') {
      if (selectedTier === 'ELITE' && c.reputation_score < 90) return false;
      if (selectedTier === 'VERIFIED' && (c.reputation_score < 75 || c.reputation_score >= 90)) return false;
      if (selectedTier === 'FLAGGED' && c.reputation_score >= 60) return false;
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !c.phone.includes(q)) return false;
    }
    return true;
  });

  const getTierColor = (score: number) => {
    if (score >= 90) return { text: 'text-amber-400', bg: 'bg-amber-950/60 border-amber-800', bar: 'from-amber-500 to-yellow-400' };
    if (score >= 75) return { text: 'text-emerald-400', bg: 'bg-emerald-950/60 border-emerald-800', bar: 'from-emerald-500 to-teal-400' };
    if (score >= 50) return { text: 'text-blue-400', bg: 'bg-blue-950/60 border-blue-800', bar: 'from-blue-500 to-cyan-400' };
    return { text: 'text-rose-400', bg: 'bg-rose-950/60 border-rose-800', bar: 'from-rose-500 to-red-600' };
  };

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-950/50 via-slate-900 to-teal-950/50 border border-emerald-800/40 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs border border-emerald-500/30 font-bold">
              Citizen Trust & Reputation Architecture
            </span>
            <span className="text-xs text-slate-400">Anti-Spam & Credibility Engine</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            Citizen Credibility Directory & Reputation Scorecards
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Incentivize genuine civic reporting while filtering spam and false alerts. Helpful reports earn reputation points (+5 pts upon closed-loop confirmation); repeated false reports decrease credibility.
          </p>
        </div>

        {/* Reputation Rules Quick Card */}
        <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl text-xs space-y-1.5 font-mono">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Reputation Algorithm:</div>
          <div className="flex items-center gap-2 text-emerald-400">
            <ThumbsUp className="w-3.5 h-3.5" /> +5 pts: Verified Resolution Confirmed
          </div>
          <div className="flex items-center gap-2 text-rose-400">
            <ThumbsDown className="w-3.5 h-3.5" /> -20 pts: False Complaint / Spam Penalty
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search citizen by name or phone (+91-...)..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Filter Tier:</span>
          {[
            { id: 'ALL', label: 'All Citizens' },
            { id: 'ELITE', label: 'Elite Watchers (90+)' },
            { id: 'VERIFIED', label: 'Verified Residents (75-89)' },
            { id: 'FLAGGED', label: 'Flagged / Low (<60)' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTier(t.id)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
                selectedTier === t.id 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

      </div>

      {/* Citizens Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Citizen Profile</th>
                <th className="py-3 px-3">Reputation Score</th>
                <th className="py-3 px-3">Trust Tier & Badge</th>
                <th className="py-3 px-3">Reports Filed</th>
                <th className="py-3 px-3">Verified Solved</th>
                <th className="py-3 px-3">False / Disputes</th>
                <th className="py-3 px-3 text-right">Recent Ticket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filtered.map((c) => {
                const color = getTierColor(c.reputation_score);
                const isFlagged = c.reputation_score < 60;

                return (
                  <tr key={c.phone} className="hover:bg-slate-800/40 transition-colors">
                    
                    {/* Name & Phone */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-indigo-400" />
                        <span>{c.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{c.phone}</div>
                    </td>

                    {/* Reputation Score & Meter */}
                    <td className="py-3.5 px-3 min-w-[160px]">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-mono font-bold text-sm ${color.text}`}>
                          {c.reputation_score} / 100
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {c.reputation_score >= 85 ? 'High Trust' : isFlagged ? 'Spam Risk' : 'Standard'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${color.bar}`}
                          style={{ width: `${c.reputation_score}%` }}
                        />
                      </div>
                    </td>

                    {/* Badge & Trust Tier */}
                    <td className="py-3.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${color.bg}`}>
                        {c.badge}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[180px]">
                        {c.trust_tier}
                      </div>
                    </td>

                    {/* Total Reported */}
                    <td className="py-3.5 px-3 font-mono font-semibold text-slate-200">
                      {c.total_reported} Grievances
                    </td>

                    {/* Verified Solved */}
                    <td className="py-3.5 px-3 font-mono font-semibold text-emerald-400">
                      ✓ {c.verified_resolutions} Confirmed
                    </td>

                    {/* False Reports & Disputes */}
                    <td className="py-3.5 px-3 font-mono">
                      {c.false_reports > 0 ? (
                        <span className="text-rose-400 font-bold">
                          {c.false_reports} False Reports
                        </span>
                      ) : (
                        <span className="text-slate-400">0 penalties</span>
                      )}
                    </td>

                    {/* Recent Ticket */}
                    <td className="py-3.5 px-3 text-right font-mono">
                      {c.recent_tickets.length > 0 ? (
                        <span className="px-2 py-1 rounded bg-slate-950 text-cyan-300 border border-slate-800 text-[11px]">
                          #{c.recent_tickets[0]}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
