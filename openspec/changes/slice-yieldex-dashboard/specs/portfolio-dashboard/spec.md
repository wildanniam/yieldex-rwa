## ADDED Requirements

### Requirement: DASH-001 Honest dashboard presentation
The dashboard SHALL present portfolio metrics, positions, listings, backing and claims with explicit example-data disclosure until a canonical data adapter is connected. Unknown data SHALL NOT be rendered as zero. Simulated assets SHALL NOT be described as real stocks or guaranteed income.

#### Scenario: Example overview
- **WHEN** the UI example is selected
- **THEN** the page SHALL label balances and activity as illustrative and SHALL NOT claim a connected account or real transaction success.

#### Scenario: Empty or unavailable portfolio
- **WHEN** empty state is selected
- **THEN** counts and claims SHALL be zero and activity SHALL be empty.
- **WHEN** loading or error state is selected
- **THEN** totals SHALL be unknown and retry SHALL explicitly apply to the UI preview.

### Requirement: DASH-002 Accessible responsive interactions
The dashboard SHALL reuse local design-system controls, support keyboard tab and menu navigation, and remain usable on desktop and narrow mobile screens.

#### Scenario: Portfolio tabs
- **WHEN** a user changes tabs with pointer or keyboard
- **THEN** the selected tab and corresponding panel SHALL agree and focus SHALL remain usable.

#### Scenario: Financial action in slice
- **WHEN** a user selects a claim or listing action on example data
- **THEN** an explanation SHALL state that no transaction is sent and offer navigation to the functional lab rather than simulating financial success.

#### Scenario: Assistant entry
- **WHEN** a user opens AI from the dashboard
- **THEN** the existing assistant SHALL handle admission and errors without creating a second runtime or injecting fictional holdings.


### Requirement: DASH-003 Persistent application background
Application pages SHALL share the user-supplied decorative background through the persistent platform layout. The background SHALL remain fixed to the viewport, preserve the source aspect ratio, ignore pointer events and have no accessible text. Content SHALL retain readable contrast. The dashboard sidebar SHALL allow the shared artwork to remain visible.

#### Scenario: Navigation and scroll
- **WHEN** the user scrolls the dashboard or navigates to another route within the platform group
- **THEN** the same background layer SHALL remain present while page content changes.

#### Scenario: Future product pages
- **WHEN** a product page is added below app/(platform)
- **THEN** it SHALL inherit the background without adding a second image layer or changing its public URL.
