// Sends typed requests to the service worker and validates data returned to the side panel.
import { z } from 'zod';
import {
  ChefTimerSchema,
  NoteSchema,
  type ChefTimer,
  type ExtensionRequest,
  type ExtensionResponse,
  type Note,
} from '../shared/contracts';

async function request<T>(
  message: ExtensionRequest,
  schema: z.ZodType<T>,
): Promise<T> {
  const response = (await chrome.runtime.sendMessage(
    message,
  )) as ExtensionResponse<unknown>;
  if (!response?.ok) {
    throw new Error(response?.error ?? 'Jeff did not respond.');
  }
  return schema.parse(response.data);
}

const NullSchema = z.null();

export const extensionApi = {
  listNotes: () => request({ type: 'notes.list' }, z.array(NoteSchema)),
  createNote: (title: string, body: string): Promise<Note> =>
    request({ type: 'notes.create', title, body }, NoteSchema),
  deleteNote: (id: string) => request({ type: 'notes.delete', id }, NullSchema),
  listTimers: () => request({ type: 'timers.list' }, z.array(ChefTimerSchema)),
  createTimer: (label: string, durationSeconds: number): Promise<ChefTimer> =>
    request({ type: 'timers.create', label, durationSeconds }, ChefTimerSchema),
  cancelTimer: (id: string) =>
    request({ type: 'timers.cancel', id }, NullSchema),
};
