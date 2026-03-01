import type { Directive, DirectiveBinding, ObjectDirective } from 'vue';
import {
  createHaptics,
  type HapticEngineOptions,
  type HapticKind,
} from './haptics';

export interface HapticDirectiveValue {
  kind?: HapticKind;
  event?: string;
  throttle?: number;
  enabled?: boolean;
}

export interface HapticDirectiveConfig {
  defaultEvent?: string;
  defaultKind?: HapticKind;
  engine?: HapticEngineOptions;
}

type HapticDirectiveBinding = HapticKind | HapticDirectiveValue | undefined;

type HapticElement = HTMLElement & {
  __hapticHandler__?: EventListener;
  __hapticEvent__?: string;
};

const HAPTIC_KINDS: ReadonlySet<string> = new Set([
  'tap',
  'toggle',
  'cta',
  'selection',
  'success',
  'warning',
  'error',
]);

const resolveFromBinding = (
  binding: DirectiveBinding<HapticDirectiveBinding>,
  defaultKind: HapticKind,
  defaultEvent: string
): Required<HapticDirectiveValue> => {
  const value = binding.value;

  if (typeof value === 'string') {
    return {
      kind: value,
      event: defaultEvent,
      throttle: 0,
      enabled: true,
    };
  }

  const arg = binding.arg;
  const argAsKind =
    arg && HAPTIC_KINDS.has(arg) ? (arg as HapticKind) : undefined;
  const argAsEvent = arg && !argAsKind ? arg : undefined;

  return {
    kind: value?.kind ?? argAsKind ?? defaultKind,
    event: value?.event ?? argAsEvent ?? defaultEvent,
    throttle: value?.throttle ?? 0,
    enabled: value?.enabled ?? true,
  };
};

const unbind = (el: HapticElement): void => {
  if (el.__hapticHandler__ && el.__hapticEvent__) {
    el.removeEventListener(el.__hapticEvent__, el.__hapticHandler__);
  }
  delete el.__hapticHandler__;
  delete el.__hapticEvent__;
};

export const createHapticDirective = (
  config: HapticDirectiveConfig = {}
): Directive => {
  const engine = createHaptics(config.engine);
  const defaultEvent = config.defaultEvent ?? 'pointerdown';
  const defaultKind = config.defaultKind ?? 'tap';

  const mountOrUpdate = (
    el: HapticElement,
    binding: DirectiveBinding<HapticDirectiveBinding>
  ): void => {
    unbind(el);

    const resolved = resolveFromBinding(binding, defaultKind, defaultEvent);

    const handler: EventListener = () => {
      if (!resolved.enabled) {
        return;
      }
      void engine.trigger(resolved.kind, {
        throttle: resolved.throttle > 0 ? resolved.throttle : undefined,
      });
    };

    el.__hapticHandler__ = handler;
    el.__hapticEvent__ = resolved.event;
    el.addEventListener(resolved.event, handler);
  };

  const directive: ObjectDirective<HapticElement, HapticDirectiveBinding> = {
    mounted(el, binding) {
      mountOrUpdate(el, binding);
    },
    updated(el, binding) {
      mountOrUpdate(el, binding);
    },
    unmounted(el) {
      unbind(el);
    },
  };

  return directive as Directive;
};

export const hapticDirective = createHapticDirective();
