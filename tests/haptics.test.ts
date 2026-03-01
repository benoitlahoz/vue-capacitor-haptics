import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocked = vi.hoisted(() => ({
  impact: vi.fn(),
  notification: vi.fn(),
  selectionChanged: vi.fn(),
  selectionStart: vi.fn(),
  selectionEnd: vi.fn(),
  vibrate: vi.fn(),
  state: {
    native: true,
    platform: 'ios',
  },
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => mocked.state.native,
    getPlatform: () => mocked.state.platform,
  },
}));

vi.mock('@capacitor/haptics', () => ({
  Haptics: {
    impact: mocked.impact,
    notification: mocked.notification,
    selectionChanged: mocked.selectionChanged,
    selectionStart: mocked.selectionStart,
    selectionEnd: mocked.selectionEnd,
    vibrate: mocked.vibrate,
  },
  ImpactStyle: {
    Light: 'LIGHT',
    Medium: 'MEDIUM',
    Heavy: 'HEAVY',
    Rigid: 'RIGID',
    Soft: 'SOFT',
  },
  NotificationType: {
    Success: 'SUCCESS',
    Warning: 'WARNING',
    Error: 'ERROR',
  },
}));

import { createHaptics, useHaptics } from '../src/haptics';

describe('createHaptics', () => {
  beforeEach(() => {
    mocked.state.native = true;
    mocked.state.platform = 'ios';
    mocked.impact.mockReset();
    mocked.notification.mockReset();
    mocked.selectionChanged.mockReset();
    mocked.selectionStart.mockReset();
    mocked.selectionEnd.mockReset();
    mocked.vibrate.mockReset();

    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    Object.defineProperty(navigator, 'vibrate', {
      writable: true,
      value: vi.fn(),
    });
  });

  it('triggers selection haptic on native platform', async () => {
    const haptics = createHaptics();

    await haptics.trigger('selection');

    expect(mocked.selectionChanged).toHaveBeenCalledTimes(1);
  });

  it('softens cta impact on android', async () => {
    mocked.state.native = true;
    mocked.state.platform = 'android';
    const haptics = createHaptics();

    await haptics.trigger('cta');

    expect(mocked.impact).toHaveBeenCalledWith({ style: 'LIGHT' });
  });

  it('does nothing when disabled by resolver', async () => {
    const haptics = createHaptics({ enabled: () => false });

    await haptics.trigger('success');

    expect(mocked.notification).not.toHaveBeenCalled();
    expect(mocked.impact).not.toHaveBeenCalled();
  });

  it('uses web vibration fallback when not native', async () => {
    mocked.state.native = false;
    mocked.state.platform = 'web';
    const haptics = createHaptics({ webVibrateFallback: true });

    await haptics.trigger('error');

    expect(navigator.vibrate).toHaveBeenCalledWith([50, 40, 50]);
  });

  it('uses selection web fallback pattern when not native', async () => {
    mocked.state.native = false;
    mocked.state.platform = 'web';
    const haptics = createHaptics({ webVibrateFallback: true });

    await haptics.trigger('selection');

    expect(navigator.vibrate).toHaveBeenCalledWith(8);
  });

  it('createOnChangeTrigger triggers only when value changes', async () => {
    const haptics = createHaptics();
    const onIndexChange = haptics.createOnChangeTrigger<number>({
      kind: 'selection',
    });

    await onIndexChange(0);
    await onIndexChange(0);
    await onIndexChange(1);

    expect(mocked.selectionChanged).toHaveBeenCalledTimes(1);
  });

  it('createOnChangeTrigger can trigger on first value when skipInitial is false', async () => {
    const haptics = createHaptics();
    const onIndexChange = haptics.createOnChangeTrigger<number>({
      kind: 'selection',
      skipInitial: false,
    });

    await onIndexChange(0);

    expect(mocked.selectionChanged).toHaveBeenCalledTimes(1);
  });

  it('skips trigger when reduced motion is enabled', async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    const haptics = createHaptics({ respectReducedMotion: true });
    await haptics.trigger('cta');

    expect(mocked.impact).not.toHaveBeenCalled();
  });

  it('maps warning notification correctly on native', async () => {
    const haptics = createHaptics();
    await haptics.trigger('warning');

    expect(mocked.notification).toHaveBeenCalledWith({ type: 'WARNING' });
  });

  it('maps success notification correctly on native', async () => {
    const haptics = createHaptics();
    await haptics.trigger('success');

    expect(mocked.notification).toHaveBeenCalledWith({ type: 'SUCCESS' });
  });

  it('uses direct impact call when requestAnimationFrame is unavailable', async () => {
    vi.stubGlobal(
      'requestAnimationFrame',
      undefined as unknown as typeof requestAnimationFrame
    );
    const haptics = createHaptics();

    await haptics.trigger('tap');

    expect(mocked.impact).toHaveBeenCalledWith({ style: 'LIGHT' });
  });

  it('impact() uses native haptics when available', async () => {
    const haptics = createHaptics();

    await haptics.impact({ style: 'HEAVY' as any });

    expect(mocked.impact).toHaveBeenCalledWith({ style: 'HEAVY' });
  });

  it('impact() uses web fallback when not native', async () => {
    mocked.state.native = false;
    mocked.state.platform = 'web';
    const haptics = createHaptics({ webVibrateFallback: true });

    await haptics.impact({ style: 'MEDIUM' as any });

    expect(navigator.vibrate).toHaveBeenCalledWith(25);
  });

  it('impact() uses light fallback pattern on web when style is not medium', async () => {
    mocked.state.native = false;
    mocked.state.platform = 'web';
    const haptics = createHaptics({ webVibrateFallback: true });

    await haptics.impact({ style: 'LIGHT' as any });

    expect(navigator.vibrate).toHaveBeenCalledWith(12);
  });

  it('notification() uses web fallback mapping when not native', async () => {
    mocked.state.native = false;
    mocked.state.platform = 'web';
    const haptics = createHaptics({ webVibrateFallback: true });

    await haptics.notification({ type: 'WARNING' as any });

    expect(navigator.vibrate).toHaveBeenCalledWith([25, 30, 25]);
  });

  it('notification() default options fallback to success on web', async () => {
    mocked.state.native = false;
    mocked.state.platform = 'web';
    const haptics = createHaptics({ webVibrateFallback: true });

    await haptics.notification();

    expect(navigator.vibrate).toHaveBeenCalledWith(24);
  });

  it('selectionStart and selectionEnd call native APIs', async () => {
    const haptics = createHaptics();

    await haptics.selectionStart();
    await haptics.selectionEnd();

    expect(mocked.selectionStart).toHaveBeenCalledTimes(1);
    expect(mocked.selectionEnd).toHaveBeenCalledTimes(1);
  });

  it('vibrate() uses native API and web fallback', async () => {
    const nativeHaptics = createHaptics();
    await nativeHaptics.vibrate({ duration: 120 });
    expect(mocked.vibrate).toHaveBeenCalledWith({ duration: 120 });

    mocked.state.native = false;
    mocked.state.platform = 'web';
    const webHaptics = createHaptics({ webVibrateFallback: true });
    await webHaptics.vibrate({ duration: 90 });

    expect(navigator.vibrate).toHaveBeenCalledWith(90);
  });

  it('vibrate() uses fallback duration when missing', async () => {
    mocked.state.native = false;
    mocked.state.platform = 'web';
    const haptics = createHaptics({ webVibrateFallback: true });

    await haptics.vibrate({ duration: undefined as unknown as number });

    expect(navigator.vibrate).toHaveBeenCalledWith(100);
  });

  it('selectionChanged() delegates to trigger(selection)', async () => {
    const haptics = createHaptics();

    await haptics.selectionChanged();

    expect(mocked.selectionChanged).toHaveBeenCalledTimes(1);
  });

  it('useHaptics() creates a working engine with default options', async () => {
    const haptics = useHaptics();

    await haptics.trigger('tap');

    expect(mocked.impact).toHaveBeenCalledWith({ style: 'LIGHT' });
  });

  it('does not trigger same kind within repeat cooldown window', async () => {
    vi.stubGlobal(
      'requestAnimationFrame',
      undefined as unknown as typeof requestAnimationFrame
    );
    const dateNowSpy = vi.spyOn(Date, 'now');
    dateNowSpy.mockReturnValueOnce(1000).mockReturnValueOnce(1080);

    const haptics = createHaptics();
    await haptics.trigger('tap');
    await haptics.trigger('tap');

    expect(mocked.impact).toHaveBeenCalledTimes(1);
    dateNowSpy.mockRestore();
  });

  it('fails silently when native impact throws', async () => {
    mocked.impact.mockImplementationOnce(() => {
      throw new Error('boom');
    });
    const haptics = createHaptics();

    await expect(haptics.trigger('tap')).resolves.toBeUndefined();
  });

  it('fails silently when selection trigger throws', async () => {
    mocked.selectionChanged.mockImplementationOnce(() => {
      throw new Error('selection-trigger-error');
    });
    const haptics = createHaptics();

    await expect(haptics.trigger('selection')).resolves.toBeUndefined();
  });

  it('impact() fails silently when native impact throws', async () => {
    mocked.impact.mockImplementationOnce(() => {
      throw new Error('impact-error');
    });
    const haptics = createHaptics();

    await expect(haptics.impact()).resolves.toBeUndefined();
  });

  it('does nothing on non-native trigger when web fallback is disabled', async () => {
    mocked.state.native = false;
    mocked.state.platform = 'web';
    const haptics = createHaptics({ webVibrateFallback: false });

    await haptics.trigger('selection');
    await haptics.trigger('success');
    await haptics.trigger('cta');

    expect(mocked.selectionChanged).not.toHaveBeenCalled();
    expect(mocked.notification).not.toHaveBeenCalled();
    expect(navigator.vibrate).not.toHaveBeenCalled();
  });

  it('impact/notification/vibrate return early when disabled', async () => {
    const haptics = createHaptics({ enabled: false });

    await haptics.impact();
    await haptics.notification();
    await haptics.vibrate();

    expect(mocked.impact).not.toHaveBeenCalled();
    expect(mocked.notification).not.toHaveBeenCalled();
    expect(mocked.vibrate).not.toHaveBeenCalled();
  });

  it('selectionStart and selectionEnd return early when not native', async () => {
    mocked.state.native = false;
    mocked.state.platform = 'web';
    const haptics = createHaptics();

    await haptics.selectionStart();
    await haptics.selectionEnd();

    expect(mocked.selectionStart).not.toHaveBeenCalled();
    expect(mocked.selectionEnd).not.toHaveBeenCalled();
  });

  it('selectionStart and selectionEnd fail silently when native APIs throw', async () => {
    mocked.selectionStart.mockImplementationOnce(() => {
      throw new Error('selection-start-error');
    });
    mocked.selectionEnd.mockImplementationOnce(() => {
      throw new Error('selection-end-error');
    });
    const haptics = createHaptics();

    await expect(haptics.selectionStart()).resolves.toBeUndefined();
    await expect(haptics.selectionEnd()).resolves.toBeUndefined();
  });

  it('notification and vibrate fail silently when native APIs throw', async () => {
    mocked.notification.mockImplementationOnce(() => {
      throw new Error('notification-error');
    });
    mocked.vibrate.mockImplementationOnce(() => {
      throw new Error('vibrate-error');
    });
    const haptics = createHaptics();

    await expect(haptics.notification()).resolves.toBeUndefined();
    await expect(haptics.vibrate()).resolves.toBeUndefined();
  });

  it('createOnChangeTrigger supports custom equals', async () => {
    const haptics = createHaptics();
    const onChange = haptics.createOnChangeTrigger<{ id: number }>({
      kind: 'selection',
      skipInitial: true,
      equals: (a, b) => a.id === b.id,
    });

    await onChange({ id: 1 });
    await onChange({ id: 1 });
    await onChange({ id: 2 });

    expect(mocked.selectionChanged).toHaveBeenCalledTimes(1);
  });

  it('createOnChangeTrigger default options trigger selection on first change', async () => {
    const haptics = createHaptics();
    const onChange = haptics.createOnChangeTrigger<number>();

    await onChange(1);
    await onChange(2);

    expect(mocked.selectionChanged).toHaveBeenCalledTimes(1);
  });
});
