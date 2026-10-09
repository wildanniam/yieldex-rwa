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
