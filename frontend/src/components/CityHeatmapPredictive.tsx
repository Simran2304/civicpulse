import React, { useState, useEffect } from 'react';
import { CivicIncident, WardInfo, PredictiveRisk } from '../types';
import { fetchPredictiveRisks, setSimulatedWeather } from '../api';
import { 
  MapPin, AlertTriangle, Layers, Building2, Eye, ShieldAlert, ArrowRight,
  CloudRain, Sun, Droplets, Flame, Sparkles, Activity, Clock, CheckCircle2,
  Filter
} from 'lucide-react';

interface CityHeatmapPredictiveProps {
  incidents: CivicIncident[];
  wards: WardInfo[];
  onSelectIncident: (inc: CivicIncident) => void;
  onOpenPipeline: (inc: CivicIncident) => void;
}

export const CityHeatmapPredictive: React.FC<CityHeatmapPredictiveProps> = ({
  incidents,
  wards,
  onSelectIncident,
  onOpenPipeline
}) => {
  // Heatmap layer filter (Feature 1 from doc)
  const [activeLayer, setActiveLayer] = useState<'ALL' | 'GARBAGE' | 'WATER' | 'ROADS'>('ALL');
  const [selectedPin, setSelectedPin] = useState<CivicIncident | null>(
    incidents.length > 0 ? incidents[0] : null
  );

  // Predictive risks state (Feature 2 from doc)
  const [currentWeather, setCurrentWeather] = useState<string>("Clear & Sunny (28°C)");
  const [rainfallMm, setRainfallMm] = useState<number>(0);
  const [risks, setRisks] = useState<PredictiveRisk[]>([]);
  const [loadingRisks, setLoadingRisks] = useState<boolean>(false);
  const [preventiveDispatched, setPreventiveDispatched] = useState<Record<string, boolean>>({});

  const loadRisks = async () => {
    setLoadingRisks(true);
    try {
      const data = await fetchPredictiveRisks();
      setRisks(data.predictive_risks);
      setRainfallMm(data.rainfall_mm);
      setCurrentWeather(data.weather_condition);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRisks(false);
    }
  };

  useEffect(() => {
    loadRisks();
  }, []);

  const handleSimulateWeather = async (weather: string, rain: number) => {
    try {
      await setSimulatedWeather(weather, rain);
      setCurrentWeather(weather);
      setRainfallMm(rain);
      await loadRisks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDispatchPreventive = (riskId: string) => {
    setPreventiveDispatched(prev => ({ ...prev, [riskId]: true }));
  };

  // Filtered incidents based on Heatmap layer
  const filteredIncidents = incidents.filter(inc => {
    if (activeLayer === 'ALL') return true;
    const cat = inc.extracted_issue?.category;
    if (activeLayer === 'GARBAGE') return cat === 'solid_waste';
    if (activeLayer === 'WATER') return cat === 'water_sewerage';
    if (activeLayer === 'ROADS') return cat === 'roads_infrastructure';
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner explaining Features 1 & 2 */}
      <div className="bg-gradient-to-r from-blue-900/50 via-slate-900 to-indigo-900/50 border border-blue-500/30 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Advanced Hackathon Features 1 & 2
            </span>
            <span className="text-slate-400 text-xs">Spatial GIS & Weather AI</span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1">
            City Issue Heatmap & Predictive Waterlogging Intelligence
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
            Visualize localized civic clusters (Garbage hotspots, Water leakage clusters, Road damage zones) and forecast impending urban failures based on rainfall before citizens even report them.
          </p>
        </div>

        {/* Heatmap Layer Toggles (Feature 1) */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-400 font-medium px-2 text-[11px]">Layer:</span>
          {[
            { id: 'ALL', label: '🔥 All Issues' },
            { id: 'GARBAGE', label: '🗑️ Garbage Hotspots' },
            { id: 'WATER', label: '💧 Water Leaks' },
            { id: 'ROADS', label: '🕳️ Road Damage' }
          ].map(layer => (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer.id as any)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeLayer === layer.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {layer.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: Feature 1 (Heatmap Canvas + Pin Detail) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Heatmap Map Canvas (8 Columns) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col space-y-3">
          
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-400" />
              <span className="font-bold text-white">Metropolis Geographic Urban Grid ({filteredIncidents.length} Active Pins)</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Critical / High
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Medium
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Resolved
              </span>
            </div>
          </div>

          <div className="relative w-full h-[400px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 p-4">
            
            {/* Grid Coordinates Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:32px_32px] opacity-30" />

            {/* Ward Zones Overlay */}
            <div className="absolute inset-4 grid grid-cols-3 grid-rows-2 gap-3 opacity-25 pointer-events-none text-[10px] font-mono text-indigo-300">
              <div className="border border-indigo-400/50 rounded-lg p-2">Ward 1: Central Admin</div>
              <div className="border border-indigo-400/50 rounded-lg p-2">Ward 2: North Sector 14</div>
              <div className="border border-indigo-400/50 rounded-lg p-2">Ward 3: South Sector 9</div>
              <div className="border border-indigo-400/50 rounded-lg p-2">Ward 4: East Riverfront</div>
              <div className="border border-indigo-400/50 rounded-lg p-2">Ward 5: West Lake Sector 22</div>
              <div className="border border-indigo-400/50 rounded-lg p-2">Ward 6: Tech Corridor</div>
            </div>

            {/* Localized Hotspot Halos */}
            {(activeLayer === 'ALL' || activeLayer === 'GARBAGE') && (
              <div className="absolute top-[28%] left-[45%] w-32 h-32 rounded-full bg-amber-500/15 border border-amber-500/40 animate-pulse pointer-events-none flex items-center justify-center">
                <span className="text-[10px] font-bold text-amber-300 bg-slate-950/90 px-1.5 py-0.5 rounded border border-amber-500/30">
                  Sector 14 Garbage Cluster
                </span>
              </div>
            )}

            {(activeLayer === 'ALL' || activeLayer === 'WATER') && (
              <div className="absolute bottom-[22%] left-[22%] w-28 h-28 rounded-full bg-cyan-500/15 border border-cyan-500/40 pointer-events-none flex items-center justify-center">
                <span className="text-[10px] font-bold text-cyan-300 bg-slate-950/90 px-1.5 py-0.5 rounded border border-cyan-500/30">
                  Sector 22 Water Main
                </span>
              </div>
            )}

            {/* Pins on the Map */}
            <div className="relative w-full h-full">
              {filteredIncidents.map((inc, i) => {
                const topPct = 22 + ((i * 17) % 58);
                const leftPct = 16 + ((i * 26) % 68);
                const isSelected = selectedPin?.ticket_id === inc.ticket_id;
                const isCritical = inc.priority?.priority === 'CRITICAL' || inc.priority?.priority === 'HIGH';
                const isResolved = ['RESOLVED', 'CLOSED'].includes(inc.current_status);

                return (
                  <button
                    key={inc.ticket_id}
                    type="button"
                    onClick={() => {
                      setSelectedPin(inc);
                      onSelectIncident(inc);
                    }}
                    style={{ top: `${topPct}%`, left: `${leftPct}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 group transition-all transform hover:scale-125 focus:outline-none z-10 cursor-pointer`}
                  >
                    <div className={`p-2 rounded-full shadow-lg border flex items-center justify-center transition ${
                      isSelected 
                        ? 'ring-4 ring-white scale-125' 
                        : ''
                    } ${
                      isResolved 
                        ? 'bg-emerald-600 border-emerald-400 text-white' 
                        : isCritical 
                        ? 'bg-rose-600 border-rose-400 text-white' 
                        : 'bg-blue-600 border-blue-400 text-white'
                    }`}>
                      <MapPin className="w-3.5 h-3.5" />
                    </div>

                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-900 border border-slate-700 text-white text-[10px] font-mono py-1 px-2 rounded-lg whitespace-nowrap shadow-xl z-20 pointer-events-none">
                      #{inc.ticket_id} • {inc.extracted_issue?.category || 'Civic'}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Map Legend */}
            <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-800 rounded-lg p-2 text-[10px] text-slate-400 space-y-1 backdrop-blur-sm">
              <div className="font-semibold text-slate-200">Metropolis City GIS Layer</div>
              <div>Click any pin to inspect ticket details & launch AI pipeline</div>
            </div>

          </div>
        </div>

        {/* Selected Incident Details Panel (4 Columns) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 text-xs">
          {selectedPin ? (
            <div className="space-y-4">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="font-mono text-xs font-bold text-indigo-400">
                    #{selectedPin.ticket_id}
                  </span>
                  <h3 className="font-bold text-white text-sm">
                    {selectedPin.extracted_issue?.category || 'Civic Incident'}
                  </h3>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  selectedPin.priority?.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                  selectedPin.priority?.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}>
                  {selectedPin.priority?.priority || 'MEDIUM'} ({selectedPin.priority?.severity_score || 75}/100)
                </span>
              </div>

              <div className="space-y-2.5">
                <div>
                  <span className="text-slate-400 font-medium">Description:</span>
                  <p className="text-white font-medium mt-0.5 text-xs">
                    "{selectedPin.raw_description}"
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-medium">Geo Location:</span>
                  <div className="font-medium text-slate-200 mt-0.5">
                    📍 {selectedPin.location?.resolved_address || selectedPin.location?.raw_location}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Ward: {selectedPin.location?.ward_name} ({selectedPin.location?.zone} Zone)
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-medium">Assigned Department:</span>
                  <div className="font-semibold text-indigo-300 mt-0.5">
                    {selectedPin.routing?.department_name}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                  <div>
                    <span className="text-slate-400">Status:</span>
                    <div className="font-bold text-white mt-0.5">
                      {selectedPin.current_status}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">SLA Window:</span>
                    <div className="font-mono text-amber-300 mt-0.5">
                      {selectedPin.sla?.sla_hours || 48} Hours
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenPipeline(selectedPin)}
                className="w-full mt-4 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20 text-xs cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Open in 11-Agent AI Pipeline</span>
              </button>

            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <MapPin className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <div>Select a pin on the map to inspect its details.</div>
            </div>
          )}
        </div>

      </div>

      {/* Feature 2: Predictive Civic Issues (Based on rainfall -> predict waterlogging zones) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                Feature 2: Predictive Civic Issues
              </span>
              <span className="text-xs text-slate-400">Weather-Triggered Forecasting</span>
            </div>
            <h3 className="font-bold text-white text-sm mt-1">
              Rainfall & Environmental Predictive Risk Engine
            </h3>
            <p className="text-xs text-slate-400">
              Predict waterlogging zones and infrastructure failures based on rainfall intensity before citizen complaints arrive.
            </p>
          </div>

          {/* Meteorological Simulator Buttons */}
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => handleSimulateWeather("Clear & Sunny (28°C)", 0.0)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                rainfallMm === 0
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-300" /> Clear (Baseline)
            </button>

            <button
              onClick={() => handleSimulateWeather("Monsoon Heavy Downpour (45 mm/hr)", 45.0)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                rainfallMm >= 25
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CloudRain className="w-3.5 h-3.5 text-cyan-300 animate-bounce" /> Monsoon Downpour (45 mm/h)
            </button>
          </div>
        </div>

        {/* Predictive Risk Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {risks.map((risk) => {
            const isDispatched = preventiveDispatched[risk.id];

            return (
              <div 
                key={risk.id}
                className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2.5 flex flex-col justify-between text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white truncate">{risk.risk_type}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      risk.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      risk.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}>
                      {risk.severity} ({risk.probability}%)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    📍 {risk.affected_areas} ({risk.forecast_window})
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    {risk.trigger_factor}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-cyan-400 font-mono truncate max-w-[170px]" title={risk.suggested_preventative_action}>
                    Action: {risk.suggested_preventative_action}
                  </span>
                  
                  <button
                    onClick={() => handleDispatchPreventive(risk.id)}
                    disabled={isDispatched}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 ${
                      isDispatched
                        ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    {isDispatched ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Crew Dispatched</span>
                      </>
                    ) : (
                      <span>Proactive Dispatch</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};
export default CityHeatmapPredictive;
