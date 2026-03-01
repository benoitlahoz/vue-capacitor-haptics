# vue-capacitor-haptics

<!-- coverage-badges:start -->

![statements](https://img.shields.io/badge/statements-97.3%25-brightgreen) ![branches](https://img.shields.io/badge/branches-92.2%25-brightgreen) ![functions](https://img.shields.io/badge/functions-100.0%25-brightgreen) ![lines](https://img.shields.io/badge/lines-97.3%25-brightgreen)

<!-- coverage-badges:end -->

Vue utilities for Capacitor haptics with a production-ready default strategy:

- smart cooldown to prevent haptic spam
- Android softening for less aggressive feedback
- optional web fallback using `navigator.vibrate`
- reduced-motion support
- Vue directive, Vue plugin, and composable API

## Installation

```bash
yarn add vue-capacitor-haptics @capacitor/core @capacitor/haptics
```

## Quick start

```ts
import { createApp } from 'vue';
import App from './App.vue';
import { VueCapacitorHaptics } from 'vue-capacitor-haptics';

const app = createApp(App);
app.use(VueCapacitorHaptics);
app.mount('#app');
```

This registers the `v-haptic` directive globally.

## Plugin options

```ts
import { VueCapacitorHaptics } from 'vue-capacitor-haptics';

app.use(VueCapacitorHaptics, {
  directiveName: 'haptic',
  defaultEvent: 'pointerdown',
  defaultKind: 'tap',
  engine: {
    enabled: () => settingsStore.hapticsEnabled,
    webVibrateFallback: true,
    respectReducedMotion: true,
    globalCooldownMs: 70,
    repeatCooldownMs: 120,
    defaultThrottleMs: 70,
  },
});
```

## Directive usage

Recommended style: use directive arguments (`v-haptic:tap`, `v-haptic:cta`, etc.) for kind selection.

### Default

```vue
<ion-button v-haptic:tap>Tap</ion-button>
```

### Kind shorthand (recommended)

```vue
<ion-button v-haptic:cta>Primary CTA</ion-button>
<ion-button v-haptic:success>Success</ion-button>
<ion-button v-haptic:error>Error</ion-button>
```

### Object config

```vue
<div
  v-haptic="{
    kind: 'selection',
    event: 'pointermove',
    throttle: 120,
    enabled: true,
  }"
/>
```

### Directive argument

```vue
<ion-button v-haptic:success>Save</ion-button>
<ion-button v-haptic:click="{ kind: 'tap' }">Click event</ion-button>
```

## Composable usage

```ts
import { useHaptics } from 'vue-capacitor-haptics';

const haptics = useHaptics({
  enabled: () => settingsStore.hapticsEnabled,
  webVibrateFallback: true,
});

await haptics.trigger('selection');
await haptics.trigger('cta');
await haptics.trigger('success');
```

### Recommended for sliders: trigger on value change

```ts
import { useHaptics } from 'vue-capacitor-haptics';

const haptics = useHaptics();
const onStepChange = haptics.createOnChangeTrigger<number>({
  kind: 'selection',
  skipInitial: true,
  throttle: 120,
});

await onStepChange(activeIndex.value);
```

This is usually better than using `pointermove` directly, because haptics only fire when the step/value actually changes.

## Kind mapping

- `tap`, `toggle` -> impact light
- `cta` -> impact medium on iOS, softened to light on Android
- `selection` -> selection changed
- `success`, `warning`, `error` -> notification feedback

## Testing

```bash
yarn workspace vue-capacitor-haptics type-check
yarn workspace vue-capacitor-haptics test
yarn workspace vue-capacitor-haptics test:coverage
```

## Notes

- Native haptics require a Capacitor runtime (iOS/Android).
- On web, fallback vibration is optional and browser/device dependent.
- If `prefers-reduced-motion: reduce` is active and `respectReducedMotion` is enabled, no haptic feedback is emitted.
