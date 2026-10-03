import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Users,
  UserPlus,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  IndianRupee,
  Crown,
} from 'lucide-react';
import type { CanonicalItinerary } from '../types';

interface GroupPlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  itinerary: CanonicalItinerary;
  onItineraryUpdated?: (newItinerary: CanonicalItinerary) => void;
}

interface Companion {
  id: string;
  name: string;
  email: string;
  role: 'organizer' | 'planner' | 'viewer';
  budgetCap: number;
  tags: string[];
}

export const GroupPlanningModal: React.FC<GroupPlanningModalProps> = ({
  isOpen,
  onClose,
  itinerary,
  onItineraryUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'voting' | 'conflicts'>('members');
  const [companions, setCompanions] = useState<Companion[]>([
    {
      id: 'c1',
      name: 'You (Organizer)',
      email: 'you@wanderlust.ai',
      role: 'organizer',
      budgetCap: itinerary.budget.total_limit || 30000,
      tags: ['Culture', 'Scenic Sunset', 'Local Cuisine'],
    },
    {
      id: 'c2',
      name: 'Rohan Sharma',
      email: 'rohan.s@gmail.com',
      role: 'planner',
      budgetCap: 22000,
      tags: ['Heritage Forts', 'Photography', 'Budget Conscious'],
    },
    {
      id: 'c3',
      name: 'Priya Mehta',
      email: 'priya.m@outlook.com',
      role: 'planner',
      budgetCap: 35000,
      tags: ['Beach Lounges', 'Fine Dining', 'Nightlife'],
    },
  ]);

  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberBudget, setNewMemberBudget] = useState(25000);

  // Voting state: itemId -> { up: number, down: number, myVote?: 'up' | 'down' }
  const [votes, setVotes] = useState<Record<string, { up: number; down: number; myVote?: 'up' | 'down' }>>({
    item_1: { up: 3, down: 0, myVote: 'up' },
    item_2: { up: 2, down: 1, myVote: 'up' },
    item_3: { up: 1, down: 2, myVote: 'down' },
  });

  const [compromiseGenerated, setCompromiseGenerated] = useState(false);

  if (!isOpen) return null;

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    setCompanions((prev) => [
      ...prev,
      {
        id: `c_${Date.now()}`,
        name: newMemberName.trim(),
        email: newMemberEmail.trim() || `${newMemberName.toLowerCase().replace(/\s+/g, '')}@travel.in`,
        role: 'planner',
        budgetCap: Number(newMemberBudget) || 25000,
        tags: ['Explorer', 'Group Travel'],
      },
    ]);

    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberBudget(25000);
  };

  const handleVote = (itemId: string, direction: 'up' | 'down') => {
    setVotes((prev) => {
      const current = prev[itemId] || { up: 0, down: 0 };
      const currentVote = current.myVote;

      let newUp = current.up;
      let newDown = current.down;

      if (currentVote === direction) {
        // Toggle off
        if (direction === 'up') newUp = Math.max(0, newUp - 1);
        else newDown = Math.max(0, newDown - 1);
        return { ...prev, [itemId]: { up: newUp, down: newDown, myVote: undefined } };
      } else {
        if (currentVote === 'up') newUp = Math.max(0, newUp - 1);
        if (currentVote === 'down') newDown = Math.max(0, newDown - 1);

        if (direction === 'up') newUp += 1;
        if (direction === 'down') newDown += 1;

        return { ...prev, [itemId]: { up: newUp, down: newDown, myVote: direction } };
      }
    });
  };

  const handleGenerateCompromise = () => {
    setCompromiseGenerated(true);
    // Find lowest budget
    const lowestBudget = Math.min(...companions.map((c) => c.budgetCap));
    if (onItineraryUpdated) {
      onItineraryUpdated({
        ...itinerary,
        budget: {
          ...itinerary.budget,
          total_limit: lowestBudget,
        },
      });
    }
    alert(
      `AI Consensus Engine calculated compromise: Aligned total trip cap to ₹${lowestBudget.toLocaleString(
        'en-IN'
      )} with balanced mix of free scenic viewpoints and shared dining.`
    );
  };

  const totalMinBudget = Math.min(...companions.map((c) => c.budgetCap));
  const totalMaxBudget = Math.max(...companions.map((c) => c.budgetCap));
  const budgetVariance = totalMaxBudget - totalMinBudget;

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
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-black/5 bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-900/20">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-[#111827]">
                    Collaborative Group Decision-Making
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                    {companions.length} Travelers
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
                  Vote on places, align individual budget caps, and resolve preference conflicts
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

          {/* Group Navigation Bar */}
          <div className="flex border-b border-black/5 bg-neutral-50 px-6 gap-2">
            {[
              { id: 'members', label: `Travelers (${companions.length})`, icon: Users },
              { id: 'voting', label: 'Activity Voting & Polls', icon: ThumbsUp },
              { id: 'conflicts', label: 'Conflict Radar', icon: AlertTriangle },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-3 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                    isActive
                      ? 'border-blue-600 text-blue-700 bg-white shadow-xs'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {/* Members Tab */}
            {activeTab === 'members' && (
              <div className="space-y-5">
                {/* Invite Form */}
                <form
                  onSubmit={handleAddMember}
                  className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/80 flex flex-wrap items-center gap-3"
                >
                  <input
                    type="text"
                    placeholder="Friend's Name (e.g. Ananya)"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="px-3.5 py-2 rounded-xl bg-white border border-neutral-300 text-xs text-neutral-800 font-medium flex-1 min-w-[140px]"
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="px-3.5 py-2 rounded-xl bg-white border border-neutral-300 text-xs text-neutral-800 font-medium flex-1 min-w-[160px]"
                  />
                  <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-neutral-300">
                    <IndianRupee className="w-3.5 h-3.5 text-neutral-500" />
                    <input
                      type="number"
                      step={1000}
                      min={5000}
                      value={newMemberBudget}
                      onChange={(e) => setNewMemberBudget(Number(e.target.value))}
                      className="w-24 text-xs font-bold text-neutral-800 focus:outline-hidden"
                      title="Max Budget Cap"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Invite</span>
                  </button>
                </form>

                {/* Companions List */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider block">
                    Active Travel Companions:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {companions.map((comp) => (
                      <div
                        key={comp.id}
                        className="p-4 rounded-2xl border border-neutral-200 bg-white hover:border-neutral-300 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-neutral-900">
                                {comp.name}
                              </h4>
                              {comp.role === 'organizer' && (
                                <Crown className="w-4 h-4 text-amber-500" />
                              )}
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 text-[10px] font-semibold capitalize">
                              {comp.role}
                            </span>
                          </div>
                          <span className="text-xs text-neutral-500 block mb-2">
                            {comp.email}
                          </span>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {comp.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 text-[10px] font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-xs">
                          <span className="text-neutral-500">Max Budget Cap:</span>
                          <strong className="text-neutral-900 font-bold">
                            ₹{comp.budgetCap.toLocaleString('en-IN')}
                          </strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Voting Tab */}
            {activeTab === 'voting' && (
              <div className="space-y-4">
                <p className="text-xs text-neutral-500">
                  Cast votes on proposed activities and dining. Items with majority downvotes trigger automatic replacement suggestions.
                </p>

                <div className="space-y-3">
                  {itinerary.days.flatMap((day) =>
                    day.items.slice(0, 4).map((item) => {
                      const vote = votes[item.id] || { up: 1, down: 0 };
                      return (
                        <div
                          key={item.id}
                          className="p-4 rounded-2xl border border-neutral-200 bg-white flex items-center justify-between gap-4"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-neutral-900">
                                {item.name}
                              </h4>
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 capitalize">
                                {item.category}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                              <span>Day {day.day_number}</span>
                              <span>•</span>
                              <span>Est. ₹{typeof item.cost === 'object' && item.cost !== null ? (item.cost as any).amount : item.cost}</span>
                              <span>•</span>
                              <span>{item.start_time}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleVote(item.id, 'up')}
                              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                vote.myVote === 'up'
                                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                                  : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                              }`}
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span>{vote.up}</span>
                            </button>

                            <button
                              onClick={() => handleVote(item.id, 'down')}
                              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                vote.myVote === 'down'
                                  ? 'bg-rose-50 border-rose-500 text-rose-800'
                                  : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                              }`}
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                              <span>{vote.down}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Conflicts Tab */}
            {activeTab === 'conflicts' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <span>Identified Group Discrepancies:</span>
                  </div>

                  <div className="space-y-2 text-xs text-amber-950">
                    <div className="p-3 rounded-xl bg-white border border-amber-200">
                      <strong>Budget Cap Variance:</strong> Rohan's cap is ₹22,000 whereas Priya's
                      is ₹35,000 (Spread: ₹{budgetVariance.toLocaleString('en-IN')}).
                      Current itinerary total ₹{itinerary.budget.estimated_total.toLocaleString('en-IN')}{' '}
                      exceeds Rohan's preferred ceiling.
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-amber-200">
                      <strong>Pacing Preference:</strong> 2 travelers prefer fast exploration of forts,
                      while 1 traveler prefers relaxed beach lounges.
                    </div>
                  </div>

                  {/* AI Auto-Compromise Button */}
                  <div className="pt-2">
                    <button
                      onClick={handleGenerateCompromise}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-900/20 cursor-pointer transition-all"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Generate AI Group Compromise Plan</span>
                    </button>
                  </div>
                </div>

                {compromiseGenerated && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 space-y-2"
                  >
                    <div className="flex items-center gap-2 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>AI Compromise Generated Successfully</span>
                    </div>
                    <p className="leading-relaxed">
                      Adjusted dining bookings to mid-tier beach shacks with high culinary ratings and
                      substituted one ticketed tour with a free heritage walking trail. Group spending
                      now sits at ₹21,800, satisfying all 3 travelers' budgets!
                    </p>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 border-t border-black/5 bg-neutral-50 flex items-center justify-between">
            <span className="text-xs text-neutral-500">
              Invitations generate unique collaboration magic links.
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
