import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Play,
  CloudRain,
  Plane,
  AlertTriangle,
  IndianRupee,
  Coffee,
  CheckCircle2,
  Sparkles,
  Layers,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import type { CanonicalItinerary } from '../types';
import { api } from '../services/api';

interface ScenarioSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  itinerary: CanonicalItinerary;
  tripId: number | string;
  onItineraryUpdated: (newItinerary: CanonicalItinerary) => void;
}

interface ScenarioPreset {
  id: string;
  type: string;
  title: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  defaultDay: string;
  severity: string;
  color: string;
  accentBg: string;
}

const PRESETS: ScenarioPreset[] = [
  {
    id: 'rain',
    type: 'weather',
    title: 'Monsoon Alert / Sudden Rain',
    tagline: '85% Rain Forecasted',
    icon: CloudRain,
    description:
      'Heavy showers hit. The AI automatically replaces outdoor beaches and fort viewpoints with covered museums, cultural galleries, and authentic indoor dining.',
    defaultDay: 'day_2',
    severity: 'warning',
    color: 'text-sky-600 border-sky-300 bg-sky-50',
    accentBg: 'from-sky-500/10 to-blue-600/10',
  },
  {
    id: 'delay',
    type: 'delay',
    title: '4-Hour Transit Delay',
    tagline: 'Flight / Train Rescheduled',
    icon: Plane,
    description:
      'Arrival delayed by 4 hours. The AI compresses morning itinerary items into afternoon slots without missing evening signature meals or booked events.',
    defaultDay: 'day_1',
    severity: 'info',
    color: 'text-amber-600 border-amber-300 bg-amber-50',
    accentBg: 'from-amber-500/10 to-orange-600/10',
  },
  {
    id: 'closure',
    type: 'closure',
    title: 'Attraction Closed / Public Holiday',
    tagline: 'Venue Unexpectedly Shut',
    icon: AlertTriangle,
    description:
      'A key monument or temple is shut for maintenance. The AI immediately identifies an equal-tier verified attraction nearby with matching open hours.',
    defaultDay: 'day_2',
    severity: 'warning',
    color: 'text-rose-600 border-rose-300 bg-rose-50',
    accentBg: 'from-rose-500/10 to-pink-600/10',
  },
  {
    id: 'budget_cut',
    type: 'budget_cut',
    title: 'Emergency 25% Budget Crunch',
    tagline: 'Save ₹3,000 - ₹8,000',
    icon: IndianRupee,
    description:
      'Unexpected expense? The AI optimizes activities, swaps high-ticket guided tours for scenic self-walks, and adjusts daily spending limits.',
    defaultDay: 'day_1',
    severity: 'info',
    color: 'text-emerald-600 border-emerald-300 bg-emerald-50',
    accentBg: 'from-emerald-500/10 to-teal-600/10',
  },
  {
    id: 'slow_travel',
    type: 'slow_travel',
    title: 'Slow Travel & Energy Dip',
    tagline: 'Rest & Scenic Sunset Pace',
    icon: Coffee,
    description:
      'Feeling fatigued? The AI drops back-to-back transit, leaves a 90-minute gap for sunset tea or beach lounge, and smooths daily pacing.',
    defaultDay: 'day_3',
    severity: 'info',
    color: 'text-purple-600 border-purple-300 bg-purple-50',
    accentBg: 'from-purple-500/10 to-indigo-600/10',
  },
];

export const ScenarioSimulatorModal: React.FC<ScenarioSimulatorModalProps> = ({
  isOpen,
  onClose,
  itinerary,
  tripId,
  onItineraryUpdated,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('rain');
  const [selectedDayId, setSelectedDayId] = useState<string>(
    itinerary.days[1]?.id || itinerary.days[0]?.id || 'day_1'
  );
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{
    event: any;
    itinerary?: CanonicalItinerary;
    rationale?: string;
  } | null>(null);

  if (!isOpen) return null;

  const activePreset = PRESETS.find((p) => p.id === selectedPresetId) || PRESETS[0];

  const handleRunSimulation = async () => {
    setSimulating(true);
    setSimulationResult(null);
    try {
      const res = await api.simulateEvent(tripId, {
        type: activePreset.type,
        day_id: selectedDayId,
        severity: activePreset.severity,
        detail: `Simulated: ${activePreset.title}`,
      });

      setSimulationResult({
        event: res.event,
        itinerary: res.itinerary,
        rationale: res.itinerary?.change_summary || `Agent replanned for ${activePreset.title}`,
      });

      if (res.itinerary) {
        onItineraryUpdated(res.itinerary);
      }
    } catch (err: any) {
      alert(`Simulation error: ${err.message || 'Failed to simulate scenario'}`);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl border border-black/10 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-black/5 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#905831] to-[#df6b26] flex items-center justify-center text-white shadow-md shadow-orange-900/20">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-[#111827]">
                    AI "What-If" Scenario Simulator
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-bold">
                    Adaptive Replanner
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
                  Test how the dynamic agent responds to real-world travel disruptions in real time
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* Scenario Grid */}
            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-2.5">
                Choose a Real-World Disruption to Simulate:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setSelectedPresetId(preset.id);
                        setSimulationResult(null);
                      }}
                      className={`text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#905831] bg-gradient-to-br from-orange-50 to-amber-50/50 shadow-md ring-2 ring-[#905831]/20'
                          : 'border-neutral-200 hover:border-neutral-300 bg-white hover:bg-neutral-50/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center border ${preset.color}`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        {isSelected && (
                          <span className="w-2.5 h-2.5 rounded-full bg-[#905831] animate-ping" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-neutral-900 leading-snug">
                          {preset.title}
                        </h4>
                        <span className="text-[11px] font-semibold text-[#905831]">
                          {preset.tagline}
                        </span>
                        <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                          {preset.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Day Picker */}
            <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80">
              <span className="text-xs font-bold text-neutral-700">Target Disruption Day:</span>
              <div className="flex flex-wrap gap-2">
                {itinerary.days.map((day) => (
                  <button
                    key={day.id}
                    onClick={() => {
                      setSelectedDayId(day.id);
                      setSimulationResult(null);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedDayId === day.id
                        ? 'bg-[#905831] text-white shadow-xs'
                        : 'bg-white text-neutral-700 hover:bg-neutral-200 border border-neutral-300/80'
                    }`}
                  >
                    Day {day.day_number} ({day.date})
                  </button>
                ))}
              </div>
            </div>

            {/* Simulation Action Bar */}
            <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent border border-orange-500/20">
              <div>
                <span className="text-xs font-bold text-[#905831] uppercase tracking-wider block">
                  Ready to Trigger
                </span>
                <p className="text-xs text-neutral-700">
                  Inject <strong className="font-semibold">{activePreset.title}</strong> on{' '}
                  <strong className="font-semibold">
                    Day {itinerary.days.find((d) => d.id === selectedDayId)?.day_number || 1}
                  </strong>{' '}
                  and let the AI recalculate provenance and route constraints.
                </p>
              </div>
              <button
                onClick={handleRunSimulation}
                disabled={simulating}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#905831] via-[#c26127] to-[#df6b26] hover:from-[#7a4927] hover:to-[#be5619] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-orange-900/20 transition-all hover:scale-[1.02] disabled:opacity-50 cursor-pointer shrink-0"
              >
                {simulating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Agent Replanning...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Run Simulation</span>
                  </>
                )}
              </button>
            </div>

            {/* Simulation Results Preview */}
            {simulationResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-300 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-bold text-emerald-900">
                      Dynamic Replan Succeeded!
                    </span>
                  </div>
                  {simulationResult.itinerary && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" />
                      Trip Version {simulationResult.itinerary.version}
                    </span>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-emerald-200/80 text-xs space-y-1.5">
                  <span className="font-bold text-neutral-800 block">Agent Rationale & Actions:</span>
                  <p className="text-neutral-700 leading-relaxed">
                    {simulationResult.rationale}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-emerald-800">
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Catalog verified alternatives</span>
                  </div>
                  <span>•</span>
                  <span>Automatic timetable adjustment</span>
                  <span>•</span>
                  <span>Budget compliance preserved</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 border-t border-black/5 bg-neutral-50 flex items-center justify-between">
            <span className="text-xs text-neutral-500">
              Simulations create a rollback-safe new version in the version history.
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-all"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
