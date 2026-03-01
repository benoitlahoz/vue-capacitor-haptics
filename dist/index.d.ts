import { App } from 'vue';
import { Directive } from 'vue';
import { ImpactOptions } from '@capacitor/haptics';
import { ImpactStyle } from '@capacitor/haptics';
import { NotificationOptions as NotificationOptions_2 } from '@capacitor/haptics';
import { NotificationType } from '@capacitor/haptics';
import { Plugin as Plugin_2 } from 'vue';
import { VibrateOptions } from '@capacitor/haptics';

export declare const canUseWebVibration: () => boolean;

export declare const createHapticDirective: (config?: HapticDirectiveConfig) => Directive;

export declare const createHaptics: (options?: HapticEngineOptions) => {
    trigger: (kind: HapticKind, triggerOptions?: TriggerHapticOptions) => Promise<void>;
    impact: (impactOptions?: ImpactOptions) => Promise<void>;
    notification: (notificationOptions?: NotificationOptions_2) => Promise<void>;
    selectionStart: () => Promise<void>;
    selectionChanged: () => Promise<void>;
    selectionEnd: () => Promise<void>;
    vibrate: (vibrateOptions?: VibrateOptions) => Promise<void>;
    createOnChangeTrigger: <TValue>(onChangeOptions?: CreateOnChangeTriggerOptions<TValue>) => (nextValue: TValue) => Promise<boolean>;
    isNativeHapticsAvailable: () => boolean;
    canUseWebVibration: () => boolean;
};

export declare interface CreateOnChangeTriggerOptions<TValue> {
    kind?: HapticKind;
    throttle?: number;
    skipInitial?: boolean;
    equals?: (previous: TValue, next: TValue) => boolean;
}

export declare const hapticDirective: Directive;

export declare interface HapticDirectiveConfig {
    defaultEvent?: string;
    defaultKind?: HapticKind;
    engine?: HapticEngineOptions;
}

export declare interface HapticDirectiveValue {
    kind?: HapticKind;
    event?: string;
    throttle?: number;
    enabled?: boolean;
}

export declare interface HapticEngineOptions {
    enabled?: HapticsEnabledResolver;
    webVibrateFallback?: boolean;
    respectReducedMotion?: boolean;
    globalCooldownMs?: number;
    repeatCooldownMs?: number;
    defaultThrottleMs?: number;
}

export declare type HapticKind = 'tap' | 'toggle' | 'cta' | 'selection' | 'success' | 'warning' | 'error';

export declare type HapticsEnabledResolver = boolean | (() => boolean);

export declare interface HapticsPluginOptions extends HapticDirectiveConfig {
    directiveName?: string;
}

export declare type HapticsVuePlugin = Plugin_2 & {
    install: (app: App, options?: HapticsPluginOptions) => void;
};

export { ImpactOptions }

export { ImpactStyle }

export declare const isNativeHapticsAvailable: () => boolean;

export { NotificationOptions_2 as NotificationOptions }

export { NotificationType }

export declare interface TriggerHapticOptions {
    throttle?: number;
}

export declare const useHaptics: (options?: HapticEngineOptions) => {
    trigger: (kind: HapticKind, triggerOptions?: TriggerHapticOptions) => Promise<void>;
    impact: (impactOptions?: ImpactOptions) => Promise<void>;
    notification: (notificationOptions?: NotificationOptions_2) => Promise<void>;
    selectionStart: () => Promise<void>;
    selectionChanged: () => Promise<void>;
    selectionEnd: () => Promise<void>;
    vibrate: (vibrateOptions?: VibrateOptions) => Promise<void>;
    createOnChangeTrigger: <TValue>(onChangeOptions?: CreateOnChangeTriggerOptions<TValue>) => (nextValue: TValue) => Promise<boolean>;
    isNativeHapticsAvailable: () => boolean;
    canUseWebVibration: () => boolean;
};

export { VibrateOptions }

export declare const VueCapacitorHaptics: HapticsVuePlugin;

export { }
