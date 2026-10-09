- [x] 1. Define all 18 color tokens and input-border as CSS variables under `:root` and `@theme` in `apps/web/src/app/globals.css`.
- [x] 2. Create `apps/web/tailwind.config.ts` mapping each color token to its corresponding `var(--...)` and configure gradient utilities.
- [x] 3. Add custom utility classes for `primary-gradient` and `accent-gradient` in `apps/web/src/app/globals.css`.
- [x] 4. Add semantic usage rule comments in `globals.css` and `tailwind.config.ts`.
- [x] 5. Update `apps/web/src/app/page.tsx` to demonstrate the new color system.
- [ ] 6. Run verification (`pnpm --filter @rwa/web typecheck`, `pnpm --filter @rwa/web build`, and `openspec validate setup-color-system`).

Integration note: restored to active while PR #6 is reconciled with current core/chatbot. Prior standalone/source checks are not combined runtime acceptance; see docs/fe-foundation-integration.md.
