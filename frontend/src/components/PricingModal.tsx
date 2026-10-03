import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanTrip: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, onPlanTrip }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-2xl liquid-glass-dark rounded-3xl p-6 sm:p-8 text-white border border-white/10 shadow-2xl relative overflow-hidden"
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="text-center mb-6">
            <span className="font-brand text-2xl font-bold tracking-wider text-white">
              wandor
            </span>
            <h3 className="text-xl font-bold text-white mt-1">Simple, Transparent Travel AI</h3>
            <p className="text-xs text-neutral-400 mt-1">
              Deterministic optimization with state-of-the-art AI reasoning
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Free Tier */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Community Explorer
                </div>
                <div className="text-2xl font-bold text-white mt-1">₹0</div>
                <p className="text-[11px] text-neutral-400 mt-1 mb-4">
                  Full access to grounded itinerary generation & catalog exploration.
                </p>
                <div className="space-y-2 text-xs text-neutral-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Grounded place catalog planning</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>OpenStreetMap route calculations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Live Open-Meteo weather forecasts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Full version history & undo</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onPlanTrip();
                }}
                className="w-full mt-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-colors"
              >
                Start Free Planning
              </button>
            </div>

            {/* Pro Tier */}
            <div className="p-5 rounded-2xl bg-[#905831]/20 border border-[#905831]/40 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-3 right-3 text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#905831] text-white">
                POPULAR
              </div>
              <div>
                <div className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
                  Wandor Concierge Pro
                </div>
                <div className="text-2xl font-bold text-white mt-1">₹499 <span className="text-xs text-neutral-400 font-normal">/ trip</span></div>
                <p className="text-[11px] text-neutral-300 mt-1 mb-4">
                  Autonomous real-time condition monitoring, live weather replanning & AI concierge.
                </p>
                <div className="space-y-2 text-xs text-neutral-200">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-400" />
                    <span>Unlimited AI conversational modifications</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-400" />
                    <span>Automatic monsoon & rain rescheduling</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-400" />
                    <span>Public sharing link with 30-day pin</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-400" />
                    <span>Budget optimization & expense breakdown</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onPlanTrip();
                }}
                className="w-full mt-6 py-2.5 rounded-xl bg-[#905831] hover:bg-[#a6683c] text-xs font-bold text-white transition-colors shadow-lg"
              >
                Explore Pro Features
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
