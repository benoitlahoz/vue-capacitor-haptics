import type { App, Plugin } from 'vue';
import { createHapticDirective, type HapticDirectiveConfig } from './directive';

export interface HapticsPluginOptions extends HapticDirectiveConfig {
  directiveName?: string;
}

export type HapticsVuePlugin = Plugin & {
  install: (app: App, options?: HapticsPluginOptions) => void;
};

export const VueCapacitorHaptics: HapticsVuePlugin = {
  install(app: App, options: HapticsPluginOptions = {}) {
    const { directiveName = 'haptic', ...directiveOptions } = options;
    const directive = createHapticDirective(directiveOptions);
    app.directive(directiveName, directive);
  },
};
