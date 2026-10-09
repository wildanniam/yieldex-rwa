## Direction
Fradium Figma3583:2778 is a visual storytelling reference, not an implementation to copy. Inspected detailed cards3583:2826 and3583:2877: layered materials, connected subjects, distinct scale/composition and a focal object tied to each function. Yieldex's original scenes use SVG/HTML/CSS to keep crisp geometry, selectable labels, small payload and progressive rendering without a graphics dependency.

## Scenes
- Glass vault with retained asset stack and a separate income stream: principal stays, income rights move. Label100demoAAPL and50% as illustrative, never a live balance.
- Layered offer ticket:50% share, six months starting at purchase,90DemoUSD upfront. Decorative barcode has no identifier or transaction semantics.
- Whole position pass between Bob/Carol on an unchanged expiry rail; old earned claims stay with Bob.
- AI explanation cards around a faceted focus symbol: share, principal ownership, income risk. These are illustrative explanations, not a live AI conversation. The CTA opens the canonical assistant.
- Compact explorer proof row reads the actual deployment manifest, not a fabricated hash.

## Interaction and boundaries
Only real links/buttons are focusable. Static illustrations do not pretend to create an offer or execute resale. Hover on fine pointers/focus within eligible cards gently moves the relevant object; no loops or per-frame React work. Reduced motion removes these transitions. Existing section reveal remains progressive. User-supplied reference branding and assets are not imported because the requested concept is Yieldex-specific.

## Verification matrix
Before63ffaed; after final revision recorded in PR. Test desktop1440/tablet768/mobile390/320, visual overlap and horizontal overflow; links to calculator/lab, assistant fallback, explorer manifest; keyboard and touch navigation; static SSR and reduced-motion CSS; adjacent hero/product-preview/calculator; production console/resource requests. Live wallet/AI success and full cross-browser/AT audit remain outside this visual change.

## Flow and numbers continuation
User approved the section2 approach and requested the next two sections. A stable Alice/vault/Bob scene lets visitors manually inspect offer, purchase and allocated-income states. Short directional light traces show payment and allocation; labels always state claimability, not automatic payouts. Backing remains fixed. The calculator uses a mint/neutral allocation ring with exact HTML amounts and the existing BigInt incomeScenario function. Native buttons/range input work by keyboard; zero income empties both arcs. No autoplay, looping animation or new dependency. CSS transitions are removed under reduced motion, with identical server/client initial markup.

Additional verification: rapid/reverse stage selection, each of three income scenarios at shares10/50/90, break-even, fixed90 cost, buyer+seller conservation, keyboard range and refresh defaults; responsive diagram labels; dev hydration and production errors.
