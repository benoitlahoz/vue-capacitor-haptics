import { describe, expect, it, vi } from 'vitest';

const mocked = vi.hoisted(() => ({
  trigger: vi.fn(),
}));

vi.mock('../src/haptics', () => ({
  createHaptics: () => ({
    trigger: mocked.trigger,
  }),
}));

import { createHapticDirective } from '../src/directive';

describe('haptic directive', () => {
  it('binds default event and triggers kind from directive argument', () => {
    const directive = createHapticDirective();
    const el = document.createElement('button');

    directive.mounted?.(el as any, { value: undefined, arg: 'tap' } as any);
    el.dispatchEvent(new Event('pointerdown'));

    expect(mocked.trigger).toHaveBeenCalledWith('tap', { throttle: undefined });
  });

  it('falls back to default kind when no argument/value is provided', () => {
    mocked.trigger.mockReset();
    const directive = createHapticDirective({ defaultKind: 'toggle' });
    const el = document.createElement('button');

    directive.mounted?.(el as any, { value: undefined, arg: undefined } as any);
    el.dispatchEvent(new Event('pointerdown'));

    expect(mocked.trigger).toHaveBeenCalledWith('toggle', {
      throttle: undefined,
    });
  });

  it('supports custom kind and custom event from object config', () => {
    mocked.trigger.mockReset();
    const directive = createHapticDirective();
    const el = document.createElement('button');

    directive.mounted?.(
      el as any,
      {
        value: { kind: 'selection', event: 'click', throttle: 120 },
        arg: undefined,
      } as any
    );

    el.dispatchEvent(new Event('click'));

    expect(mocked.trigger).toHaveBeenCalledWith('selection', { throttle: 120 });
  });

  it('unbinds previous event on update and binds new one', () => {
    mocked.trigger.mockReset();
    const directive = createHapticDirective();
    const el = document.createElement('button');

    directive.mounted?.(
      el as any,
      {
        value: { kind: 'tap', event: 'click' },
        arg: undefined,
      } as any
    );

    directive.updated?.(
      el as any,
      {
        value: { kind: 'cta', event: 'pointerdown' },
        arg: undefined,
      } as any
    );

    el.dispatchEvent(new Event('click'));
    el.dispatchEvent(new Event('pointerdown'));

    expect(mocked.trigger).toHaveBeenCalledTimes(1);
    expect(mocked.trigger).toHaveBeenCalledWith('cta', { throttle: undefined });
  });

  it('does not trigger when local enabled is false', () => {
    mocked.trigger.mockReset();
    const directive = createHapticDirective();
    const el = document.createElement('button');

    directive.mounted?.(
      el as any,
      {
        value: { enabled: false, event: 'click' },
        arg: undefined,
      } as any
    );

    el.dispatchEvent(new Event('click'));

    expect(mocked.trigger).not.toHaveBeenCalled();
  });

  it('removes listener on unmount', () => {
    mocked.trigger.mockReset();
    const directive = createHapticDirective();
    const el = document.createElement('button');

    directive.mounted?.(
      el as any,
      {
        value: { event: 'click' },
        arg: undefined,
      } as any
    );

    directive.unmounted?.(el as any);
    el.dispatchEvent(new Event('click'));

    expect(mocked.trigger).not.toHaveBeenCalled();
  });

  it('supports kind from directive argument', () => {
    mocked.trigger.mockReset();
    const directive = createHapticDirective();
    const el = document.createElement('button');

    directive.mounted?.(
      el as any,
      {
        value: undefined,
        arg: 'success',
      } as any
    );

    el.dispatchEvent(new Event('pointerdown'));

    expect(mocked.trigger).toHaveBeenCalledWith('success', {
      throttle: undefined,
    });
  });

  it('supports event from directive argument when arg is not a kind', () => {
    mocked.trigger.mockReset();
    const directive = createHapticDirective();
    const el = document.createElement('button');

    directive.mounted?.(
      el as any,
      {
        value: { kind: 'tap' },
        arg: 'click',
      } as any
    );

    el.dispatchEvent(new Event('click'));

    expect(mocked.trigger).toHaveBeenCalledWith('tap', { throttle: undefined });
  });
});
