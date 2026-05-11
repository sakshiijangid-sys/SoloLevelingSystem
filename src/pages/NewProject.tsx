import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { motion } from 'motion/react';
import { ChevronLeft, Zap, Target, Calendar, Info } from 'lucide-react';

export default function NewProject() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    targetDate: '',
    goal: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'projects'), {
        ...formData,
        userId: user.uid,
        progress: 0,
        xp: 0,
        level: 1,
        status: 'active',
        createdAt: serverTimestamp(),
      });
      navigate('/');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'projects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white pt-24 pb-12 px-6 transition-colors duration-300">
      <div className="max-w-3xl mx-auto space-y-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-white transition-colors font-bold uppercase tracking-widest text-xs"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="space-y-2">
          <h1 className="text-4xl font-black uppercase tracking-tighter italic bg-gradient-to-r from-gray-900 via-purple-600 to-purple-500 dark:from-white dark:to-purple-500 bg-clip-text text-transparent">
            Start a New Quest
          </h1>
          <p className="text-gray-500 dark:text-gray-500 font-mono text-sm uppercase tracking-widest">
            Enter the details for your new quest.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-purple-500/20 p-8 rounded-3xl backdrop-blur-sm shadow-xl dark:shadow-[0_0_30px_rgba(168,85,247,0.1)] transition-colors">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest flex items-center gap-2">
                <Zap className="w-3 h-3" /> Quest Name
              </label>
              <input
                required
                type="text"
                placeholder="e.g., Master React.js"
                className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-purple-500/30 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest flex items-center gap-2">
                <Info className="w-3 h-3" /> Description
              </label>
              <textarea
                rows={3}
                placeholder="Write a short description..."
                className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-purple-500/30 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> Start Date
                </label>
                <input
                  required
                  type="date"
                  className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-purple-500/30 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> Target Date
                </label>
                <input
                  required
                  type="date"
                  className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-purple-500/30 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest flex items-center gap-2">
                <Target className="w-3 h-3" /> Main Quest
              </label>
              <input
                required
                type="text"
                placeholder="e.g., Land a Senior Developer job"
                className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-purple-500/30 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'SAVING...' : 'START QUEST'}
          </motion.button>
        </form>
      </div>
    </div>
  );
}
