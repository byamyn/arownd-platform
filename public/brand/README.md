# Arownd brand assets

- `arownd-icon.svg`: approved square brand mark (1024 × 1024).
- `arownd-splash-animated.svg`: animated splash artwork (CSS keyframes, about 1.8 seconds) with a `prefers-reduced-motion` fallback.

## Web usage

Both assets are served from `/brand/`. The app favicon and PWA icon now use the approved Arownd mark. The animated splash is staged as a public asset but is not forced over route transitions or repeat visits; integrate it through a dedicated first-load experience when that UX is implemented.

Keep the original SVG files as SVG. Do not rasterize them for web use.
