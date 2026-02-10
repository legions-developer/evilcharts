# Contributing to EvilCharts

Thanks for your interest in contributing to EvilCharts! This guide will help you get started.

## Development Setup

### Prerequisites

- Node.js 20+
- Yarn 1.22.22+

### Getting Started

1. Fork and clone the repository:
```bash
git clone https://github.com/your-username/evilcharts.git
cd evilcharts
```

2. Install dependencies:
```bash
yarn install
```

3. Start the development server:
```bash
yarn dev
```

The site will be available at `http://localhost:3000`.

## Project Structure

```
evilcharts/
├── charts/              # Chart components
│   ├── bar-charts/      # Bar chart variants
│   ├── line-charts/     # Line chart variants
│   ├── area-charts/     # Area chart variants
│   ├── pie-charts/      # Pie chart variants
│   ├── radar-charts/    # Radar chart variants
│   └── utils/           # Shared utilities
├── app/                 # Next.js app directory
│   ├── (docs)/          # Documentation pages
│   └── (home)/          # Landing page
├── components/          # React components
│   ├── docs/            # Documentation components
│   └── ui/              # UI components
├── scripts/             # Build scripts
│   ├── registry-build.ts      # Builds component registry
│   ├── registry-components.ts # Component definitions
│   └── sync-registry.ts       # Syncs new components
└── public/chart/        # Generated registry files
```

## Adding a New Chart

### 1. Create the Chart Component

Add your chart to the appropriate directory:

```bash
# Example: Adding a new bar chart
charts/bar-charts/my-new-chart.tsx
```

Chart component structure:
```tsx
"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartData = [
  { month: "January", value: 186 },
  // ... more data
];

const chartConfig = {
  value: {
    label: "Value",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function MyNewChart() {
  return (
    <ChartContainer config={chartConfig}>
      <BarChart data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="value" fill="var(--color-value)" />
      </BarChart>
    </ChartContainer>
  );
}
```

### 2. Sync the Registry

Run the sync script to automatically add your component to the registry:

```bash
yarn gen-cli
```

This will:
1. Detect new chart files
2. Add them to `scripts/registry-components.ts`
3. Generate JSON files in `public/chart/`

### 3. Create Documentation Page

Add a documentation page in `app/(docs)/docs/[chart-type]/`:

```tsx
// app/(docs)/docs/bar-charts/my-new-chart/page.tsx
import { MyNewChart } from "@/charts/bar-charts/my-new-chart";

export default function Page() {
  return (
    <div className="page">
      <h1>My New Chart</h1>
      <MyNewChart />
    </div>
  );
}
```

## Chart Guidelines

### Design Principles

- **Plug and Play**: Charts should work with minimal configuration
- **Customizable**: Support theming via CSS variables
- **Responsive**: Work on all screen sizes
- **Accessible**: Include proper ARIA labels and keyboard navigation
- **Animated**: Use smooth transitions where appropriate

### Naming Conventions

- Use descriptive names: `gradient-bar-chart`, `glowing-line-chart`
- Follow existing patterns in each chart type directory
- Use kebab-case for file names

### Dependencies

- Use `recharts` for chart rendering
- Use `motion` for advanced animations (optional)
- Avoid adding new dependencies without discussion

## Code Style

- Follow the existing code style
- Use TypeScript for type safety
- Run linting before committing:
```bash
yarn lint
```

## Testing Your Changes

1. Test in development mode:
```bash
yarn dev
```

2. Test the production build:
```bash
yarn build
yarn start
```

3. Verify the registry generation:
```bash
yarn gen-cli
```

## Submitting Changes

1. Create a new branch:
```bash
git checkout -b feature/my-new-chart
```

2. Make your changes and commit:
```bash
git add .
git commit -m "feat: add gradient bar chart"
```

3. Push to your fork:
```bash
git push origin feature/my-new-chart
```

4. Open a pull request with:
   - Clear description of the changes
   - Screenshots or GIFs of the new chart
   - Any breaking changes or migration notes

## Commit Convention

Use conventional commits:

- `feat:` - New chart or feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `test:` - Adding tests
- `chore:` - Build process or tooling changes

## Need Help?

- Check existing charts for examples
- Open an issue for questions
- Join discussions in pull requests

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
