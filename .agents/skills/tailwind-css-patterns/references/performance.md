# Tailwind CSS Performance Optimization

## Bundle Size Optimization

v4 **automatically detects** your source files — there is no `content` array and no `purge` config. The engine is always JIT and ships only the utilities you actually use.

```css
/* src/styles.css */
@import "tailwindcss";

/* Only needed for sources Tailwind can't auto-find (e.g. a published UI lib
   or a path excluded by .gitignore). Otherwise omit entirely. */
@source "../node_modules/@mycompany/ui-lib";
```

### Source Detection Best Practices

1. **Rely on auto-detection**: v4 scans the project for you — no manual globs
2. **Include external UI libraries**: Add them with `@source` only if their classes aren't being generated
3. **Exclude noise**: Use `@source not "./path"` to skip folders you don't want scanned

---

## CSS Optimization Techniques

```html
<!-- Use content-visibility for offscreen content -->
<div class="content-visibility-auto">
  <div>Heavy content that's initially offscreen</div>
</div>

<!-- Optimize images with aspect-ratio -->
<img class="aspect-video w-full object-cover" src="video.jpg" alt="Video thumbnail" />

<!-- Use contain for paint optimization -->
<div class="contain-layout">
  Complex layout that doesn't affect outside elements
</div>
```

---

## Development Performance (v4.1+)

```css
/* Enable CSS-first configuration in v4.1 */
@import "tailwindcss";

@theme {
  /* Define once, use everywhere */
  --color-brand: #3b82f6;
  --font-mono: "Fira Code", monospace;
}

/* Critical CSS for above-the-fold content */
@layer critical {
  .hero-title {
    @apply text-4xl md:text-6xl font-bold;
  }
}
```

---

## Production Build Optimization

### Unused-CSS Removal (automatic)

There is **no PurgeCSS step in v4** — unused utilities are never generated in the first place, so production output is already minimal. If a dynamically-constructed class never appears verbatim in source, make it detectable with `@source inline(...)` instead of an old `safelist`:

```css
@import "tailwindcss";

/* Force-generate classes that aren't written literally anywhere */
@source inline("bg-red-500 text-center");
```

### Minification & Vendor Prefixing (built-in)

v4 minifies production CSS and adds vendor prefixes itself — **no `cssnano` or `autoprefixer`**. Just use the official integration:

```ts
// vite.config.ts
import tailwindcss from '@tailwindcss/vite'
export default { plugins: [tailwindcss()] }
```

```js
// or postcss.config.mjs (non-Vite builds)
export default { plugins: { '@tailwindcss/postcss': {} } }
```

---

## Best Practices for Performance

1. **Trust auto-detection**: v4 is always-JIT and finds sources automatically — no `content`/`purge` config to maintain
2. **Add external sources explicitly**: Use `@source` only for files Tailwind can't discover on its own
3. **Minimize custom CSS**: Use Tailwind utilities over custom CSS
4. **Let the engine prune**: Unused utilities are never generated, so production CSS stays minimal by default
5. **Use `@layer` for custom styles**: Helps with cascade ordering and organization
6. **Avoid `@apply` in components**: Prefer composing utilities in markup
