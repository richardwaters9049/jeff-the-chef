// Builds the privacy-conscious Fastify gateway and validates every assistant request and response.
import Fastify, {
  type FastifyInstance,
  type FastifyServerOptions,
} from 'fastify';
import {
  AssistantRequestSchema,
  AssistantResponseSchema,
  UnavailableAssistantProvider,
  type AssistantProvider,
} from './assistant.js';

type ServerOptions = {
  logger?: FastifyServerOptions['logger'];
  provider?: AssistantProvider;
};

export function buildServer(options: ServerOptions = {}): FastifyInstance {
  const provider = options.provider ?? new UnavailableAssistantProvider();
  const server = Fastify({
    bodyLimit: 1_000_000,
    logger: options.logger ?? false,
    disableRequestLogging: true,
  });

  server.get('/health', async () => ({ status: 'ok' }));

  server.post('/v1/assistant', async (request, reply) => {
    const parsed = AssistantRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'invalid_request',
        message: 'The assistant request was not valid.',
        requestId: request.id,
      });
    }

    try {
      const rawResponse = await provider.answer(parsed.data, request.id);
      const response = AssistantResponseSchema.parse(rawResponse);
      return reply.code(200).send(response);
    } catch {
      return reply.code(503).send({
        error: 'assistant_unavailable',
        message:
          'Cooking answers are temporarily unavailable. Local tools still work.',
        requestId: request.id,
      });
    }
  });

  server.setNotFoundHandler(async (request, reply) =>
    reply.code(404).send({
      error: 'not_found',
      message: 'That Jeff endpoint does not exist.',
      requestId: request.id,
    }),
  );

  return server;
}
