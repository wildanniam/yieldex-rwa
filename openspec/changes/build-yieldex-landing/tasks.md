## 1. Build
- [x] 1.1 Inspect reference sections and lock implementation scope in DESIGN.md.
- [x] 1.2 Build landing sections and local source assets using shared primitives.
- [x] 1.3 Implement illustration, scenario math, motion and mobile navigation.
- [x] 1.4 Preserve workspace routes and canonical assistant entry.

## 2. Verify
- [x] 2.1 Test arithmetic boundaries, zero income and illustrative content semantics.
- [ ] 2.2 Verify desktop/tablet/mobile, keyboard, reduced motion, assets and no-JS fallback.
- [x] 2.3 Verify chat failure/recovery plus adjacent lab/catalog routes, console and requests.
- [x] 2.4 Run full checks on final revision and record actual evidence in PR.

Verification note: desktop/tablet/mobile, keyboard, assets and SSR fallbacks passed locally. OS-level reduced-motion and JavaScript-disabled browser emulation remain untested; their guards/fallbacks were inspected in source and server markup. Keep 2.2 open until that browser pass. The implementation is available for visual review; this does not claim deployment or full product acceptance.
