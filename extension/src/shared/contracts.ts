// Defines and validates every message and data record crossing an extension trust boundary.
import { z } from 'zod';

export const NoteSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(10_000),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type Note = z.infer<typeof NoteSchema>;

export const ChefTimerSchema = z.object({
  id: z.uuid(),
  label: z.string().trim().min(1).max(120),
  durationSeconds: z.number().int().positive().max(86_400),
  startedAt: z.iso.datetime(),
  endsAt: z.iso.datetime(),
  status: z.enum(['active', 'completed', 'cancelled']),
});

export type ChefTimer = z.infer<typeof ChefTimerSchema>;

export const ExtensionRequestSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('notes.list') }).strict(),
  z
    .object({
      type: z.literal('notes.create'),
      title: z.string().trim().min(1).max(120),
      body: z.string().trim().min(1).max(10_000),
    })
    .strict(),
  z.object({ type: z.literal('notes.delete'), id: z.uuid() }).strict(),
  z.object({ type: z.literal('timers.list') }).strict(),
  z
    .object({
      type: z.literal('timers.create'),
      label: z.string().trim().min(1).max(120),
      durationSeconds: z.number().int().positive().max(86_400),
    })
    .strict(),
  z.object({ type: z.literal('timers.cancel'), id: z.uuid() }).strict(),
  z.object({ type: z.literal('avatar.show') }).strict(),
]);

export type ExtensionRequest = z.infer<typeof ExtensionRequestSchema>;

export type ExtensionResponse<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };
