import { Capacitor } from '@capacitor/core';
import { NotificationType, ImpactStyle, Haptics } from '@capacitor/haptics';
export { ImpactStyle, NotificationType } from '@capacitor/haptics';

const i = {
    enabled: true,
    webVibrateFallback: true,
    respectReducedMotion: true,
    globalCooldownMs: 70,
    repeatCooldownMs: 120,
    defaultThrottleMs: 70
};
const resolveEnabled = (e)=>typeof e === 'function' ? e() : e;
const prefersReducedMotion = ()=>{
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};
const canUseWebVibration = ()=>typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
const vibrateOnWeb = (e)=>{
    if (canUseWebVibration()) {
        navigator.vibrate(e);
    }
};
const isNativeHapticsAvailable = ()=>Capacitor.isNativePlatform();
const isAndroid = ()=>Capacitor.getPlatform() === 'android';
const getImpactStyle = (e, t)=>{
    const r = e === 'cta' ? ImpactStyle.Medium : ImpactStyle.Light;
    if (t && r === ImpactStyle.Medium) {
        return ImpactStyle.Light;
    }
    return r;
};
const getNotificationType = (e)=>{
    if (e === 'error') {
        return NotificationType.Error;
    }
    if (e === 'warning') {
        return NotificationType.Warning;
    }
    return NotificationType.Success;
};
const getWebFallbackPattern = (e, t)=>{
    if (e === 'selection') {
        return 8;
    }
    if (e === 'error') {
        return [
            50,
            40,
            50
        ];
    }
    if (e === 'warning') {
        return [
            25,
            30,
            25
        ];
    }
    if (e === 'success') {
        return 24;
    }
    if (t === ImpactStyle.Medium) {
        return 25;
    }
    return 12;
};
const createHaptics = (e = {})=>{
    const n = {
        ...i,
        ...e
    };
    let o = 0;
    let c = null;
    const shouldTrigger = (e, t)=>{
        const a = Date.now();
        const r = t ?? n.defaultThrottleMs;
        if (a - o < Math.max(n.globalCooldownMs, r)) {
            return false;
        }
        if (c === e && a - o < n.repeatCooldownMs) {
            return false;
        }
        o = a;
        c = e;
        return true;
    };
    const trigger = async (e, a = {})=>{
        if (!resolveEnabled(n.enabled)) {
            return;
        }
        if (n.respectReducedMotion && prefersReducedMotion()) {
            return;
        }
        if (!shouldTrigger(e, a.throttle)) {
            return;
        }
        const r = isNativeHapticsAvailable();
        const i = isAndroid();
        try {
            if (e === 'selection') {
                if (r) {
                    await Haptics.selectionChanged();
                } else if (n.webVibrateFallback) {
                    vibrateOnWeb(getWebFallbackPattern(e));
                }
                return;
            }
            if (e === 'success' || e === 'warning' || e === 'error') {
                if (r) {
                    await Haptics.notification({
                        type: getNotificationType(e)
                    });
                } else if (n.webVibrateFallback) {
                    vibrateOnWeb(getWebFallbackPattern(e));
                }
                return;
            }
            const a = getImpactStyle(e, i);
            if (r) {
                if (typeof requestAnimationFrame === 'function') {
                    requestAnimationFrame(()=>{
                        void Haptics.impact({
                            style: a
                        });
                    });
                } else {
                    await Haptics.impact({
                        style: a
                    });
                }
            } else if (n.webVibrateFallback) {
                vibrateOnWeb(getWebFallbackPattern(e, a));
            }
        } catch  {
            return;
        }
    };
    const impact = async (e = {
        style: ImpactStyle.Medium
    })=>{
        if (!resolveEnabled(n.enabled)) {
            return;
        }
        try {
            if (isNativeHapticsAvailable()) {
                await Haptics.impact(e);
            } else if (n.webVibrateFallback) {
                vibrateOnWeb(getWebFallbackPattern('tap', e.style));
            }
        } catch  {
            return;
        }
    };
    const notification = async (e = {
        type: NotificationType.Success
    })=>{
        if (!resolveEnabled(n.enabled)) {
            return;
        }
        try {
            if (isNativeHapticsAvailable()) {
                await Haptics.notification(e);
            } else if (n.webVibrateFallback) {
                const t = e.type === NotificationType.Error ? 'error' : e.type === NotificationType.Warning ? 'warning' : 'success';
                vibrateOnWeb(getWebFallbackPattern(t));
            }
        } catch  {
            return;
        }
    };
    const selectionStart = async ()=>{
        if (!resolveEnabled(n.enabled) || !isNativeHapticsAvailable()) {
            return;
        }
        try {
            await Haptics.selectionStart();
        } catch  {
            return;
        }
    };
    const selectionChanged = async ()=>{
        await trigger('selection');
    };
    const selectionEnd = async ()=>{
        if (!resolveEnabled(n.enabled) || !isNativeHapticsAvailable()) {
            return;
        }
        try {
            await Haptics.selectionEnd();
        } catch  {
            return;
        }
    };
    const vibrate = async (e = {
        duration: 100
    })=>{
        if (!resolveEnabled(n.enabled)) {
            return;
        }
        try {
            if (isNativeHapticsAvailable()) {
                await Haptics.vibrate(e);
            } else if (n.webVibrateFallback) {
                vibrateOnWeb(e.duration ?? 100);
            }
        } catch  {
            return;
        }
    };
    const createOnChangeTrigger = (e = {})=>{
        const t = e.kind ?? 'selection';
        const a = e.equals ?? Object.is;
        const r = e.skipInitial ?? true;
        let i = false;
        let n;
        return async (o)=>{
            if (!i) {
                i = true;
                n = o;
                if (r) {
                    return false;
                }
                await trigger(t, {
                    throttle: e.throttle
                });
                return true;
            }
            if (a(n, o)) {
                return false;
            }
            n = o;
            await trigger(t, {
                throttle: e.throttle
            });
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
        canUseWebVibration
    };
};
const useHaptics = (e = {})=>createHaptics(e);

const t = new Set([
    'tap',
    'toggle',
    'cta',
    'selection',
    'success',
    'warning',
    'error'
]);
const resolveFromBinding = (e, n, r)=>{
    const i = e.value;
    if (typeof i === 'string') {
        return {
            kind: i,
            event: r,
            throttle: 0,
            enabled: true
        };
    }
    const o = e.arg;
    const d = o && t.has(o) ? o : undefined;
    const a = o && !d ? o : undefined;
    return {
        kind: i?.kind ?? d ?? n,
        event: i?.event ?? a ?? r,
        throttle: i?.throttle ?? 0,
        enabled: i?.enabled ?? true
    };
};
const unbind = (e)=>{
    if (e.__hapticHandler__ && e.__hapticEvent__) {
        e.removeEventListener(e.__hapticEvent__, e.__hapticHandler__);
    }
    delete e.__hapticHandler__;
    delete e.__hapticEvent__;
};
const createHapticDirective = (t = {})=>{
    const n = createHaptics(t.engine);
    const r = t.defaultEvent ?? 'pointerdown';
    const i = t.defaultKind ?? 'tap';
    const mountOrUpdate = (e, t)=>{
        unbind(e);
        const o = resolveFromBinding(t, i, r);
        const handler = ()=>{
            if (!o.enabled) {
                return;
            }
            void n.trigger(o.kind, {
                throttle: o.throttle > 0 ? o.throttle : undefined
            });
        };
        e.__hapticHandler__ = handler;
        e.__hapticEvent__ = o.event;
        e.addEventListener(o.event, handler);
    };
    const o = {
        mounted (e, t) {
            mountOrUpdate(e, t);
        },
        updated (e, t) {
            mountOrUpdate(e, t);
        },
        unmounted (e) {
            unbind(e);
        }
    };
    return o;
};
const hapticDirective = createHapticDirective();

const VueCapacitorHaptics = {
    install (i, c = {}) {
        const { directiveName: o = 'haptic', ...e } = c;
        const r = createHapticDirective(e);
        i.directive(o, r);
    }
};

export { VueCapacitorHaptics, canUseWebVibration, createHapticDirective, createHaptics, hapticDirective, isNativeHapticsAvailable, useHaptics };
//# sourceMappingURL=index.js.map
