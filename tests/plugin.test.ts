import { describe, expect, it, vi } from 'vitest';
import { VueCapacitorHaptics } from '../src/plugin';

describe('haptics plugin', () => {
  it('registers default directive name with app.use(plugin)', () => {
    const directive = vi.fn();
    const app = { directive } as any;

    VueCapacitorHaptics.install?.(app);

    expect(directive).toHaveBeenCalledTimes(1);
    expect(directive).toHaveBeenCalledWith('haptic', expect.any(Object));
  });

  it('registers custom directive name from options', () => {
    const directive = vi.fn();
    const app = { directive } as any;

    VueCapacitorHaptics.install?.(app, { directiveName: 'buzz' });

    expect(directive).toHaveBeenCalledTimes(1);
    expect(directive).toHaveBeenCalledWith('buzz', expect.any(Object));
  });
});
