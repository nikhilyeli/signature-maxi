# Coding Instructions & Architecture Guide

This document outlines the codebase architecture and developer rules for the Signature Maxi project.

## 1. Component Architecture
The application currently revolves around two major components:

- **`signature-maxi`**: The wrapper dashboard. It lists the current signers, provides a preview grid of captured signatures, and contains the global configuration toggles (which enable/disable tabs).
- **`signature-capture`**: The modal content where actual signature capture happens.
  - It contains an Angular Material Tab Group (`mat-tab-group`) with Draw, Type, and Upload tabs.
  - *Future Refactoring*: To maintain scalability, `signature-capture` is slated to be broken down further into `signature-draw`, `signature-type`, and `signature-upload` sub-components.

## 2. Global Services
- **`SignatureMaxiService`**: The absolute source of truth. It manages the `BehaviorSubject<Signer[]>` mapped by `contentId`. 
  - **Rule**: Never mutate signer state inside a component directly. Always call `this.service.setSigners(contentId, newSigners)`.
  - **SVG Normalization**: The service ensures all incoming signatures are normalized into valid `svg+xml` strings. It strictly enforces `xmlns` and applies watermarks cleanly via regex matching.

## 3. Styling & Dimensions
To prevent watermarks from rendering off-screen or stretching, the captured image dimensions must be strictly controlled.
- **Rule**: All drawing pads, typed SVGs, and camera preview windows MUST conform to a `450x200` bounding box.
- Do not use inline `width: 100%` on canvas elements without also hardcoding the internal canvas rendering scale, as it breaks aspect ratios.

## 4. Mobile & Hardware APIs
- **Camera Fallbacks**: When building camera functionality, do not rely solely on `getUserMedia()`. On mobile browsers (Safari iOS, Chrome Android), it is safer and more performant to trigger a native `<input type="file" capture="environment">`. The UI must abstract this difference away from the user.

## 5. UI Best Practices (Impeccable Alignment)
- Utilize standard Angular Material components, but override their generic SaaS styles (e.g., removing heavy box-shadows, applying brand tints to gray backgrounds).
- Keep HTML templates minimal. Do not clutter the DOM with nested `<div>` cards. 
- Stick to the unified brand configuration (e.g., `var(--sig-border-solid)`).
