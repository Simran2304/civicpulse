import React, { useState, useEffect } from 'react';
import { 
  PredictiveRisk 
} from '../types';
import { 
  fetchPredictiveRisks, setSimulatedWeather 
} from '../api';
import { 
  CloudRain, Sun, AlertTriangle, ShieldCheck, Zap, 
  Droplets, Flame, Sparkles, Activity, Clock, ChevronRight, CheckCircle2
} from 'lucide-react';

interface PredictiveViewProps {
  currentWeather: string;
  onWeatherChanged: (weather: string, rainfall: number) => void;
}

export const PredictiveView: React.FC<PredictiveViewProps> = ({
  currentWeather,
  onWeatherChanged
}) => {
  const [risks, setRisks] = useState<PredictiveRisk[]>([]);
  const [rainfallMm, setRainfallMm] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dispatchedActions, setDispatchedActions] = useState<Record<string, boolean>>({});

  const loadRisks = async () => {
    setIsLoading(true);
    try {
      const data = await fetchPredictiveRisks();
      setRisks(data.predictive_risks);
      setRainfallMm(data.rainfall_mm);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRisks();
  }, [currentWeather]);

  const handleSimulateWeather = async (weather: string, rain: number) => {
    await setSimulatedWeather(weather, rain);
    onWeatherChanged(weather, rain);
    loadRisks();
  };

  const handleProactiveDispatch = (riskId: string) => {
    setDispatchedActions(prev => ({ ...prev, [riskId]: true }));
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Weather Simulator */}
      <div className="bg-gradient-to-r from-cyan-950/60 via-slate-900 to-indigo-950/60 border border-cyan-800/50 rounded-2xl p-6 shadow-xl space-y-4">
        
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-xs border border-cyan-500/30 font-bold">
                Predictive Urban Intelligence
              </span>
              <span className="text-xs text-slate-400">Meteorological & Spatial AI</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight mt-1">
              Anticipate Civic Failures Before Citizens Report
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl">
              Simulate rainfall and microclimate variables to forecast stormwater overflow, structural pothole deepening, vector disease outbreaks, and transformer load failures.
            </p>
          </div>

          {/* Weather Simulation Toggle Buttons */}
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 p-1.5 rounded-xl">
            <button
              onClick={() => handleSimulateWeather("Clear & Sunny (28°C)", 0.0)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                rainfallMm === 0 && !currentWeather.includes("Heat")
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-300" /> Clear (Baseline)
            </button>

            <button
              onClick={() => handleSimulateWeather("Monsoon Downpour (45 mm/hr)", 45.0)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                rainfallMm >= 25
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CloudRain className="w-3.5 h-3.5 text-cyan-300 animate-bounce" /> Monsoon Downpour (45mm/h)
            </button>

            <button
              onClick={() => handleSimulateWeather("Summer Heatwave (42°C)", 0.0)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentWeather.includes("Heat")
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-orange-300" /> Heatwave (42°C)
            </button>
          </div>
        </div>

      </div>

      {/* Predictive Risk Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {risks.map((risk) => {
          const isCritical = risk.severity === 'CRITICAL';
          const isDispatched = dispatchedActions[risk.id];

          return (
            <div
              key={risk.id}
              className={`rounded-2xl border p-5 shadow-xl space-y-3.5 transition-all ${
                isCritical 
                  ? 'bg-rose-950/30 border-rose-800/80' 
                  : risk.severity === 'HIGH'
                  ? 'bg-amber-950/20 border-amber-800/80'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      isCritical ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {risk.severity} • {risk.probability}% Probability
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {risk.id}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white leading-snug">
                    {risk.risk_type}
                  </h3>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Forecast Window</span>
                  <span className="text-xs font-semibold text-cyan-300">{risk.forecast_window}</span>
                </div>
              </div>

              {/* Geographic Impact */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-semibold uppercase text-[10px]">Vulnerable Zones & Wards</span>
                  <span className="font-mono text-cyan-400 font-semibold">{risk.impacted_wards.join(', ')}</span>
                </div>
                <div className="text-white font-medium">{risk.affected_areas}</div>
              </div>

              {/* Trigger Mechanism */}
              <div className="text-xs text-slate-300 space-y-1">
                <span className="text-slate-400 text-[11px] font-semibold uppercase">Sensor / Environmental Trigger:</span>
                <p className="italic text-slate-300 text-[11px] bg-slate-950/40 p-2 rounded-lg border border-slate-800/50">
                  "{risk.trigger_factor}"
                </p>
              </div>

              {/* Preventative Action & Dispatch */}
              <div className="pt-1 flex items-center justify-between gap-3 border-t border-slate-800/80">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 flex-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate">{risk.suggested_preventative_action}</span>
                </div>

                <button
                  onClick={() => handleProactiveDispatch(risk.id)}
                  disabled={isDispatched}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors ${
                    isDispatched 
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
                  }`}
                >
                  {isDispatched ? 'Crew Pre-Staged' : 'Pre-Dispatch Crew'}
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
