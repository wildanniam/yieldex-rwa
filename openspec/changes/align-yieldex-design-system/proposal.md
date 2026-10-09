## Why
Shared components from the FE foundation differ from the provided Figma: unlayered gradients suppress hover states, primary labels and icon geometry differ, and form state/adornment behavior is incomplete. The team needs one inspectable reference while integrating independently.

## What Changes
- Correct the existing color, button, form and icon capability deltas against Figma.
- Add a component catalog using the real shared components with labeled visual specimens and native interactions.
- Preserve APIs and source asset provenance; document incomplete broader Figma scope.

## Impact
Affected capabilities: color-system, button-component-rewrite, form-controls, custom-iconography, component-catalog. No financial or backend interface changes. Existing active FE capability specs carry the corresponding corrections; they are not archived as complete product integration.
