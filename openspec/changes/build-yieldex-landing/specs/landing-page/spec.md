## ADDED Requirements

### Requirement: LP-001 Complete landing and routing
The root SHALL present navigation, hero, product illustration, features, process, scenario math, demo assets, risks, CTA and footer with functioning destinations. Existing workspace content SHALL remain available at `/workspace`, and lab/catalog URLs SHALL remain unchanged.

#### Scenario: Entering the demo
- **WHEN** a visitor selects Explore demo
- **THEN** `/lab` opens with its existing configuration and wallet semantics, without a landing-page transaction or new authentication flow.

### Requirement: LP-002 Honest interactive illustrations
Preview state SHALL be labeled illustrative and SHALL NOT be treated as a live listing or receipt. The preview SHALL preserve principal ownership, purchase-started term, fixed price, in-kind income and whole-position resale semantics.

#### Scenario: Advancing the preview
- **WHEN** a visitor advances from listing to purchase to dividend
- **THEN** the explanatory cards change without backend writes, wallet requests or a fabricated onchain success state.

### Requirement: LP-003 Deterministic scenario math
The calculator SHALL use integer cents and basis points, label values as hypothetical DemoUSD-equivalent values, distinguish actual in-kind payouts, and disclose omitted fees. No zero-income scenario SHALL imply a refund or guaranteed yield.

#### Scenario: Income is zero
- **WHEN** the zero scenario is selected at any allowed share
- **THEN** buyer value is zero and the illustrative loss is the entire fixed price, 90 DemoUSD.

### Requirement: LP-004 Accessible motion and controls
Navigation and examples SHALL support keyboard use, visible focus, mobile layouts at least 320px wide, and reduced motion. Static content and core links SHALL remain readable without JavaScript. The mobile menu SHALL close on Escape/navigation and restore focus on Escape.

#### Scenario: Reduced motion
- **WHEN** reduced motion is enabled
- **THEN** tilt, transform choreography and spring movement are disabled while content and controls remain usable.

### Requirement: LP-005 Canonical assistant access
Landing AI actions SHALL use the same assistant session flow as the existing launcher, prevent duplicate admission while pending, surface failure with a retryable action, and keep manual demo navigation available.

#### Scenario: Assistant is unavailable
- **WHEN** session admission fails
- **THEN** the visitor sees the existing unavailable message and can retry or open the manual demo without an automatic transaction.
