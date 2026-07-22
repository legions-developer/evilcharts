# Tailwind CSS Configuration

## CSS-First Configuration (v4.1+)

Use the `@theme` directive for CSS-based configuration:

```css
/* src/styles.css */
@import "tailwindcss";

@theme {
  /* Custom colors */
  --color-brand-50: #f0f9ff;
  --color-brand-500: #3b82f6;
  --color-brand-900: #1e3a8a;

  /* Custom fonts */
  --font-display: "Inter", system-ui, sans-serif;
  --font-mono: "Fira Code", monospace;

  /* Custom spacing */
  --spacing-128: 32rem;

  /* Custom animations */
  --animate-fade-in: fadeIn 0.5s ease-in-out;

  /* Custom breakpoints */
  --breakpoint-3xl: 1920px;
}

/* Define custom animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Custom utilities */
@utility content-auto {
  content-visibility: auto;
}
```

---

## Vite Integration (v4.1+)

```javascript
// vite.config.ts
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
})
```

---

## Advanced v4.1 Features

### Native CSS Custom Properties

```html
<div class="bg-[var(--color-brand-500)] text-[var(--color-white)]">
  Using CSS custom properties directly
</div>
```

### Enhanced Arbitrary Values

```html
<!-- Complex grid with custom tracks -->
<div class="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
  Responsive grid without custom CSS
</div>

<!-- Custom animation timing -->
<div class="animate-bounce ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]">
  Bounce with custom easing
</div>
```

### Custom Utilities

```css
@utility content-auto {
  content-visibility: auto;
}

@utility text-shadow {
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
```

---

## Plugins

In v4, load plugins from CSS with the `@plugin` directive — no JS config, no `require()`:

```css
@import "tailwindcss";

@plugin "@tailwindcss/forms";
@plugin "@tailwindcss/typography";
```

### Custom Utilities & Components (no plugin needed)

Most things that required a JS plugin in v3 are now plain CSS. Use `@utility` for utilities and a `@layer components` block for component classes:

```css
/* Custom utility — works with variants like hover:/md: */
@utility content-auto {
  content-visibility: auto;
}

/* Component class */
@layer components {
  .btn {
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    font-weight: 600;
  }
}
```

---

## Sharing Config Across Projects

v4 has no JS `presets` array. Share design tokens by importing a common CSS file that defines your `@theme`:

```css
/* brand-theme.css */
@theme {
  --color-brand: #3b82f6;
  --color-brand-light: #60a5fa;
  --color-brand-dark: #1d4ed8;
}
```

```css
/* app entry — src/styles.css */
@import "tailwindcss";
@import "./brand-theme.css";

@plugin "@tailwindcss/forms";
@plugin "@tailwindcss/typography";
```
