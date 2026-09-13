export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  startDate: string;
  targetDate: string;
  goal: string;
  progress: number; // 0-100
  xp: number;
  level: number;
  createdAt: any;
  completedAt?: any;
  status: 'active' | 'completed';
}

export interface DailyCheck {
  id: string;
  projectId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
}

export interface TaskLevel {
  id: string;
  projectId: string;
  name: string;
  isCompleted: boolean;
  index: number;
}

export interface MonthlyReport {
  id: string;
  projectId: string;
  month: string; // YYYY-MM
  levels: TaskLevel[];
  summary: string;
}

export interface DailyTask {
  id: string;
  projectId: string;
  userId: string;
  text: string;
  completed: boolean;
  createdAt: any;
  date?: string; // YYYY-MM-DD
  reminderTime?: string; // HH:mm
  projectName?: string; // Denormalized for alarms
}

export interface DailyBonusStatus {
  lastDailyLoginDate: string; // YYYY-MM-DD
  streak: number; // Consecutive days
  todayBonusGranted: boolean;
  todayBonusXP: number;
  totalBonusXP: number;
  claimedAt?: string;
}

export interface UserProfile {
  uid: string;
  lastDailyLoginDate?: string;
  dailyLoginStreak?: number;
  totalDailyBonusXP?: number;
  lastClaimedAt?: string;
}
