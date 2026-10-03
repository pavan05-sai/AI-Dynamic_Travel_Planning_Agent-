import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi,
  WifiOff,
  Database,
  CheckCircle2,
  RefreshCw,
  X,
  Plus,
} from 'lucide-react';
import type { CanonicalItinerary } from '../types';
import { api } from '../services/api';

interface OfflineCompanionProps {
  itinerary: CanonicalItinerary;
  tripId: number | string;
  onExpenseLogged?: () => void;
}

interface OfflineNote {
  id: string;
  text: string;
  createdAt: string;
}

interface QueuedExpense {
  id: string;
  category: string;
  amount: number;
  note: string;
  date: string;
}

export const OfflineCompanion: React.FC<OfflineCompanionProps> = ({
  itinerary,
  tripId,
  onExpenseLogged,
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isOpen, setIsOpen] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');
  const [notes, setNotes] = useState<OfflineNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [queuedExpenses, setQueuedExpenses] = useState<QueuedExpense[]>([]);
  const [newExpAmount, setNewExpAmount] = useState('');
  const [newExpCategory, setNewExpCategory] = useState('food');
  const [newExpNote, setNewExpNote] = useState('');
  const [syncing, setSyncing] = useState(false);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncQueuedExpenses();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load stored notes & queue
    const savedNotes = localStorage.getItem(`wandor_notes_${tripId}`);
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch {}
    }

    const savedQueue = localStorage.getItem(`wandor_exp_queue_${tripId}`);
    if (savedQueue) {
      try {
        setQueuedExpenses(JSON.parse(savedQueue));
      } catch {}
    }

    // Cache itinerary offline
    try {
      localStorage.setItem(`wandor_cached_itinerary_${tripId}`, JSON.stringify(itinerary));
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch {}

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [itinerary, tripId]);

  const syncQueuedExpenses = async () => {
    if (queuedExpenses.length === 0 || syncing) return;
    setSyncing(true);
    try {
      for (const exp of queuedExpenses) {
        await api.logExpense(tripId, {
          category: exp.category,
          amount: exp.amount,
          note: `[Offline Sync] ${exp.note}`,
        });
      }
      setQueuedExpenses([]);
      localStorage.removeItem(`wandor_exp_queue_${tripId}`);
      if (onExpenseLogged) onExpenseLogged();
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      console.error('Failed to sync offline expenses:', e);
    } finally {
      setSyncing(false);
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const updated = [
      {
        id: `note_${Date.now()}`,
        text: newNote.trim(),
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      ...notes,
    ];
    setNotes(updated);
    localStorage.setItem(`wandor_notes_${tripId}`, JSON.stringify(updated));
    setNewNote('');
  };

  const handleAddExpenseOffline = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(newExpAmount);
    if (!amount || amount <= 0) return;

    const newEntry: QueuedExpense = {
      id: `q_${Date.now()}`,
      category: newExpCategory,
      amount,
      note: newExpNote || 'Offline expense',
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = [...queuedExpenses, newEntry];
    setQueuedExpenses(updated);
    localStorage.setItem(`wandor_exp_queue_${tripId}`, JSON.stringify(updated));
    setNewExpAmount('');
    setNewExpNote('');

    // If online, immediately sync
    if (isOnline) {
      setTimeout(syncQueuedExpenses, 500);
    }
  };

  return (
    <>
      {/* Floating Status Badge */}
      <div className="fixed bottom-5 left-5 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className={`px-3 py-2 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-lg border backdrop-blur-md transition-all hover:scale-105 cursor-pointer ${
            isOnline
              ? 'bg-white/95 text-emerald-800 border-emerald-300 shadow-emerald-900/10'
              : 'bg-amber-500 text-white border-amber-600 shadow-amber-900/20 animate-pulse'
          }`}
          title="Click to view offline companion, stored notes, and sync status"
        >
          {isOnline ? (
            <Wifi className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-white" />
          )}
          <span>{isOnline ? 'Offline Cached' : 'Offline Mode Active'}</span>
          {queuedExpenses.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
          )}
        </button>
      </div>

      {/* Modal Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-black/10 flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-black/5 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md ${
                      isOnline ? 'bg-emerald-600' : 'bg-amber-500'
                    }`}
                  >
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg text-neutral-900">
                        Offline Travel Companion
                      </h3>
                    </div>
                    <p className="text-xs text-neutral-500">
                      Network: {isOnline ? 'Online • Synced' : 'Disconnected • Offline Safe'} (Last sync: {lastSyncTime})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Offline Guarantee Banner */}
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Your {itinerary.trip.num_days}-day itinerary, maps, and emergency phone numbers are stored in offline memory. You can travel without cellular connection.
                  </span>
                </div>

                {/* Offline Expense Queue */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      Quick Offline Expense Logger:
                    </span>
                    {queuedExpenses.length > 0 && isOnline && (
                      <button
                        onClick={syncQueuedExpenses}
                        disabled={syncing}
                        className="text-[11px] text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
                        <span>Sync Now ({queuedExpenses.length})</span>
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleAddExpenseOffline} className="flex gap-2">
                    <input
                      type="number"
                      placeholder="₹ Amount"
                      value={newExpAmount}
                      onChange={(e) => setNewExpAmount(e.target.value)}
                      className="w-24 px-3 py-1.5 rounded-xl border border-neutral-300 text-xs font-bold"
                    />
                    <select
                      value={newExpCategory}
                      onChange={(e) => setNewExpCategory(e.target.value)}
                      className="px-2.5 py-1.5 rounded-xl border border-neutral-300 text-xs text-neutral-700"
                    >
                      <option value="food">Food</option>
                      <option value="transport">Transport</option>
                      <option value="activity">Activity</option>
                      <option value="shopping">Shopping</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Note (e.g. Chai, Auto fare)"
                      value={newExpNote}
                      onChange={(e) => setNewExpNote(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-neutral-300 text-xs"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold cursor-pointer"
                    >
                      Log
                    </button>
                  </form>

                  {queuedExpenses.length > 0 && (
                    <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs space-y-1">
                      <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                        Queued for Sync ({queuedExpenses.length}):
                      </span>
                      {queuedExpenses.map((q) => (
                        <div key={q.id} className="flex items-center justify-between text-neutral-700">
                          <span>{q.note} ({q.category})</span>
                          <span className="font-bold">₹{q.amount}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Offline Travel Field Notes */}
                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider block">
                    Offline Field Notes & Diary:
                  </span>
                  <form onSubmit={handleAddNote} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add landmark note, gate number, or local contact..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="flex-1 px-3.5 py-2 rounded-xl border border-neutral-300 text-xs text-neutral-800"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 rounded-xl bg-[#905831] hover:bg-[#7e4b28] text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </button>
                  </form>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {notes.length === 0 ? (
                      <p className="text-xs text-neutral-400 italic">No offline notes yet.</p>
                    ) : (
                      notes.map((note) => (
                        <div
                          key={note.id}
                          className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs flex items-center justify-between gap-2"
                        >
                          <span className="text-neutral-800">{note.text}</span>
                          <span className="text-[10px] text-neutral-400 shrink-0">
                            {note.createdAt}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-black/5 bg-neutral-50 flex items-center justify-between">
                <span className="text-[11px] text-neutral-500">
                  Data persists automatically across browser refreshes.
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-1.5 rounded-xl bg-neutral-900 text-white text-xs font-bold"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
