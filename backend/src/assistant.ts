// Defines the provider-neutral assistant contract and a safe unavailable-provider fallback.
import { z } from 'zod';

export const AssistantRequestSchema = z
  .object({
    input: z.string().trim().min(1).max(4_000),
    locale: z.string().trim().min(2).max(20).default('en-GB'),
    context: z
      .object({
        activeTimerLabels: z.array(z.string().trim().min(1).max(120)).max(20),
      })
      .strict()
      .optional(),
  })
  .strict();

export type AssistantRequest = z.infer<typeof AssistantRequestSchema>;

export const AssistantResponseSchema = z.object({
  answer: z.string().min(1).max(8_000),
  suggestedActions: z.array(z.never()),
  requestId: z.string().min(1),
});

export type AssistantResponse = z.infer<typeof AssistantResponseSchema>;

export interface AssistantProvider {
  answer(
    request: AssistantRequest,
    requestId: string,
  ): Promise<AssistantResponse>;
}

export class UnavailableAssistantProvider implements AssistantProvider {
  answer(): Promise<AssistantResponse> {
    return Promise.reject(
      new Error('The cooking-answer provider has not been configured yet.'),
    );
  }
}
