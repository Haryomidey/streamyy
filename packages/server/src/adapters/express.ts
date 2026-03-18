import type { ExpressLikeRouter, StreammyHttpAdapterOptions } from "../types.js";

const safeHandler = <TRequest, TResponse>(
  handler: (request: TRequest, response: TResponse) => Promise<void>,
) => {
  return (request: TRequest, response: TResponse): void => {
    void handler(request, response).catch((error) => {
      const message = error instanceof Error ? error.message : "Unexpected error";
      (response as any).status(500).json({ error: message });
    });
  };
};

export const registerExpressStreammyRoutes = (
  router: ExpressLikeRouter,
  options: StreammyHttpAdapterOptions,
): ExpressLikeRouter => {
  const basePath = options.basePath ?? "/streammy";

  router.get(
    `${basePath}/health`,
    safeHandler(async (_request, response) => {
      response.status(200).json({ ok: true, service: "streammy" });
    }),
  );

  router.post(
    `${basePath}/calls`,
    safeHandler(async (request, response) => {
      const session = await options.service.initiateCall({
        callerId: String(request.body?.callerId),
        receiverId: String(request.body?.receiverId),
        callType: request.body?.callType === "video" ? "video" : "audio",
        metadata: request.body?.metadata,
      });

      response.status(201).json(session);
    }),
  );

  router.post(
    `${basePath}/calls/:callId/end`,
    safeHandler(async (request, response) => {
      const session = await options.service.endCall({
        callId: String(request.params?.callId),
        userId: String(request.body?.userId),
        deviceId: typeof request.body?.deviceId === "string" ? request.body.deviceId : undefined,
      });

      response.status(200).json(session);
    }),
  );

  return router;
};
