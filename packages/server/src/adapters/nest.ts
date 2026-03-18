import type { StreammyModuleOptions, NestDynamicModuleLike } from "../types.js";

export const STREAMMY_SERVER = Symbol.for("STREAMMY_SERVER");

export class StreammyModule {
  public static forRoot(options: StreammyModuleOptions): NestDynamicModuleLike {
    return {
      module: StreammyModule,
      global: options.global ?? false,
      providers: [
        {
          provide: STREAMMY_SERVER,
          useValue: {
            service: options.service,
            notifier: options.notifier,
            auth: options.auth,
            httpServer: options.httpServer,
          },
        },
      ],
      exports: [STREAMMY_SERVER],
    };
  }
}