import React, { useState } from 'react';
import { CivicIncident, WardInfo } from '../types';
import { 
  MapPin, AlertTriangle, Layers, Building2, Eye, ShieldAlert, ArrowRight
} from 'lucide-react';

interface CityMapProps {
  incidents: CivicIncident[];
  wards: WardInfo[];
  onSelectIncident: (inc: CivicIncident) => void;
  onOpenPipeline: (inc: CivicIncident) => void;
}

export const CityMap: React.FC<CityMapProps> = ({
  incidents,
  wards,
  onSelectIncident,
  onOpenPipeline
}) => {
  const [selectedPin, setSelectedPin] = useState<CivicIncident | null>(
    incidents.length > 0 ? incidents[0] : null
  );

  return (
    <div className="space-y-4">
      
      {/* Top Explainer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-400" />
            <span>Smart City Geographic Operations & Incident Map</span>
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">
            Geographic distribution of citizen complaints, ward boundaries, and localized problem clusters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span>Critical / High</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
            <span>Medium / Low</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Resolved</span>
          </div>
        </div>
      </div>

      {/* Grid: Map + Selected Pin Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Visual Map Canvas (8 Columns) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col">
          <div className="relative w-full h-[450px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center p-4">
            
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:32px_32px] opacity-30" />

            {/* Ward Zones Overlay */}
            <div className="absolute inset-4 grid grid-cols-3 grid-rows-2 gap-3 opacity-20 pointer-events-none">
              <div className="border border-indigo-400/50 rounded-lg p-2 font-mono text-[10px] text-indigo-300">Ward 1: Central</div>
              <div className="border border-indigo-400/50 rounded-lg p-2 font-mono text-[10px] text-indigo-300">Ward 2: North Sector 14</div>
              <div className="border border-indigo-400/50 rounded-lg p-2 font-mono text-[10px] text-indigo-300">Ward 3: South Green Meadows</div>
              <div className="border border-indigo-400/50 rounded-lg p-2 font-mono text-[10px] text-indigo-300">Ward 4: East Industrial</div>
              <div className="border border-indigo-400/50 rounded-lg p-2 font-mono text-[10px] text-indigo-300">Ward 5: West Lake Residency</div>
              <div className="border border-indigo-400/50 rounded-lg p-2 font-mono text-[10px] text-indigo-300">Ward 6: Tech Corridor</div>
            </div>

            {/* Hotspot Circles */}
            <div className="absolute top-[30%] left-[45%] w-32 h-32 rounded-full bg-amber-500/10 border border-amber-500/30 animate-pulse pointer-events-none" />
            <div className="absolute bottom-[25%] left-[25%] w-24 h-24 rounded-full bg-rose-500/10 border border-rose-500/30 pointer-events-none" />

            {/* Pins on the Map */}
            <div className="relative w-full h-full">
              {incidents.map((inc, i) => {
                // Approximate positions based on index / coords for clean visualization
                const topPct = 25 + ((i * 19) % 55);
                const leftPct = 18 + ((i * 27) % 65);
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
                    className={`absolute -translate-x-1/2 -translate-y-1/2 group transition-all transform hover:scale-125 focus:outline-none z-10`}
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
                      <MapPin className="w-4 h-4" />
                    </div>

                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-900 border border-slate-700 text-white text-[10px] font-mono py-1 px-2 rounded-lg whitespace-nowrap shadow-xl z-20 pointer-events-none">
                      #{inc.ticket_id} ({inc.priority?.priority || 'MEDIUM'})
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Map Legend */}
            <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-800 rounded-lg p-2 text-[10px] text-slate-400 space-y-1 backdrop-blur-sm">
              <div className="font-semibold text-slate-200">Metropolis Urban Grid</div>
              <div>Click any pin to inspect ticket details</div>
            </div>

          </div>
        </div>

        {/* Selected Pin Details Panel (4 Columns) */}
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
                  {selectedPin.priority?.priority || 'MEDIUM'}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-slate-400">Description:</span>
                  <p className="text-white font-medium mt-0.5">
                    "{selectedPin.raw_description}"
                  </p>
                </div>

                <div>
                  <span className="text-slate-400">Location:</span>
                  <div className="font-medium text-slate-200 mt-0.5">
                    📍 {selectedPin.location?.resolved_address || selectedPin.location?.raw_location}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Ward: {selectedPin.location?.ward_name} ({selectedPin.location?.zone} Zone)
                  </div>
                </div>

                <div>
                  <span className="text-slate-400">Assigned Department:</span>
                  <div className="font-semibold text-indigo-300 mt-0.5">
                    {selectedPin.routing?.department_name}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                  <div>
                    <span className="text-slate-400">Status:</span>
                    <div className="font-bold text-white mt-0.5">
                      {selectedPin.current_status}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">SLA Timer:</span>
                    <div className="font-mono text-amber-300 mt-0.5">
                      {selectedPin.sla?.countdown_text || 'Active'}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenPipeline(selectedPin)}
                className="w-full mt-4 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20 text-xs"
              >
                <Eye className="w-4 h-4" />
                <span>Open Multi-Agent Pipeline</span>
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

    </div>
  );
};
export default CityMap;
