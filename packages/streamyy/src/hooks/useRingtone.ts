import { useEffect, useRef } from "react";
import type { StreamyyRingtoneSource, TonePatternStep } from "../types.js";

const defaultIncoming: StreamyyRingtoneSource = {
  kind: "pattern",
  pattern: {
    steps: [
      { frequency: 880, durationMs: 220, gain: 0.06 },
      { frequency: 660, durationMs: 220, gain: 0.06 },
    ],
    pauseMs: 900,
  },
};

const defaultOutgoing: StreamyyRingtoneSource = {
  kind: "pattern",
  pattern: {
    steps: [{ frequency: 520, durationMs: 850, gain: 0.05 }],
    pauseMs: 1100,
  },
};

export const defaultRingtones = {
  incoming: defaultIncoming,
  outgoing: defaultOutgoing,
} as const;

type StopHandler = () => void;

const playToneStep = (
  context: AudioContext,
  gainNode: GainNode,
  step: TonePatternStep,
  startAt: number,
): number => {
  const oscillator = context.createOscillator();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(step.frequency, startAt);
  gainNode.gain.setValueAtTime(step.gain ?? 0.05, startAt);
  oscillator.connect(gainNode);
  oscillator.start(startAt);
  oscillator.stop(startAt + step.durationMs / 1000);
  return step.durationMs;
};

const startPatternPlayback = (source: Extract<StreamyyRingtoneSource, { kind: "pattern" }>): StopHandler => {
  const AudioContextCtor = window.AudioContext;
  if (!AudioContextCtor) {
    return () => {};
  }

  const context = new AudioContextCtor();
  const gainNode = context.createGain();
  gainNode.connect(context.destination);
  let cancelled = false;
  let timer: number | null = null;

  const schedule = async (): Promise<void> => {
    if (cancelled) {
      return;
    }

    if (context.state === "suspended") {
      await context.resume();
    }

    let cursor = context.currentTime;
    let totalMs = 0;

    for (const step of source.pattern.steps) {
      totalMs += playToneStep(context, gainNode, step, cursor);
      cursor += step.durationMs / 1000;
    }

    const pauseMs = source.pattern.pauseMs ?? 600;
    timer = window.setTimeout(() => {
      void schedule();
    }, totalMs + pauseMs);
  };

  void schedule();

  return () => {
    cancelled = true;
    if (timer !== null) {
      window.clearTimeout(timer);
    }
    gainNode.disconnect();
    void context.close();
  };
};

const startUrlPlayback = (source: Extract<StreamyyRingtoneSource, { kind: "url" }>): StopHandler => {
  const audio = new Audio(source.src);
  audio.loop = true;
  audio.volume = source.volume ?? 1;
  void audio.play().catch(() => {});

  return () => {
    audio.pause();
    audio.currentTime = 0;
  };
};

const createPlayback = (source: StreamyyRingtoneSource): StopHandler => {
  if (source.kind === "url") {
    return startUrlPlayback(source);
  }

  return startPatternPlayback(source);
};

export const useRingtone = (
  enabled: boolean,
  source: StreamyyRingtoneSource | undefined,
  fallback: "incoming" | "outgoing",
): void => {
  const stopRef = useRef<StopHandler | null>(null);

  useEffect(() => {
    if (!enabled) {
      stopRef.current?.();
      stopRef.current = null;
      return;
    }

    const resolvedSource = source ?? defaultRingtones[fallback];
    stopRef.current = createPlayback(resolvedSource);

    return () => {
      stopRef.current?.();
      stopRef.current = null;
    };
  }, [enabled, fallback, source]);
};
