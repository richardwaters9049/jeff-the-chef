// Implements safe local creation, listing, and deletion of kitchen notes.
import type { Note } from '../shared/contracts';
import { noteStore } from './storage';

export async function listNotes(): Promise<Note[]> {
  const notes = await noteStore.list();
  return notes.toSorted((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );
}

export async function createNote(title: string, body: string): Promise<Note> {
  const now = new Date().toISOString();
  const note: Note = {
    id: crypto.randomUUID(),
    title,
    body,
    createdAt: now,
    updatedAt: now,
  };
  const notes = await noteStore.list();
  await noteStore.save([...notes, note]);
  return note;
}

export async function deleteNote(id: string): Promise<void> {
  const notes = await noteStore.list();
  const remaining = notes.filter((note) => note.id !== id);
  if (remaining.length === notes.length) {
    throw new Error('That note no longer exists.');
  }
  await noteStore.save(remaining);
}
