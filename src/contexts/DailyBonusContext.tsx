import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { format, subDays, parseISO, isSameDay } from 'date-fns';
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { DailyBonusStatus } from '../types';

interface DailyBonusContextType {
  bonusStatus: DailyBonusStatus;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  openBonusModal: () => void;
  claimBonus: () => void;
  isFirstVisitToday: boolean;
}

const STORAGE_KEY = 'solo_leveling_daily_bonus_v1';

const defaultStatus: DailyBonusStatus = {
  lastDailyLoginDate: '',
  streak: 0,
  todayBonusGranted: false,
  todayBonusXP: 50,
  totalBonusXP: 0,
  claimedAt: ''
};

const DailyBonusContext = createContext<DailyBonusContextType | undefined>(undefined);

export function calculateDailyBonusXP(streak: number): number {
  if (streak <= 0) return 50;
  if (streak % 7 === 0) return 150; // 7-day milestone special reward
  const streakBonus = Math.min((streak - 1) * 10, 50); // +10 XP per consecutive day up to +50 XP
  return 50 + streakBonus;
}

export function DailyBonusProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [bonusStatus, setBonusStatus] = useState<DailyBonusStatus>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore storage errors
    }
    return defaultStatus;
  });

  const [showModal, setShowModal] = useState<boolean>(false);
  const [isFirstVisitToday, setIsFirstVisitToday] = useState<boolean>(false);
  const [initialized, setInitialized] = useState<boolean>(false);

  // Check and process daily login bonus
  const processDailyLogin = useCallback(async () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');

    let current = { ...bonusStatus };

    // If user is logged in, try loading existing profile data from Firestore
    if (user?.uid) {
      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.lastDailyLoginDate) {
            current = {
              lastDailyLoginDate: data.lastDailyLoginDate,
              streak: data.dailyLoginStreak || current.streak || 0,
              todayBonusGranted: data.lastDailyLoginDate === todayStr,
              todayBonusXP: calculateDailyBonusXP((data.dailyLoginStreak || 0) + (data.lastDailyLoginDate === yesterdayStr ? 1 : 0)),
              totalBonusXP: data.totalDailyBonusXP || current.totalBonusXP || 0,
              claimedAt: data.lastClaimedAt || ''
            };
          }
        }
      } catch (err) {
        // Safe fallback to local cache/state if Firestore is temporarily offline
        console.warn("Could not fetch remote daily bonus status:", err);
      }
    }

    // Check if user already claimed today
    if (current.lastDailyLoginDate === todayStr) {
      setBonusStatus(prev => ({
        ...prev,
        ...current,
        todayBonusGranted: true,
        todayBonusXP: calculateDailyBonusXP(current.streak)
      }));
      setIsFirstVisitToday(false);
      setInitialized(true);
      return;
    }

    // New Day Detected! Calculate new streak
    let newStreak = 1;
    if (current.lastDailyLoginDate === yesterdayStr) {
      newStreak = (current.streak || 0) + 1;
    } else if (!current.lastDailyLoginDate) {
      newStreak = 1;
    } else {
      // Missed one or more days, reset streak to 1
      newStreak = 1;
    }

    const calculatedXP = calculateDailyBonusXP(newStreak);
    const newTotalXP = (current.totalBonusXP || 0) + calculatedXP;
    const nowIso = new Date().toISOString();

    const updatedStatus: DailyBonusStatus = {
      lastDailyLoginDate: todayStr,
      streak: newStreak,
      todayBonusGranted: true,
      todayBonusXP: calculatedXP,
      totalBonusXP: newTotalXP,
      claimedAt: nowIso
    };

    setBonusStatus(updatedStatus);
    setIsFirstVisitToday(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStatus));
    } catch {
      // Ignore local storage error
    }

    // Save to Firestore user profile
    if (user?.uid) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
          uid: user.uid,
          lastDailyLoginDate: todayStr,
          dailyLoginStreak: newStreak,
          totalDailyBonusXP: newTotalXP,
          lastClaimedAt: nowIso
        }, { merge: true });
      } catch (err) {
        console.warn("Could not save daily bonus to firestore:", err);
      }
    }

    // Automatically trigger the Daily Blessing overlay on first access of the day
    setTimeout(() => {
      setShowModal(true);
    }, 600);

    setInitialized(true);
  }, [user?.uid]);

  useEffect(() => {
    if (!initialized) {
      processDailyLogin();
    }
  }, [initialized, processDailyLogin]);

  const openBonusModal = () => {
    setShowModal(true);
  };

  const claimBonus = () => {
    setShowModal(false);
  };

  return (
    <DailyBonusContext.Provider
      value={{
        bonusStatus,
        showModal,
        setShowModal,
        openBonusModal,
        claimBonus,
        isFirstVisitToday
      }}
    >
      {children}
    </DailyBonusContext.Provider>
  );
}

export function useDailyBonus() {
  const context = useContext(DailyBonusContext);
  if (!context) {
    throw new Error('useDailyBonus must be used within a DailyBonusProvider');
  }
  return context;
}
