declare module "react" {
  export type ReactNode = any;
  export type CSSProperties = Record<string, unknown>;
  export type PropsWithChildren<T = {}> = T & { children?: ReactNode };
  export interface Context<T> {
    Provider: any;
  }
  export function createContext<T>(value: T): Context<T>;
  export function useContext<T>(context: Context<T>): T;
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
  export function useRef<T>(value: T): { current: T };
  export function useState<T>(value: T): [T, (value: T | ((current: T) => T)) => void];
}

declare module "react/jsx-runtime" {
  export const Fragment: any;
  export function jsx(type: any, props: any, key?: any): any;
  export function jsxs(type: any, props: any, key?: any): any;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elementName: string]: any;
  }
}

declare module "socket.io-client" {
  export interface Socket {
    io: {
      on(event: string, listener: (payload?: any) => void): void;
    };
    connect(): void;
    disconnect(): void;
    emit(event: string, payload?: unknown): void;
    on(event: string, listener: (payload?: any) => void): void;
  }

  export function io(url: string, options?: Record<string, unknown>): Socket;
}
