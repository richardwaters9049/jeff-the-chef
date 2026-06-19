// Verifies that extension message schemas accept intended commands and reject unsafe input.
import { describe, expect, it } from 'vitest';
import { ExtensionRequestSchema } from './contracts';

describe('ExtensionRequestSchema', () => {
  it('accepts a valid note creation request', () => {
    const result = ExtensionRequestSchema.safeParse({
      type: 'notes.create',
      title: 'Sourdough',
      body: 'Use 20 grams less water next time.',
    });

    expect(result.success).toBe(true);
  });

  it('rejects unknown executable fields', () => {
    const result = ExtensionRequestSchema.safeParse({
      type: 'timers.create',
      label: 'Potatoes',
      durationSeconds: 720,
      shellCommand: 'rm -rf /',
    });

    expect(result.success).toBe(false);
  });

  it('rejects timers longer than one day', () => {
    const result = ExtensionRequestSchema.safeParse({
      type: 'timers.create',
      label: 'Stock',
      durationSeconds: 90_000,
    });

    expect(result.success).toBe(false);
  });
});
