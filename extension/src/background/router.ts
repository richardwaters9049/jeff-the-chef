// Routes validated extension requests to local note and timer services.
import {
  ExtensionRequestSchema,
  type ExtensionResponse,
} from '../shared/contracts';
import { createNote, deleteNote, listNotes } from './notes';
import { cancelTimer, createTimer, listTimers } from './timers';

export async function routeRequest(input: unknown): Promise<ExtensionResponse> {
  const parsed = ExtensionRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Jeff received an invalid request.' };
  }

  try {
    switch (parsed.data.type) {
      case 'notes.list':
        return { ok: true, data: await listNotes() };
      case 'notes.create':
        return {
          ok: true,
          data: await createNote(parsed.data.title, parsed.data.body),
        };
      case 'notes.delete':
        await deleteNote(parsed.data.id);
        return { ok: true, data: null };
      case 'timers.list':
        return { ok: true, data: await listTimers() };
      case 'timers.create':
        return {
          ok: true,
          data: await createTimer(
            parsed.data.label,
            parsed.data.durationSeconds,
          ),
        };
      case 'timers.cancel':
        await cancelTimer(parsed.data.id);
        return { ok: true, data: null };
      case 'avatar.show':
        return { ok: true, data: null };
    }
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Jeff hit an unexpected error.',
    };
  }
}
