- [x] 1. Completely overwrite `components/ui/button.tsx` with the approved API, exported `buttonVariants`, four variants, three sizes, native button props, and no legacy effect props.
- [x] 2. Wire the implementation to `@/components/ui/icon` and preserve the workspace's web-local/root re-export boundary without duplicating the icon system.
- [x] 3. Implement exact hierarchy, size, geometry, focus, disabled, loading, and icon class contracts from the design sheet.
- [ ] 4. Replace the existing button tests with focused coverage for the new public API, classes, loading disabled behavior, and icon props.
- [ ] 5. Run web typecheck, lint, focused tests, build, and strict OpenSpec validation; document any workspace-wide pre-existing check blockers.

Integration note: restored to active while PR #6 is reconciled with current core/chatbot. Prior standalone/source checks are not combined runtime acceptance; see docs/fe-foundation-integration.md.
