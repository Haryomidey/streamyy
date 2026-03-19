import type { FastifyLikeInstance, StreammyHttpAdapterOptions } from "../types.js";

export const registerFastifyStreammyRoutes = (
  app: FastifyLikeInstance,
  options: StreammyHttpAdapterOptions,
): FastifyLikeInstance => {
  const basePath = options.basePath ?? "/streammy";

  app.route({
    method: "GET",
    url: `${basePath}/health`,
    handler: (_request, reply) => {
      reply.code(200).send({ ok: true, service: "streammy" });
    },
  });

  app.route({
    method: "POST",
    url: `${basePath}/calls`,
    handler: async (request, reply) => {
      const session = await options.service.initiateCall({
        callerId: String(request.body?.callerId),
        receiverId: String(request.body?.receiverId),
        callType: request.body?.callType === "video" ? "video" : "audio",
        ...(request.body?.metadata !== undefined ? { metadata: request.body.metadata } : {}),
      });

      reply.code(201).send(session);
    },
  });

  app.route({
    method: "POST",
    url: `${basePath}/calls/:callId/end`,
    handler: async (request, reply) => {
      const session = await options.service.endCall({
        callId: String(request.params?.callId),
        userId: String(request.body?.userId),
        ...(typeof request.body?.deviceId === "string" ? { deviceId: request.body.deviceId } : {}),
      });

      reply.code(200).send(session);
    },
  });

  return app;
};
