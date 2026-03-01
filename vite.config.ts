import { defineConfig } from 'vite';
import path from 'path';
import dts from 'vite-plugin-dts';
import swc from '@rollup/plugin-swc';

export default defineConfig({
  plugins: [
    dts({
      include: ['src'],
      exclude: ['**/*.test.ts', 'node_modules'],
      entryRoot: 'src',
      outDir: 'dist',
      rollupTypes: true,
    }),
    swc({
      exclude: ['**/*.css', '**/*.html'],
      swc: {
        jsc: {
          parser: {
            syntax: 'typescript',
            dynamicImport: true,
          },
          target: 'es2020',
          minify: {
            mangle: true,
            keep_classnames: true,
            keep_fnames: true,
            sourceMap: true,
          },
        },
      },
    }),
  ],
  build: {
    lib: {
      entry: {
        index: path.resolve(__dirname, 'src/index.ts'),
      },
      name: 'VueCapacitorHaptics',
      formats: ['es'],
    },
    target: 'ES2020',
    rollupOptions: {
      external: ['vue', '@capacitor/core', '@capacitor/haptics'],
      output: {
        format: 'es',
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        dir: 'dist',
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
  esbuild: false,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
