import { FieldValue } from 'firebase/firestore';
import { z } from 'zod';

export const documentId = z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/);
const uid = z.string().min(1).max(128);
const date = z.iso.date();
const timestamp = z.custom<FieldValue>(value => value instanceof FieldValue);
const progress = z.number().min(0).max(100);
const xp = z.number().min(0);
const level = z.number().int().min(1);
const status = z.enum(['active', 'completed']);

export const projectProgress = z.object({
  progress, xp, level, status,
  completedAt: timestamp.nullable(),
});
export const projectWrite = projectProgress.omit({ completedAt: true }).extend({
  userId: uid,
  name: z.string().trim().min(1).max(100),
  description: z.string().max(2000),
  goal: z.string().max(500),
  startDate: date,
  targetDate: date,
  createdAt: timestamp,
  lastProcessed: timestamp.optional(),
}).refine(project => project.targetDate >= project.startDate);

export const dailyCheckWrite = z.object({
  projectId: documentId,
  userId: uid,
  date,
  completed: z.boolean(),
});
export const dailyTaskChanges = z.object({
  text: z.string().trim().min(1).max(500),
  reminderTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable(),
  projectName: z.string().max(100),
  completed: z.boolean(),
}).partial();
export const dailyTaskWrite = dailyCheckWrite.extend({
  text: dailyTaskChanges.shape.text.unwrap(),
  reminderTime: dailyTaskChanges.shape.reminderTime,
  projectName: dailyTaskChanges.shape.projectName,
  createdAt: timestamp,
});

export const reportChanges = z.object({
  levels: z.array(z.object({
    id: z.string().min(1).max(200),
    projectId: documentId,
    name: z.string().min(1).max(100),
    isCompleted: z.boolean(),
    index: level,
  })).max(100),
});
export const reportWrite = reportChanges.extend({
  projectId: documentId,
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  summary: z.string().max(2000),
});

export const userProfileWrite = z.object({
  uid,
  lastDailyLoginDate: date,
  dailyLoginStreak: z.number().int().min(1),
  totalDailyBonusXP: z.number().int().min(0),
  lastClaimedAt: z.iso.datetime(),
});
export const chatMessageWrite = z.object({
  userId: uid,
  role: z.enum(['user', 'model']),
  text: z.string().min(1).max(32000),
  createdAt: timestamp,
});
