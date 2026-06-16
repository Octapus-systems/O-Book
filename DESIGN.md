---
name: Luminous Enterprise
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0edec'
  surface-container-high: '#ebe7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#484556'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#797588'
  outline-variant: '#c9c4d9'
  surface-tint: '#5d36ef'
  primary: '#5427e6'
  on-primary: '#ffffff'
  primary-container: '#6d4aff'
  on-primary-container: '#f4eeff'
  inverse-primary: '#c9bfff'
  secondary: '#613ed3'
  on-secondary: '#ffffff'
  secondary-container: '#7b5aed'
  on-secondary-container: '#fffbff'
  tertiary: '#5f44a1'
  on-tertiary: '#ffffff'
  tertiary-container: '#785dbc'
  on-tertiary-container: '#f6eeff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5deff'
  primary-fixed-dim: '#c9bfff'
  on-primary-fixed: '#1b0063'
  on-primary-fixed-variant: '#4500d8'
  secondary-fixed: '#e7deff'
  secondary-fixed-dim: '#ccbeff'
  on-secondary-fixed: '#1e0060'
  on-secondary-fixed-variant: '#4c20bd'
  tertiary-fixed: '#e9ddff'
  tertiary-fixed-dim: '#d0bcff'
  on-tertiary-fixed: '#23005c'
  on-tertiary-fixed-variant: '#503491'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-padding: 32px
  gutter: 24px
  section-gap: 48px
  element-gap: 16px
---

## Brand & Style
The design system embodies "Luxury Fintech"—a blend of high-end enterprise reliability and cutting-edge visual depth. The target audience includes CFOs, treasury managers, and financial analysts who require clarity without sacrificing modern aesthetics. 

The visual style is a refined **Glassmorphism**, characterized by soft, translucent layers that create a sense of physical stacking. It utilizes a "Luminous Depth" approach, where light seems to emanate from primary action points and background blurs. This evokes an emotional response of prestige, precision, and futuristic capability. High whitespace ratios and a sophisticated purple-tinted palette ensure the interface feels premium and uncluttered.

## Colors
The palette is built on a foundation of "Hyper-Violet" tones. The primary color is a deep, authoritative purple used for core actions and brand presence. Secondary and accent tones are utilized for gradients and "glow" effects behind glass surfaces.

**Functional Colors:**
- **Success:** #10B981 (Emerald) for positive cash flow and growth indicators.
- **Warning:** #F59E0B (Amber) for pending approvals or threshold alerts.
- **Danger:** #EF4444 (Rose) for deficits or critical errors.

**Surfaces:**
The primary surface is a frosted glass (65% opacity white) with a `backdrop-filter: blur(20px)`. This is paired with a faint, primary-tinted border to maintain edge definition against the soft background.

## Typography
This design system utilizes **Geist** for its technical precision and elegant, minimal kerning. The typographic hierarchy relies on significant weight contrast to guide the eye through dense financial data. 

Headlines use semi-bold weights with slight negative letter-spacing to appear "tight" and professional. For data-heavy tables, use `body-md` to maintain high information density while preserving legibility. Numbers in financial dashboards should ideally use tabular figures (mono-spaced numbers) if available in the Geist font family to ensure columns of currency align perfectly.

## Layout & Spacing
The layout follows a **Fluid Grid** model with generous margins to reinforce the premium feel. The dashboard utilizes a persistent sidebar on the left and a floating header.

- **Desktop (1440px+):** 12-column grid, 32px margins, 24px gutters.
- **Tablet (768px - 1439px):** 8-column grid, 24px margins, 16px gutters.
- **Mobile (<767px):** 4-column grid, 16px margins, 12px gutters.

Spacing follows a 4px base unit. Component internal padding should lean towards the larger side (e.g., 24px for card interiors) to ensure the "glass" elements have room to breathe and the background blurs are visible.

## Elevation & Depth
Depth is achieved through **Tonal Layering** and **Backdrop Blurs** rather than traditional heavy shadows.

1.  **Level 0 (Base):** The solid background (#F8F6FF) with subtle gradient blobs of #D8C8FF in the corners.
2.  **Level 1 (Cards/Widgets):** Frosted glass surfaces with a 1px border of `rgba(109, 74, 255, 0.15)`.
3.  **Level 2 (Popovers/Modals):** High-opacity white (90%) with an ambient primary-tinted shadow: `0 20px 40px rgba(109, 74, 255, 0.1)`.

Use "Squircle" masking (continuous curvature) for all elevated containers to soften the technical nature of the enterprise data.

## Shapes
The shape language is defined by "The Squircle"—a superellipse-inspired corner that feels more organic than a standard radius. 

- **Cards/Main Containers:** Use `rounded-xl` (1.5rem / 24px).
- **Buttons/Inputs:** Use `rounded-lg` (1rem / 16px).
- **Status Badges:** Fully rounded (pill-shaped) to distinguish them from interactive buttons.

## Components

### Buttons
Primary buttons use a solid #6D4AFF fill with white text. On hover, apply a subtle glow using a box-shadow of the same color with 40% opacity. Secondary buttons should be "ghost" style with the primary-tinted border.

### Floating Widgets
Cards should appear to float. This is achieved by using the glass surface and a 1px white top-border to simulate a "rim light" hitting the edge of the glass.

### Elegant Charts
Charts should use the Primary, Secondary, and Accent colors. Line charts should use a 3px stroke width with a soft gradient area fill underneath (Primary to transparent). Grid lines in charts must be extremely subtle (`rgba(0,0,0,0.05)`).

### Status Badges
Badges are pill-shaped and use a low-opacity background of their functional color (Success/Warning/Danger) with a high-contrast text label. Add a 4px blur glow of the same color behind the text for a "lit" effect.

### Frosted Navigation
The sidebar should be a semi-transparent blur that spans the full height of the viewport. Active states in the navigation are indicated by a solid primary-colored vertical "pill" on the leading edge and a subtle #D8C8FF background tint.