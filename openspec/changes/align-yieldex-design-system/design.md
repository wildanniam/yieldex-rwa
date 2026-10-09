## Approach
Use the provided Figma nodes as the visual source, existing shared React components as the implementation, and native controls for browser behavior. Store reviewed SVG exports and Inter locally. Keep shared financial schemas and all core/runtime logic unchanged.

The catalog at `/design-system` contains the 72 button specimens, an actual interactive button form, ten form controls, color/type reference, and all 40 icons. Forced CSS states apply only to specimens and are explicitly labeled; verification must also exercise native interactions.

## Verification
Reproduce the actual hover failure on baseline main, then test actual hover/focus/loading and form submit isolation after repair. Exercise form editing, error/disabled recovery, radio/range keyboard input, OTP paste/deletion, narrow layouts, assets, homepage and lab/chat shell regression. Run `pnpm check`. External transaction/provider behavior is outside this presentational change.

See `docs/design-system.md` for component contracts, provenance, and remaining Figma scope.
