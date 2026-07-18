# Impeccable Design System Guidelines

This document outlines the core UI/UX philosophies adopted by this project, heavily inspired by Paul Bakaus's [Impeccable](https://github.com/pbakaus/impeccable). 

As UI/UX Engineers, our goal is to produce software that looks and feels premium, intentionally avoiding the "AI-generated" or overly generic SaaS aesthetic.

## Core Philosophies

### 1. Typography Over Color
- Do **not** rely on color to establish hierarchy.
- Use font weights, sizes, and tracking to guide the user's eye.
- Avoid overused system fonts (like Arial or default Sans-serif). Opt for premium Google Fonts like Inter, Roboto, or Outfit where appropriate, but ensure they are used with distinct, tight typography.

### 2. Strip Redundancy
- **No unnecessary icons**: Do not place an icon next to every single menu item or button. Only use icons when they provide immediate, intuitive cognitive shortcuts.
- **No nested cards**: Avoid placing cards inside of cards inside of boxes. Let white space and padding define boundaries.

### 3. Purposeful Contrast
- **Never use pure black (`#000`) or pure gray.** Always tint your grays with your brand color. For example, if your brand is yellow/blue, your grays should have a subtle warm or cool undertone.
- **Avoid gray text on colored backgrounds.** If you have a solid colored background, use semi-transparent white/black for text, not a hardcoded gray hex.

### 4. Meaningful Motion
- Avoid "bouncy" or elastic easing curves, which feel dated.
- Use snappy, purposeful micro-interactions (e.g., a rapid `.15s ease-out` on hover states).

## How to Audit
If you have Impeccable installed in your AI harness, you can run the following commands to check your work:
- `/impeccable critique`: Run a full UX design review on a component.
- `/impeccable polish`: Perform a final cleanup to strip out remaining "AI slop" like side-tab borders and purple gradients.
- `/impeccable distill`: Strip complexity from the UI.
