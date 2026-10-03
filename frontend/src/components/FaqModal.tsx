import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, HelpCircle } from 'lucide-react';

interface FaqModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FAQS = [
  {
    q: 'How does Wandor guarantee zero hallucinations?',
    a: 'Unlike generic chatbots that make up non-existent cafes or inaccurate prices, Wandor operates on Grounded Generation. The AI agent can only select from a verified catalog of cataloged attractions, restaurants, and hotels with verified coordinates, verified costs, and opening hours.',
  },
  {
    q: 'How does dynamic weather replanning work?',
    a: 'Wandor continuously monitors Open-Meteo forecasts. When rain probability exceeds 70% or severe weather is detected for an outdoor activity, our Replanner Agent formulates a minimal ChangeSet swapping outdoor activities for indoor museums or heritage churches without altering the rest of your trip.',
  },
  {
    q: 'Can I undo changes made by the AI Assistant?',
    a: 'Yes! Every change creates a new immutable version in the database (v1, v2, v3...). You can inspect the visual diff between any versions and revert back to any prior version with a single click.',
  },
  {
    q: 'Which destinations are currently available?',
    a: 'Wandor currently features comprehensive, verified coverage for Goa, Jaipur, and Hyderabad with dozens of attractions, local culinary institutions, and accommodations.',
  },
  {
    q: 'Can I share my itinerary with travel partners?',
    a: 'Yes. Generating a share link creates a secure, read-only token where companions can view the day-by-day map, stops, and timings without access to your private account or expenses.',
  },
];

export const FaqModal: React.FC<FaqModalProps> = ({ isOpen, onClose }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-xl liquid-glass-dark rounded-3xl p-6 sm:p-8 text-white border border-white/10 shadow-2xl relative overflow-hidden"
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-[#905831]/30 border border-[#905831]/50 flex items-center justify-center text-amber-300">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Frequently Asked Questions</h3>
              <p className="text-xs text-neutral-400">Everything you need to know about Wandor</p>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {FAQS.map((faq, idx) => {
              const isExpanded = openIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenIndex(isExpanded ? null : idx)}
                    className="w-full text-left p-4 flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold text-neutral-200 hover:text-white"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-neutral-400 transition-transform duration-200 shrink-0 ${
                        isExpanded ? 'rotate-180 text-amber-400' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-4 pb-4 text-xs text-neutral-300 leading-relaxed border-t border-white/5 pt-2"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
