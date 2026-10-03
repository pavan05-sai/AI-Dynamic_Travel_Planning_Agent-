import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Headphones,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Clock,
  RotateCcw,
} from 'lucide-react';
import type { CanonicalItinerary, ItineraryItem } from '../types';

interface AudioTourGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  itinerary: CanonicalItinerary;
}

interface AudioTrack {
  id: string;
  placeName: string;
  dayNumber: number;
  category: string;
  durationText: string;
  transcript: string;
}

export const AudioTourGuideModal: React.FC<AudioTourGuideModalProps> = ({
  isOpen,
  onClose,
  itinerary,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Generate audio tracks from itinerary items
  const tracks: AudioTrack[] = React.useMemo(() => {
    const list: AudioTrack[] = [];
    itinerary.days.forEach((day) => {
      day.items.forEach((item) => {
        if (item.type === 'activity' || item.category === 'sightseeing') {
          list.push({
            id: item.id,
            placeName: item.name,
            dayNumber: day.day_number,
            category: item.category || 'Sightseeing',
            durationText: '1 min listen',
            transcript: generateNarration(item, itinerary.trip.destination.name, day.day_number),
          });
        }
      });
    });

    if (list.length === 0) {
      list.push({
        id: 'dest_overview',
        placeName: `${itinerary.trip.destination.name} Grand Overview`,
        dayNumber: 1,
        category: 'Destination Intro',
        durationText: '2 min listen',
        transcript: `Welcome to ${itinerary.trip.destination.name}! Across your ${itinerary.trip.num_days}-day bespoke journey, you will experience the living history, vibrant spice aromas, coastal horizons, and celebrated architecture of this iconic region. Keep this audio tour active as you move through each landmark.`,
      });
    }

    return list;
  }, [itinerary]);

  const activeTrack = tracks[currentTrackIndex] || tracks[0];

  // Stop speech on unmount or close
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-Speech is not supported in this browser.');
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = playbackRate;
    utterance.pitch = 1.0;

    // Pick an English voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoice =
      voices.find((v) => v.lang.startsWith('en-IN')) ||
      voices.find((v) => v.lang.startsWith('en-GB')) ||
      voices.find((v) => v.lang.startsWith('en-US')) ||
      voices[0];

    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const togglePlayPause = () => {
    if (!('speechSynthesis' in window)) return;

    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
      } else {
        speakText(activeTrack.transcript);
      }
    }
  };

  const handleNext = () => {
    if (currentTrackIndex < tracks.length - 1) {
      const nextIdx = currentTrackIndex + 1;
      setCurrentTrackIndex(nextIdx);
      speakText(tracks[nextIdx].transcript);
    }
  };

  const handlePrev = () => {
    if (currentTrackIndex > 0) {
      const prevIdx = currentTrackIndex - 1;
      setCurrentTrackIndex(prevIdx);
      speakText(tracks[prevIdx].transcript);
    }
  };

  const handleSelectTrack = (index: number) => {
    setCurrentTrackIndex(index);
    speakText(tracks[index].transcript);
  };

  const changeRate = () => {
    const rates = [1.0, 1.25, 1.5, 0.85];
    const currIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (isPlaying) {
      speakText(activeTrack.transcript);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl border border-black/10 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-black/5 bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-900/20">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-[#111827]">
                    Voice AI Audio Tour Guide
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold">
                    Interactive Narration
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
                  Listen to immersive architectural histories and local stories for each landmark
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                setIsPlaying(false);
                onClose();
              }}
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Active Player Deck */}
          <div className="p-6 bg-gradient-to-b from-purple-50/50 to-white border-b border-neutral-100 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block mb-1">
                  Day {activeTrack.dayNumber} • {activeTrack.category}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-neutral-900">
                  {activeTrack.placeName}
                </h3>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>{activeTrack.durationText}</span>
              </div>
            </div>

            {/* Audio Waveform Animation */}
            <div className="flex items-center justify-center gap-1.5 h-10 py-1">
              {[40, 75, 55, 90, 65, 30, 85, 45, 95, 60, 80, 50, 70, 35].map((h, i) => (
                <motion.div
                  key={i}
                  animate={
                    isPlaying
                      ? {
                          height: [`${h * 0.3}%`, `${h}%`, `${h * 0.4}%`],
                        }
                      : { height: '20%' }
                  }
                  transition={{
                    repeat: Infinity,
                    duration: 0.8 + (i % 5) * 0.15,
                    ease: 'easeInOut',
                  }}
                  className={`w-1 rounded-full ${
                    isPlaying ? 'bg-purple-600' : 'bg-neutral-300'
                  }`}
                />
              ))}
            </div>

            {/* Controls Bar */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={changeRate}
                className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold transition-all cursor-pointer"
                title="Playback Speed"
              >
                {playbackRate}x Speed
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrev}
                  disabled={currentTrackIndex === 0}
                  className="p-2.5 rounded-full text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 disabled:opacity-30 cursor-pointer"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                <button
                  onClick={togglePlayPause}
                  className="w-13 h-13 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-purple-900/25 transition-transform hover:scale-105 cursor-pointer"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 fill-white" />
                  ) : (
                    <Play className="w-6 h-6 fill-white ml-0.5" />
                  )}
                </button>

                <button
                  onClick={handleNext}
                  disabled={currentTrackIndex === tracks.length - 1}
                  className="p-2.5 rounded-full text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 disabled:opacity-30 cursor-pointer"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={() => {
                  if (isPlaying) {
                    window.speechSynthesis.cancel();
                    setIsPlaying(false);
                  }
                  speakText(activeTrack.transcript);
                }}
                className="p-2 text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
                title="Replay from start"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Transcript & Tracklist Split */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {/* Live Transcript */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                Tour Guide Narration Transcript:
              </span>
              <p className="text-xs sm:text-sm text-neutral-800 leading-relaxed font-normal">
                "{activeTrack.transcript}"
              </p>
            </div>

            {/* Track Selector List */}
            <div>
              <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider block mb-2.5">
                All Landmarks on Itinerary ({tracks.length})
              </span>
              <div className="space-y-2">
                {tracks.map((track, idx) => {
                  const isCurrent = idx === currentTrackIndex;
                  return (
                    <button
                      key={track.id}
                      onClick={() => handleSelectTrack(idx)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isCurrent
                          ? 'border-purple-500 bg-purple-50/70 shadow-xs ring-1 ring-purple-500/20'
                          : 'border-neutral-200 hover:border-neutral-300 bg-white hover:bg-neutral-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                            isCurrent
                              ? 'bg-purple-600 text-white'
                              : 'bg-neutral-100 text-neutral-600'
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs sm:text-sm text-neutral-900 leading-tight">
                            {track.placeName}
                          </h4>
                          <span className="text-[11px] text-neutral-500">
                            Day {track.dayNumber} • {track.category}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isCurrent && isPlaying ? (
                          <span className="px-2 py-0.5 rounded-full bg-purple-200 text-purple-900 text-[10px] font-bold animate-pulse">
                            Playing
                          </span>
                        ) : (
                          <span className="text-[11px] text-neutral-400">
                            {track.durationText}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-black/5 bg-neutral-50 flex items-center justify-between">
            <span className="text-xs text-neutral-500">
              Powered by Web Speech Engine. Works offline without internet audio streaming.
            </span>
            <button
              onClick={() => {
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                setIsPlaying(false);
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-all"
            >
              Close Guide
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

function generateNarration(item: ItineraryItem, destinationName: string, dayNumber: number): string {
  const name = item.name;
  const lower = name.toLowerCase();

  if (lower.includes('aguada')) {
    return `Welcome to Fort Aguada! Built in 1612 by the Portuguese along the mouth of the Mandovi River, this 17th-century bastion was once the grandest water reservoir in Asia, storing 2.3 million gallons of fresh spring water for passing ships. Marvel at the four-tier lighthouse standing as a sentinel over the Arabian Sea.`;
  }
  if (lower.includes('bom jesus') || lower.includes('basilica')) {
    return `Standing before the Basilica of Bom Jesus, a UNESCO World Heritage site completed in 1605. Built with unplastered red laterite stone, it holds the sacred relics of St. Francis Xavier. Observe the exquisite baroque altar, gilded in pure gold leaf, reflecting Goa’s rich Portuguese Catholic legacy.`;
  }
  if (lower.includes('hawa mahal')) {
    return `Behold the Palace of Winds, Hawa Mahal, built in 1799 by Maharaja Sawai Pratap Singh. Its 953 honeycombed jharokhas were engineered with the Venturi effect to channel cool breezes during scorching desert summers, allowing royal women to observe street processions unseen.`;
  }
  if (lower.includes('amber') || lower.includes('amer')) {
    return `Rising above Maota Lake, the majestic Amber Fort is a masterpiece of Rajput-Mughal architecture. Step inside the Sheesh Mahal, or Mirror Palace, where thousands of convex Belgian glass mirrors illuminate the entire hall with the flame of just a single candle.`;
  }
  if (lower.includes('charminar')) {
    return `You are at the monumental heart of Hyderabad: the Charminar. Commissioned in 1591 by Sultan Muhammad Quli Qutb Shah to commemorate the eradication of plague, its four 48-meter minarets face the cardinal directions, anchoring the bustling Laad Bazaar pearl markets.`;
  }
  if (lower.includes('beach')) {
    return `You have arrived at ${name}, one of the celebrated coastlines of ${destinationName}. Notice the golden sands, rhythmic Arabian Sea tides, and vibrant beach shacks. Perfect for coastal relaxation, savoring fresh seafood curry, and catching panoramic sunset vistas.`;
  }

  return `Welcome to ${name} on Day ${dayNumber} of your journey through ${destinationName}. This curated stop offers authentic local character, renowned regional flavors, and cultural significance handpicked by your planning agent. Take your time to explore the surroundings.`;
}
