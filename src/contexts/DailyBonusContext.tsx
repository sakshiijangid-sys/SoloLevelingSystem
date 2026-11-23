import { userProfileWrite } from '../lib/firestoreSchemas';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { format, subDays } from 'date-fns';
import { doc, runTransaction } from 'firebase/firestore';
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
    const processLoginForUser = async () => {
      try {
        localStorage.removeItem(`solo_leveling_daily_bonus_${currentUid}`);
      } catch {
        // Storage can be unavailable in private browsing.
      }

      try {
        const profile = doc(db, 'users', currentUid);
        const { status, firstVisit } = await runTransaction(db, async transaction => {
          const data = (await transaction.get(profile)).data();
          const firstVisit = data?.lastDailyLoginDate !== todayStr;
          const previousStreak = data?.dailyLoginStreak ?? 0;
          const streak = firstVisit
            ? (data?.lastDailyLoginDate === yesterdayStr ? previousStreak + 1 : 1)
            : previousStreak;
          const xp = calculateDailyBonusXP(streak);
          const totalBonusXP = (data?.totalDailyBonusXP ?? 0) + (firstVisit ? xp : 0);
          const claimedAt = firstVisit ? new Date().toISOString() : data?.lastClaimedAt ?? '';
          if (firstVisit) {
            transaction.set(profile, userProfileWrite.parse({
              uid: currentUid,
              lastDailyLoginDate: todayStr,
              dailyLoginStreak: streak,
              totalDailyBonusXP: totalBonusXP,
              lastClaimedAt: claimedAt,
            }), { merge: true });
          }
          return {
            firstVisit,
            status: { lastDailyLoginDate: todayStr, streak, todayBonusGranted: true,
              todayBonusXP: xp, totalBonusXP, claimedAt },
          };
        });
        if (isCancelled) return;
        setBonusStatus(status);
        setIsFirstVisitToday(firstVisit);
        if (firstVisit) timerId = setTimeout(() => setShowModal(true), 600);
      } catch (error) {
        console.warn('Could not sync daily bonus:', error);
      }
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
