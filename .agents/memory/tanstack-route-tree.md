---
name: TanStack route-tree generation
description: The TanStack Start/Vite route plugin regenerates the file-based route tree and emits its own type assertions.
---

The Arownd Start/Vite plugin regenerates `src/routeTree.gen.ts` during development and production builds. Its generated output includes `as any` assertions, even though app-authored TypeScript files do not use `any`.

**Why:** Manual edits to the generated route tree were overwritten by subsequent route generation.

**How to apply:** Treat `routeTree.gen.ts` as generated output and do not hand-edit it. If a zero-`any` rule must include generated files, use a supported generator customization or deliberate post-generation step and verify regeneration still works.
