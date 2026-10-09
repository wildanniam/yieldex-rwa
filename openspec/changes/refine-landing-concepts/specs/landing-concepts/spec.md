## ADDED Requirements

### Requirement: LC-001 Explanatory product scenes
The benefit section SHALL visually distinguish retained backing from sold income rights, fixed offer terms, whole-position resale and AI explanation. Example data SHALL be labeled illustrative. It SHALL preserve the original expiry and old-claim semantics, canonical assistant entry, and actual deployed market link.

#### Scenario: Reading the product concepts
- **WHEN** a visitor reads the benefit cards
- **THEN** visible text SHALL explain principal retention, purchase-start term, whole-position transfer and earned claims retained by the prior holder.
- **THEN** the illustrations SHALL NOT imply guaranteed income, a live quote, a submitted transaction or an AI-controlled wallet.

### Requirement: LC-002 Progressive and responsive artwork
Artwork SHALL preserve meaningful text in HTML, remain readable at320px width, and not introduce horizontal page overflow. Decorative SVGs SHALL not add redundant screen-reader content. Motion SHALL be optional and stop under reduced-motion preference.

#### Scenario: Static or reduced-motion visit
- **WHEN** motion is unavailable or reduced
- **THEN** scenes and real navigation links SHALL remain understandable without relying on movement or a canvas.

### Requirement: LC-003 Interactive lifecycle explanation
The flow SHALL offer three manually selected stages: backing and offer, upfront purchase with term activation, and separate income claims. Backing SHALL remain visually in the vault. Illustrative allocations SHALL NOT appear as automatic payments. Stage controls SHALL support keyboard activation without autoplay.

#### Scenario: Visiting each lifecycle stage
- **WHEN** the visitor selects a stage, including rapid or reverse selection
- **THEN** the scene and explanation SHALL agree on the selected stage and retain the same backing.

### Requirement: LC-004 Exact illustrative split
The simulator SHALL reuse the existing BigInt calculation for income values 200, 100 and zero, with share controls from 10 to 90 percent. It SHALL show buyer and retained seller allocations, the unchanged 90 DemoUSD upfront cost, and buyer net gain, loss or break-even. Values SHALL be labeled hypothetical equivalents, not forecasts or token claims.

#### Scenario: Zero income
- **WHEN** the visitor chooses zero income at any available share
- **THEN** both allocations SHALL be zero, the visual income ring SHALL be empty, and buyer net result SHALL be minus 90 and minus 100 percent.

### Requirement: LC-005 Demo assets and risk boundaries
The asset collection SHALL use deployed manifest symbols and explorer addresses, distinguish DemoUSD purchase payment from allocated income in the backing token, and state the lack of real-world backing. Risk disclosures SHALL preserve no-refund, no-guarantee, constrained-finalizer and delayed-release boundaries. The closing invitation SHALL use the existing demo route.

#### Scenario: Selecting an asset
- **WHEN** a visitor selects any deployed demo asset via pointer or keyboard
- **THEN** the illustration, symbol, income-token explanation and contract link SHALL correspond to that same asset.

#### Scenario: Inspecting risks without JavaScript
- **WHEN** a visitor opens a native risk disclosure
- **THEN** the full risk explanation SHALL be readable, including finalizer trust and the inability to automatically claw back completed payouts.
