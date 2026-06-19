// Provides schema-validated access to locally persisted notes and timer records.
import { z } from 'zod';
import {
  ChefTimerSchema,
  NoteSchema,
  type ChefTimer,
  type Note,
} from '../shared/contracts';

const STORAGE_KEYS = {
  notes: 'notes',
  timers: 'timers',
} as const;

async function readArray<T>(key: string, schema: z.ZodType<T>): Promise<T[]> {
  const stored = await chrome.storage.local.get(key);
  const result = z.array(schema).safeParse(stored[key]);
  return result.success ? result.data : [];
}

export const noteStore = {
  list: () => readArray(STORAGE_KEYS.notes, NoteSchema),
  save: (notes: Note[]) =>
    chrome.storage.local.set({ [STORAGE_KEYS.notes]: notes }),
};

export const timerStore = {
  list: () => readArray(STORAGE_KEYS.timers, ChefTimerSchema),
  save: (timers: ChefTimer[]) =>
    chrome.storage.local.set({ [STORAGE_KEYS.timers]: timers }),
};
