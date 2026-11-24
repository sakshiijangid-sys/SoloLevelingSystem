import { z } from 'zod';

export const chatRequest = z.object({
  message: z.string().trim().min(1).max(8000),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(z.object({ text: z.string().max(8000) })).length(1),
  })).max(20).default([]),
  userName: z.string().max(160).default('Adventurer'),
  mode: z.enum(['chat', 'tip']).default('chat'),
}).strict();

const date = z.iso.date();
export const questArguments = z.object({
  questName: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(2000),
  startDate: date,
  endDate: date,
  tasks: z.array(z.object({
    text: z.string().trim().min(1).max(500),
    dayNumber: z.number().int().min(0).max(366),
    reminderTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  })).min(1).max(366),
}).refine(({ startDate, endDate, tasks }) => {
  const duration = (Date.parse(endDate) - Date.parse(startDate)) / 86_400_000;
  return duration >= 0 && tasks.every(task => task.dayNumber <= duration);
});
