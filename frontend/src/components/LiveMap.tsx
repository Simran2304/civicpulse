import React, { useState } from 'react';
import { 
  CivicIncident, WardInfo, PriorityLevel 
} from '../types';
import { 
  MapPin, AlertTriangle, ShieldAlert, Layers, 
  Trash2, Droplets, Zap, Car, CheckCircle2, ChevronRight, Clock, User, Phone, Eye
} from 'lucide-react';

interface LiveMapProps {
  incidents: CivicIncident[];
  wards: WardInfo[];
  onSelectIncident: (inc: CivicIncident) => void;
  onOpenGrievanceModal: () => void;
  onOpenPipeline?: (inc: CivicIncident) => void;
}

export const LiveMap: React.FC<LiveMapProps> = ({
  incidents,
  wards,
  onSelectIncident,
  onOpenGrievanceModal,
  onOpenPipeline
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedWardFilter, setSelectedWardFilter] = useState<string>('ALL');
  const [activePin, setActivePin] = useState<CivicIncident | null>(null);
  const [showWardBoundaries, setShowWardBoundaries] = useState<boolean>(true);

  // Filter incidents
  const filteredIncidents = incidents.filter(inc => {
    if (selectedCategory !== 'ALL' && inc.extracted_issue?.category !== selectedCategory) return false;
    if (selectedWardFilter !== 'ALL' && inc.location?.ward_id !== selectedWardFilter) return false;
    return true;
  });

  // Calculate coordinates bounds to project onto SVG viewBox (lat 28.52 to 28.69, lng 77.13 to 77.31)
  const minLat = 28.52, maxLat = 28.69;
  const minLng = 77.13, maxLng = 77.31;

  const projectToSvg = (lat: number, lng: number) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * 800;
    const y = 600 - ((lat - minLat) / (maxLat - minLat)) * 600;
    return { x: Math.max(40, Math.min(760, x)), y: Math.max(40, Math.min(560, y)) };
  };

  const getPriorityColor = (p?: PriorityLevel) => {
    switch (p) {
      case 'CRITICAL': return { bg: 'bg-rose-500', fill: '#f43f5e', stroke: '#fda4af', ring: 'ring-rose-500/50' };
      case 'HIGH': return { bg: 'bg-amber-500', fill: '#f59e0b', stroke: '#fde68a', ring: 'ring-amber-500/50' };
      case 'MEDIUM': return { bg: 'bg-blue-500', fill: '#3b82f6', stroke: '#bfdbfe', ring: 'ring-blue-500/50' };
      case 'LOW': default: return { bg: 'bg-emerald-500', fill: '#10b981', stroke: '#a7f3d0', ring: 'ring-emerald-500/50' };
    }
  };

  const getCategoryIcon = (cat?: string) => {
    switch (cat) {
      case 'solid_waste': return <Trash2 className="w-3.5 h-3.5" />;
      case 'water_sewerage': return <Droplets className="w-3.5 h-3.5" />;
      case 'electrical_power': return <Zap className="w-3.5 h-3.5" />;
      case 'traffic_mobility': return <Car className="w-3.5 h-3.5" />;
      default: return <AlertTriangle className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Top Filter & Quick Action Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-indigo-400" /> Layer:
          </span>
          {[
            { id: 'ALL', label: 'All Incidents' },
            { id: 'solid_waste', label: 'Solid Waste' },
            { id: 'roads_infrastructure', label: 'Roads & PWD' },
            { id: 'water_sewerage', label: 'Water & Sewerage' },
            { id: 'electrical_power', label: 'Power & Lighting' },
            { id: 'traffic_mobility', label: 'Traffic & Transit' }
          ].map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                selectedCategory === c.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Ward Selector & Action */}
        <div className="flex items-center gap-2">
          <select
            value={selectedWardFilter}
            onChange={(e) => setSelectedWardFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All 8 Municipal Wards</option>
            {wards.map(w => (
              <option key={w.id} value={w.id}>{w.id}: {w.name} ({w.zone})</option>
            ))}
          </select>

          <button
            onClick={() => setShowWardBoundaries(!showWardBoundaries)}
            className={`px-2.5 py-1 rounded-lg border text-xs transition-colors ${
              showWardBoundaries 
                ? 'bg-slate-800 border-indigo-500/60 text-indigo-300' 
                : 'bg-slate-950 border-slate-700 text-slate-400'
            }`}
          >
            Ward Grid: {showWardBoundaries ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={onOpenGrievanceModal}
            className="px-3 py-1 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold rounded-lg shadow-md shadow-indigo-500/20 flex items-center gap-1.5 transition-all"
          >
            <MapPin className="w-3.5 h-3.5" /> + Report Issue
          </button>
        </div>

      </div>

      {/* Main Map View Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        
        {/* Map Canvas (Left 3 cols) */}
        <div className="lg:col-span-3 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden relative shadow-2xl">
          
          {/* Map Overlay Header */}
          <div className="absolute top-3 left-3 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-semibold text-white">Live City Geospatial Radar</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {filteredIncidents.length} Geo-tagged Hotspots
            </span>
          </div>

          {/* Map Legend */}
          <div className="absolute bottom-3 left-3 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-3 py-2 rounded-xl shadow-lg text-[11px] space-y-1">
            <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Severity Legend</div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" /> Critical (&gt;80)
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> High (60-80)
              </span>
              <span className="flex items-center gap-1 text-blue-400">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Medium (40-60)
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Low (&lt;40)
              </span>
            </div>
          </div>

          {/* Interactive SVG City Canvas */}
          <div className="w-full h-[540px] relative bg-[#090e1a] select-none overflow-hidden">
            <svg 
              className="w-full h-full" 
              viewBox="0 0 800 600" 
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Grid lines background */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#172238" strokeWidth="0.8" />
                </pattern>
                {/* Glow filter for critical alerts */}
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <rect width="800" height="600" fill="url(#grid)" />

              {/* Major Simulated Arterial River / Waterway */}
              <path 
                d="M 680,0 C 650,150 720,320 660,450 C 620,530 640,600 650,600" 
                fill="none" 
                stroke="#1e3a8a" 
                strokeWidth="28" 
                strokeOpacity="0.35"
              />
              <path 
                d="M 680,0 C 650,150 720,320 660,450 C 620,530 640,600 650,600" 
                fill="none" 
                stroke="#38bdf8" 
                strokeWidth="4" 
                strokeOpacity="0.6" 
                strokeDasharray="6,4"
              />

              {/* Major Arterial Ring Roads */}
              <ellipse cx="400" cy="300" rx="310" ry="210" fill="none" stroke="#334155" strokeWidth="3" strokeDasharray="8,6" opacity="0.6" />
              <line x1="80" y1="300" x2="720" y2="300" stroke="#1e293b" strokeWidth="2.5" />
              <line x1="400" y1="60" x2="400" y2="540" stroke="#1e293b" strokeWidth="2.5" />

              {/* Municipal Ward Polygons and Centroids */}
              {showWardBoundaries && wards.map((w, idx) => {
                const center = projectToSvg(w.lat, w.lng);
                return (
                  <g key={w.id} className="transition-opacity duration-300">
                    {/* Ward Zone Circle */}
                    <circle 
                      cx={center.x} 
                      cy={center.y} 
                      r={72} 
                      fill="#1e293b" 
                      fillOpacity="0.25" 
                      stroke="#475569" 
                      strokeWidth="1.5" 
                      strokeDasharray="4,4" 
                    />
                    {/* Ward Label */}
                    <text 
                      x={center.x} 
                      y={center.y - 48} 
                      textAnchor="middle" 
                      fill="#94a3b8" 
                      fontSize="10" 
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {w.id} • {w.zone}
                    </text>
                    <text 
                      x={center.x} 
                      y={center.y + 54} 
                      textAnchor="middle" 
                      fill="#64748b" 
                      fontSize="9" 
                    >
                      Pop: {(w.population / 1000).toFixed(0)}k | Eff: {w.base_efficiency}%
                    </text>
                  </g>
                );
              })}

              {/* Incident Hotspot Markers */}
              {filteredIncidents.map((inc) => {
                if (!inc.location) return null;
                const pos = projectToSvg(inc.location.latitude, inc.location.longitude);
                const color = getPriorityColor(inc.priority?.priority);
                const isSelected = activePin?.ticket_id === inc.ticket_id;
                const isCritical = inc.priority?.priority === 'CRITICAL';
                const hasCluster = inc.duplicate && inc.duplicate.cluster_size > 1;

                return (
                  <g 
                    key={inc.ticket_id} 
                    transform={`translate(${pos.x}, ${pos.y})`}
                    onClick={() => {
                      setActivePin(inc);
                      onSelectIncident(inc);
                    }}
                    className="cursor-pointer group"
                  >
                    {/* Pulsing critical aura */}
                    {isCritical && (
                      <circle 
                        r="24" 
                        fill={color.fill} 
                        fillOpacity="0.25" 
                        filter="url(#glow)"
                        className="animate-ping" 
                      />
                    )}

                    {/* Outer halo */}
                    <circle 
                      r={isSelected ? 18 : 14} 
                      fill={color.fill} 
                      fillOpacity={isSelected ? "0.4" : "0.2"} 
                      stroke={color.stroke}
                      strokeWidth={isSelected ? "2.5" : "1.5"}
                    />

                    {/* Central Icon Pin */}
                    <circle 
                      r={isSelected ? 9 : 7} 
                      fill={color.fill} 
                      stroke="#ffffff" 
                      strokeWidth="2" 
                    />

                    {/* Duplicate Cluster Badge (e.g. +12) */}
                    {hasCluster && (
                      <g transform="translate(10, -10)">
                        <rect 
                          width="26" 
                          height="14" 
                          rx="7" 
                          fill="#4f46e5" 
                          stroke="#ffffff" 
                          strokeWidth="1" 
                        />
                        <text 
                          x="13" 
                          y="10" 
                          textAnchor="middle" 
                          fill="#ffffff" 
                          fontSize="9" 
                          fontWeight="bold"
                        >
                          +{inc.duplicate?.cluster_size}
                        </text>
                      </g>
                    )}

                    {/* Hover tooltip label */}
                    <text 
                      y={-18} 
                      textAnchor="middle" 
                      fill="#f8fafc" 
                      fontSize="10" 
                      fontWeight="bold"
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900"
                    >
                      {inc.ticket_id} ({inc.priority?.severity_score}/100)
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

        </div>

        {/* Selected Incident Drawer (Right 1 col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-400" /> Incident Inspector
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              {activePin ? activePin.ticket_id : 'Click any Pin'}
            </span>
          </div>

          {activePin ? (
            <div className="space-y-3.5 text-xs animate-in fade-in duration-200">
              
              {/* Image Preview if available */}
              {activePin.image_url && (
                <div className="relative rounded-xl overflow-hidden border border-slate-700 h-32 bg-slate-950">
                  <img 
                    src={activePin.image_url} 
                    alt="Civic Hazard" 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-sm text-[10px] text-cyan-300 font-mono border border-cyan-800/80">
                    Multimodal AI Verified
                  </div>
                </div>
              )}

              {/* Title & Priority Badge */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                    activePin.priority?.priority === 'CRITICAL' 
                      ? 'bg-rose-950 text-rose-300 border border-rose-800' 
                      : activePin.priority?.priority === 'HIGH'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-blue-950 text-blue-300 border border-blue-800'
                  }`}>
                    {activePin.priority?.priority} • Risk {activePin.priority?.severity_score}/100
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    Status: <span className="text-indigo-400 font-semibold">{activePin.current_status}</span>
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-white leading-tight">
                  {activePin.extracted_issue?.summary || activePin.raw_description}
                </h4>
              </div>

              {/* Location & Ward info */}
              <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800/80 space-y-1">
                <div className="flex items-start gap-1.5 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span>{activePin.location?.resolved_address}</span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between pl-5">
                  <span>Ward: {activePin.location?.ward_name}</span>
                  <span className="font-mono text-cyan-400 font-semibold">GPS Tagged</span>
                </div>
              </div>

              {/* Duplicate Cluster Alert (if clustered) */}
              {activePin.duplicate && activePin.duplicate.cluster_size > 1 && (
                <div className="bg-indigo-950/50 border border-indigo-800/60 rounded-xl p-2 text-indigo-200">
                  <div className="flex items-center gap-1.5 font-semibold text-cyan-300 text-[11px]">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Agent 5 Cluster Match ({activePin.duplicate.cluster_size} Citizens)</span>
                  </div>
                  <p className="text-[10px] text-slate-300 mt-0.5">
                    Merged {activePin.duplicate.cluster_size} identical reports in same 350m radius into Master Incident #{activePin.ticket_id}.
                  </p>
                </div>
              )}

              {/* Routing & Lead Officer */}
              <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800/80 space-y-1">
                <div className="text-[11px] text-slate-400 font-semibold uppercase">Assigned Authority</div>
                <div className="text-white font-medium">{activePin.routing?.department_name}</div>
                <div className="text-[11px] text-slate-400">{activePin.routing?.assigned_division}</div>
                <div className="text-[11px] text-indigo-300 flex items-center gap-1 font-mono pt-1">
                  <User className="w-3 h-3" /> {activePin.routing?.lead_officer}
                </div>
              </div>

              {/* SLA Countdown Card */}
              <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">SLA Countdown</div>
                  <div className={`font-mono font-bold text-xs ${
                    activePin.sla?.is_breached ? 'text-rose-400' : 'text-amber-400'
                  }`}>
                    {activePin.sla?.countdown_text || 'Active'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase">Escalation Tier</div>
                  <div className="font-semibold text-indigo-300 text-[11px]">
                    {activePin.escalation?.current_tier || 'LEVEL 1'}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  if (onOpenPipeline) {
                    onOpenPipeline(activePin);
                  } else {
                    onSelectIncident(activePin);
                  }
                }}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-center flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                Inspect Full Agent Traces & Pipeline <ChevronRight className="w-4 h-4" />
              </button>

            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <MapPin className="w-8 h-8 mx-auto text-slate-600 stroke-1" />
              <p className="text-xs">Select any incident marker on the city map to inspect full autonomous telemetry.</p>
              <div className="pt-4">
                <button
                  onClick={() => {
                    if (filteredIncidents.length > 0) {
                      setActivePin(filteredIncidents[0]);
                      onSelectIncident(filteredIncidents[0]);
                    }
                  }}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                >
                  Inspect Sample Hotspot
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
