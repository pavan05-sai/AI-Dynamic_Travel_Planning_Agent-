import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Sparkles, CheckCircle2, ShieldCheck, MapPin } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AiPlanningOverlayProps {
  isOpen: boolean;
  destinationName: string;
  traceSteps?: string[];
  onComplete?: () => void;
}

const PLANNING_STAGES = [
  { label: 'Understanding your travel style & pace...', icon: Compass },
  { label: 'Querying catalog of verified attractions & dining...', icon: MapPin },
  { label: 'Optimizing geographic routes & transit windows...', icon: Sparkles },
  { label: 'Balancing budget allocations & accommodation reserves...', icon: ShieldCheck },
  { label: 'Checking Open-Meteo conditions & daylight forecasts...', icon: Compass },
  { label: 'Assembling grounded canonical itinerary...', icon: CheckCircle2 },
];

export const AiPlanningOverlay: React.FC<AiPlanningOverlayProps> = ({
  isOpen,
  destinationName,
  traceSteps = [],
}) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStageIndex(prev => {
        if (prev < PLANNING_STAGES.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && currentStageIndex === PLANNING_STAGES.length - 1) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#905831', '#1a1a1a', '#f59e0b'],
      });
    }
  }, [isOpen, currentStageIndex]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-2xl"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg liquid-glass-dark rounded-3xl p-6 sm:p-8 text-white border border-white/10 shadow-2xl relative overflow-hidden"
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#905831]/20 rounded-full blur-3xl pointer-events-none" />

          {/* Central Animated Compass Icon */}
          <div className="flex flex-col items-center text-center mb-8 relative z-10">
            <div className="relative mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center"
              >
                <div className="w-12 h-12 rounded-full border border-[#905831]/50 flex items-center justify-center" />
              </motion.div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1">
              Curating your {destinationName} Itinerary
            </h2>
            <p className="text-xs text-neutral-400">
              Deterministic engines & AI agents orchestrating in real time
            </p>
          </div>

          {/* Progress Stages List */}
          <div className="space-y-3 mb-6 relative z-10">
            {PLANNING_STAGES.map((stage, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;

              return (
                <motion.div
                  key={stage.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 ${
                    isCurrent
                      ? 'bg-white/10 border border-white/20 text-white shadow-lg'
                      : isPast
                      ? 'text-neutral-400 opacity-60'
                      : 'text-neutral-500 opacity-30'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                      isPast
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isCurrent
                        ? 'bg-[#905831] text-white animate-pulse'
                        : 'bg-white/5 text-neutral-500'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : idx + 1}
                  </div>
                  <span className="text-xs font-medium flex-1 text-left">{stage.label}</span>
                  {isCurrent && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-2 h-2 rounded-full bg-amber-400"
                    />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Real Backend Agent Trace Logs if available */}
          {traceSteps.length > 0 && (
            <div className="mt-4 p-3 rounded-2xl bg-black/40 border border-white/10 text-left">
              <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest mb-1">
                Live Agent Trace
              </div>
              <div className="max-h-24 overflow-y-auto text-[11px] font-mono text-neutral-300 space-y-1">
                {traceSteps.slice(-3).map((step, i) => (
                  <div key={i} className="flex items-start gap-1.5 truncate">
                    <span className="text-[#905831] font-bold">›</span>
                    <span className="truncate">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Grounding Guarantee */}
          <div className="mt-6 text-center text-[11px] text-neutral-400">
            Validated against catalog place availability & opening hours
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
