import { Capacitor } from '@capacitor/core';
import {
  Haptics,
  ImpactStyle,
  NotificationType,
  type ImpactOptions,
  type NotificationOptions,
  type VibrateOptions,
} from '@capacitor/haptics';

export type HapticKind =
  | 'tap'
  | 'toggle'
  | 'cta'
  | 'selection'
  | 'success'
  | 'warning'
  | 'error';

export type HapticsEnabledResolver = boolean | (() => boolean);

export interface HapticEngineOptions {
  enabled?: HapticsEnabledResolver;
  webVibrateFallback?: boolean;
  respectReducedMotion?: boolean;
  globalCooldownMs?: number;
  repeatCooldownMs?: number;
  defaultThrottleMs?: number;
}

export interface TriggerHapticOptions {
  throttle?: number;
}

export interface CreateOnChangeTriggerOptions<TValue> {
  kind?: HapticKind;
  throttle?: number;
  skipInitial?: boolean;
  equals?: (previous: TValue, next: TValue) => boolean;
}

const DEFAULT_ENGINE_OPTIONS: Required<HapticEngineOptions> = {
  enabled: true,
  webVibrateFallback: true,
  respectReducedMotion: true,
  globalCooldownMs: 70,
  repeatCooldownMs: 120,
  defaultThrottleMs: 70,
};

const resolveEnabled = (enabled: HapticsEnabledResolver): boolean =>
  typeof enabled === 'function' ? enabled() : enabled;

const prefersReducedMotion = (): boolean => {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const canUseWebVibration = (): boolean =>
  typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

const vibrateOnWeb = (pattern: number | number[]): void => {
  if (canUseWebVibration()) {
    navigator.vibrate(pattern);
  }
};

export const isNativeHapticsAvailable = (): boolean =>
  Capacitor.isNativePlatform();
const isAndroid = (): boolean => Capacitor.getPlatform() === 'android';

const getImpactStyle = (kind: HapticKind, android: boolean): ImpactStyle => {
  const style = kind === 'cta' ? ImpactStyle.Medium : ImpactStyle.Light;
  if (android && style === ImpactStyle.Medium) {
    return ImpactStyle.Light;
  }
  return style;
};

const getNotificationType = (kind: HapticKind): NotificationType => {
  if (kind === 'error') {
    return NotificationType.Error;
  }
  if (kind === 'warning') {
    return NotificationType.Warning;
  }
  return NotificationType.Success;
};

const getWebFallbackPattern = (
  kind: HapticKind,
  style?: ImpactStyle
): number | number[] => {
  if (kind === 'selection') {
    return 8;
  }
  if (kind === 'error') {
    return [50, 40, 50];
  }
  if (kind === 'warning') {
    return [25, 30, 25];
  }
  if (kind === 'success') {
    return 24;
  }
  if (style === ImpactStyle.Medium) {
    return 25;
  }
  return 12;
};

export const createHaptics = (options: HapticEngineOptions = {}) => {
  const resolvedOptions = {
    ...DEFAULT_ENGINE_OPTIONS,
    ...options,
  };

  let lastTriggerAt = 0;
  let lastKind: HapticKind | null = null;

  const shouldTrigger = (kind: HapticKind, throttle?: number): boolean => {
    const now = Date.now();
    const cooldown = throttle ?? resolvedOptions.defaultThrottleMs;

    if (
      now - lastTriggerAt <
      Math.max(resolvedOptions.globalCooldownMs, cooldown)
    ) {
      return false;
    }

    if (
      lastKind === kind &&
      now - lastTriggerAt < resolvedOptions.repeatCooldownMs
    ) {
      return false;
    }

    lastTriggerAt = now;
    lastKind = kind;
    return true;
  };

  const trigger = async (
    kind: HapticKind,
    triggerOptions: TriggerHapticOptions = {}
  ): Promise<void> => {
    if (!resolveEnabled(resolvedOptions.enabled)) {
      return;
    }

    if (resolvedOptions.respectReducedMotion && prefersReducedMotion()) {
      return;
    }

    if (!shouldTrigger(kind, triggerOptions.throttle)) {
      return;
    }

    const native = isNativeHapticsAvailable();
    const android = isAndroid();

    try {
      if (kind === 'selection') {
        if (native) {
          await Haptics.selectionChanged();
        } else if (resolvedOptions.webVibrateFallback) {
          vibrateOnWeb(getWebFallbackPattern(kind));
        }
        return;
      }

      if (kind === 'success' || kind === 'warning' || kind === 'error') {
        if (native) {
          await Haptics.notification({ type: getNotificationType(kind) });
        } else if (resolvedOptions.webVibrateFallback) {
          vibrateOnWeb(getWebFallbackPattern(kind));
        }
        return;
      }

      const style = getImpactStyle(kind, android);
      if (native) {
        if (typeof requestAnimationFrame === 'function') {
          requestAnimationFrame(() => {
            void Haptics.impact({ style });
          });
        } else {
          await Haptics.impact({ style });
        }
      } else if (resolvedOptions.webVibrateFallback) {
        vibrateOnWeb(getWebFallbackPattern(kind, style));
      }
    } catch {
      return;
    }
  };

  const impact = async (
    impactOptions: ImpactOptions = { style: ImpactStyle.Medium }
  ): Promise<void> => {
    if (!resolveEnabled(resolvedOptions.enabled)) {
      return;
    }

    try {
      if (isNativeHapticsAvailable()) {
        await Haptics.impact(impactOptions);
      } else if (resolvedOptions.webVibrateFallback) {
        vibrateOnWeb(getWebFallbackPattern('tap', impactOptions.style));
      }
    } catch {
      return;
    }
  };

  const notification = async (
    notificationOptions: NotificationOptions = {
      type: NotificationType.Success,
    }
  ): Promise<void> => {
    if (!resolveEnabled(resolvedOptions.enabled)) {
      return;
    }

    try {
      if (isNativeHapticsAvailable()) {
        await Haptics.notification(notificationOptions);
      } else if (resolvedOptions.webVibrateFallback) {
        const kind =
          notificationOptions.type === NotificationType.Error
            ? 'error'
            : notificationOptions.type === NotificationType.Warning
            ? 'warning'
            : 'success';
        vibrateOnWeb(getWebFallbackPattern(kind));
      }
    } catch {
      return;
    }
  };

  const selectionStart = async (): Promise<void> => {
    if (
      !resolveEnabled(resolvedOptions.enabled) ||
      !isNativeHapticsAvailable()
    ) {
      return;
    }
    try {
      await Haptics.selectionStart();
    } catch {
      return;
    }
  };

  const selectionChanged = async (): Promise<void> => {
    await trigger('selection');
  };

  const selectionEnd = async (): Promise<void> => {
    if (
      !resolveEnabled(resolvedOptions.enabled) ||
      !isNativeHapticsAvailable()
    ) {
      return;
    }
    try {
      await Haptics.selectionEnd();
    } catch {
      return;
    }
  };

  const vibrate = async (
    vibrateOptions: VibrateOptions = { duration: 100 }
  ): Promise<void> => {
    if (!resolveEnabled(resolvedOptions.enabled)) {
      return;
    }
    try {
      if (isNativeHapticsAvailable()) {
        await Haptics.vibrate(vibrateOptions);
      } else if (resolvedOptions.webVibrateFallback) {
        vibrateOnWeb(vibrateOptions.duration ?? 100);
      }
    } catch {
      return;
    }
  };

  const createOnChangeTrigger = <TValue>(
    onChangeOptions: CreateOnChangeTriggerOptions<TValue> = {}
  ) => {
    const kind = onChangeOptions.kind ?? 'selection';
    const equals = onChangeOptions.equals ?? Object.is;
    const skipInitial = onChangeOptions.skipInitial ?? true;

    let hasPreviousValue = false;
    let previousValue: TValue;

    return async (nextValue: TValue): Promise<boolean> => {
      if (!hasPreviousValue) {
        hasPreviousValue = true;
        previousValue = nextValue;
        if (skipInitial) {
          return false;
        }
        await trigger(kind, { throttle: onChangeOptions.throttle });
        return true;
      }

      if (equals(previousValue, nextValue)) {
        return false;
      }

      previousValue = nextValue;
      await trigger(kind, { throttle: onChangeOptions.throttle });
      return true;
    };
  };

  return {
    trigger,
    impact,
    notification,
    selectionStart,
    selectionChanged,
    selectionEnd,
    vibrate,
    createOnChangeTrigger,
    isNativeHapticsAvailable,
    canUseWebVibration,
  };
};

export const useHaptics = (options: HapticEngineOptions = {}) =>
  createHaptics(options);

export { ImpactStyle, NotificationType };
export type { ImpactOptions, NotificationOptions, VibrateOptions };
