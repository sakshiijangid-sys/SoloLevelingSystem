import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { format, subDays } from 'date-fns';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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

const defaultStatus: DailyBonusStatus = {
  lastDailyLoginDate: '',
  streak: 0,
  todayBonusGranted: false,
  todayBonusXP: 0,
  totalBonusXP: 0,
  claimedAt: ''
};

const getStorageKey = (uid: string) => `solo_leveling_daily_bonus_${uid}`;

const DailyBonusContext = createContext<DailyBonusContextType | undefined>(undefined);

export function calculateDailyBonusXP(streak: number): number {
  if (streak <= 0) return 50;
  if (streak % 7 === 0) return 150; // 7-day milestone special reward
  const streakBonus = Math.min((streak - 1) * 10, 50); // +10 XP per consecutive day up to +50 XP
  return 50 + streakBonus;
}

export function DailyBonusProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [bonusStatus, setBonusStatus] = useState<DailyBonusStatus>(defaultStatus);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isFirstVisitToday, setIsFirstVisitToday] = useState<boolean>(false);

  // Process daily login bonus strictly for authenticated users with a current login ID
  useEffect(() => {
    // 1. While auth state is resolving, do not run or show anything
    if (authLoading) {
      return;
    }

    // 2. If there is NO current login id, ensure daily bonus is not displayed or granted
    if (!user || !user.uid) {
      setBonusStatus(defaultStatus);
      setShowModal(false);
      setIsFirstVisitToday(false);
      return;
    }

    // 3. User is logged in with a valid current login ID
    let isCancelled = false;
    let timerId: NodeJS.Timeout | null = null;
    const currentUid = user.uid;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    const userKey = getStorageKey(currentUid);

    const processLoginForUser = async () => {
      // Check user-scoped local cache
      let current: DailyBonusStatus = defaultStatus;
      try {
        const cached = localStorage.getItem(userKey);
        if (cached) {
          current = JSON.parse(cached);
        }
      } catch {
        // Ignore storage errors
      }

      // Query user's Firestore profile for accurate sync
      try {
        const userRef = doc(db, 'users', currentUid);
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
        console.warn("Could not fetch remote daily bonus status:", err);
      }

      if (isCancelled) return;

      // Check if user already claimed today
      if (current.lastDailyLoginDate === todayStr) {
        const activeStreak = current.streak || 1;
        const statusToday: DailyBonusStatus = {
          ...current,
          todayBonusGranted: true,
          todayBonusXP: calculateDailyBonusXP(activeStreak)
        };
        setBonusStatus(statusToday);
        setIsFirstVisitToday(false);
        try {
          localStorage.setItem(userKey, JSON.stringify(statusToday));
        } catch {
          // Ignore storage errors
        }
        return;
      }

      // New Day Detected for logged-in user! Calculate new streak
      let newStreak = 1;
      if (current.lastDailyLoginDate === yesterdayStr) {
        newStreak = (current.streak || 0) + 1;
      } else {
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

      if (isCancelled) return;

      setBonusStatus(updatedStatus);
      setIsFirstVisitToday(true);

      try {
        localStorage.setItem(userKey, JSON.stringify(updatedStatus));
      } catch {
        // Ignore storage errors
      }

      // Save to Firestore user profile
      try {
        const userRef = doc(db, 'users', currentUid);
        await setDoc(userRef, {
          uid: currentUid,
          lastDailyLoginDate: todayStr,
          dailyLoginStreak: newStreak,
          totalDailyBonusXP: newTotalXP,
          lastClaimedAt: nowIso
        }, { merge: true });
      } catch (err) {
        console.warn("Could not save daily bonus to firestore:", err);
      }

      // Automatically trigger the Daily Bonus overlay after login verification
      timerId = setTimeout(() => {
        if (!isCancelled) {
          setShowModal(true);
        }
      }, 600);
    };

    processLoginForUser();

    return () => {
      isCancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [user?.uid, authLoading]);

  const openBonusModal = useCallback(() => {
    // Only allow opening if user is logged in
    if (!user?.uid) return;
    setShowModal(true);
  }, [user?.uid]);

  const handleSetShowModal = useCallback((show: boolean) => {
    if (show && !user?.uid) {
      setShowModal(false);
      return;
    }
    setShowModal(show);
  }, [user?.uid]);

  const claimBonus = useCallback(() => {
    setShowModal(false);
  }, []);

  return (
    <DailyBonusContext.Provider
      value={{
        bonusStatus,
        showModal,
        setShowModal: handleSetShowModal,
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
