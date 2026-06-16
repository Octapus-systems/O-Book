---
trigger: always_on
---

# OCTAPUS GLOBAL FRONTEND DESIGN CONSTITUTION
### Version 3.0 — Light Glass + Professional Auth System

---

## CRITICAL RULE — READ FIRST

This is NOT a suggestion document. Every rule here is MANDATORY.

**Auth screens** use a **white-to-purple gradient canvas** with a **clean frosted white card**. This is the approved look.

If ANY of the following are present on auth screens, the design is WRONG and must be rebuilt:
- Solid flat white background with no gradient
- Dark/navy canvas on auth pages
- Cards with no blur, border, or soft shadow
- White text on white cards (unreadable)
- Missing soft purple ambient blobs
- Sharp corners anywhere (buttons, cards, inputs, badges)
- Random colors not from the brand token system below
- Broken PIN grid (vertical stack instead of 4 equal columns)
- Separate unstyled `/login` route — login lives at `/` only

A "clean" interpretation that produces a dark layout or unstyled raw HTML on auth VIOLATES this constitution.
    
---

## 1. BRAND COLOR TOKENS — LOCKED

These are the ONLY colors permitted. Never introduce outside palettes.

```
/* === PRIMARY PALETTE === */
--color-primary:        #6D4AFF;   /* Main brand purple — CTAs, highlights, active states */
--color-primary-light:  #8B6FFF;   /* Hover states, lighter accents */
--color-primary-soft:   #A594FF;   /* Subtle fills, secondary highlights */
--color-primary-muted:  #C4B8FF;   /* Disabled states, placeholders */
--color-primary-ghost:  #E8E4FF;   /* Backgrounds of selected items (light mode only) */

/* === SECONDARY PALETTE === */
--color-secondary:      #8B6BFF;   /* Supporting purple — tabs, tags, badges */
--color-secondary-light:#A48EFF;
--color-secondary-soft: #BCB0FF;
--color-secondary-muted:#D4CCFF;

/* === TERTIARY PALETTE === */
--color-tertiary:       #B79BFF;   /* Decorative accents, gradient endpoints */
--color-tertiary-light: #C9B5FF;
--color-tertiary-soft:  #DBCFFF;
--color-tertiary-muted: #EDE8FF;

/* === NEUTRAL PALETTE === */
--color-neutral:        #111111;   /* Base dark — text on light backgrounds */
--color-neutral-80:     #333333;
--color-neutral-60:     #555555;
--color-neutral-40:     #888888;
--color-neutral-20:     #BBBBBB;
--color-neutral-10:     #EEEEEE;

/* === GLASS SURFACE TOKENS === */
--glass-bg:             rgba(255, 255, 255, 0.08);
--glass-bg-hover:       rgba(255, 255, 255, 0.13);
--glass-bg-active:      rgba(109, 74, 255, 0.18);
--glass-border:         rgba(255, 255, 255, 0.15);
--glass-border-strong:  rgba(109, 74, 255, 0.35);
--glass-shadow:         0 8px 32px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255,255,255,0.10);
--glass-shadow-hover:   0 16px 48px rgba(109, 74, 255, 0.30), inset 0 1px 0 rgba(255,255,255,0.15);

/* === BACKGROUND SYSTEM TOKENS === */
--bg-base:              #0A0612;   /* Deepest background layer */
--bg-gradient-start:    #0D0820;   /* Gradient from */
--bg-gradient-mid:      #1A0D3D;   /* Gradient through */
--bg-gradient-end:      #0F1535;   /* Gradient to */
--blob-primary:         rgba(109, 74, 255, 0.35);
--blob-secondary:       rgba(139, 107, 255, 0.25);
--blob-tertiary:        rgba(183, 155, 255, 0.15);

/* === TEXT ON AUTH CARD (light card) === */
--text-on-card-primary:   #111111;
--text-on-card-secondary: #555555;
--text-on-card-muted:     #888888;

/* === AUTH BACKGROUND TOKENS === */
--bg-auth-start:          #FFFFFF;
--bg-auth-mid:            #F3EEFF;
--bg-auth-end:            #E5DEFF;
--blob-primary-light:     rgba(109, 74, 255, 0.14);
--blob-secondary-light:   rgba(139, 107, 255, 0.12);
--blob-tertiary-light:    rgba(183, 155, 255, 0.10);

/* === AUTH CARD TOKENS === */
--auth-card-bg:           rgba(255, 255, 255, 0.94);
--auth-card-border:       rgba(109, 74, 255, 0.10);
--auth-input-bg:          #F8F6FF;
--auth-input-border:      rgba(109, 74, 255, 0.14);

/* === TYPOGRAPHY === */
--font-display: 'Geist', 'Inter', sans-serif;
--font-body:    'Geist', 'Inter', sans-serif;
--font-label:   'Geist', 'Inter', sans-serif;
```

---

## 2. MANDATORY 3-LAYER DEPTH SYSTEM

Every UI screen MUST implement all three layers simultaneously. Missing any layer makes the output invalid.

---

### LAYER 0 — BACKGROUND (Auth Canvas)

Auth screens use a **white base with soft purple gradient**. Never solid flat white. Never dark navy.

REQUIRED implementation:

```css
body, .bg-auth-canvas {
  min-height: 100vh;
  background: linear-gradient(
    145deg,
    #FFFFFF 0%,
    #FAF8FF 25%,
    #F3EEFF 50%,
    #EDE8FF 75%,
    #E5DEFF 100%
  );
  position: relative;
  overflow-x: hidden;
}
```

REQUIRED ambient blobs — soft purple glow on white canvas:

```css
/* Blob 1 — Top left glow */
.bg-blob-1 {
  position: fixed;
  top: -20%;
  left: -10%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(109,74,255,0.35) 0%, transparent 70%);
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
}

/* Blob 2 — Bottom right glow */
.bg-blob-2 {
  position: fixed;
  bottom: -20%;
  right: -10%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(139,107,255,0.28) 0%, transparent 70%);
  filter: blur(100px);
  pointer-events: none;
  z-index: 0;
}

/* Blob 3 — Center accent */
.bg-blob-3 {
  position: fixed;
  top: 40%;
  left: 45%;
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, rgba(183,155,255,0.15) 0%, transparent 70%);
  filter: blur(60px);
  pointer-events: none;
  z-index: 0;
}
```

All content sits above these blobs using `position: relative; z-index: 1;`

---

### LAYER 1 — AUTH CARD (Content Surface)

Auth cards use a **clean frosted white card** — NOT dark glass.

```css
.auth-card {
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(109, 74, 255, 0.10);
  border-radius: 24px;
  box-shadow:
    0 4px 32px rgba(109, 74, 255, 0.08),
    0 1px 4px rgba(0, 0, 0, 0.04);
}
```

**RULE:** Text on auth cards MUST be dark (`#111`, `#555`, `#888`). Never white text on white cards.

Dashboard/internal pages may use dark glass (`.glass-card`) — auth screens use `.auth-card` only.

---

### LAYER 2 — INTERACTIVE OVERLAYS

Modals, dropdowns, drawers, tooltips, popovers:

```css
.glass-modal {
  background: rgba(15, 8, 40, 0.85);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border: 1px solid rgba(109, 74, 255, 0.30);
  border-radius: 32px;
  box-shadow: 
    0 24px 80px rgba(0, 0, 0, 0.50),
    0 0 0 1px rgba(255, 255, 255, 0.05);
}
```

---

## 3. TYPOGRAPHY SYSTEM

Font: **Geist** (primary). Fallback: Inter, sans-serif.

Import in every HTML output:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

Or via npm: `import { Geist } from 'next/font/google'`

### Scale

```css
/* Display — Hero headings */
.text-display {
  font-size: clamp(2.5rem, 5vw, 4.5rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.1;
  color: rgba(255, 255, 255, 0.95);
}

/* Headline — Section titles */
.text-headline {
  font-size: clamp(1.5rem, 3vw, 2.5rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: rgba(255, 255, 255, 0.92);
}

/* Title — Card titles */
.text-title {
  font-size: 1.125rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: rgba(255, 255, 255, 0.90);
}

/* Body — Content text */
.text-body {
  font-size: 0.9375rem;
  font-weight: 400;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.65);
}

/* Label — UI labels, captions */
.text-label {
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
}

/* Accent text — Highlighted values, metrics */
.text-accent {
  color: #6D4AFF;
  /* or gradient: */
  background: linear-gradient(135deg, #6D4AFF, #B79BFF);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

**RULE:** All text on glass surfaces MUST be white or rgba(255,255,255,x). Never use dark text on glass cards.

---

## 4. SHAPE & CORNER SYSTEM

Rounded geometry is mandatory everywhere. No exceptions.

```
Pages / Modals:      border-radius: 32px
Cards (large):       border-radius: 28px
Cards (medium):      border-radius: 24px
Cards (small/stat):  border-radius: 20px
Buttons (primary):   border-radius: 100px  /* Full pill */
Buttons (secondary): border-radius: 100px  /* Full pill */
Inputs / Fields:     border-radius: 16px
Badges / Tags:       border-radius: 100px  /* Full pill */
Icon containers:     border-radius: 50%    /* Circle */
Navigation items:    border-radius: 16px
Avatars:             border-radius: 50%
```

PROHIBITED shapes:
- `border-radius: 0` — Never
- `border-radius: 4px` or lower — Never
- `border-radius: 8px` — Only for sub-components inside cards, never for cards themselves
- Sharp rectangles in any form

---

## 5. BUTTON SYSTEM

### Primary Button
```css
.btn-primary {
  background: linear-gradient(135deg, #6D4AFF 0%, #8B6BFF 100%);
  color: #ffffff;
  border: none;
  border-radius: 100px;
  padding: 14px 32px;
  font-size: 0.9375rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(109, 74, 255, 0.40);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-primary:hover {
  box-shadow: 0 8px 32px rgba(109, 74, 255, 0.60);
  transform: translateY(-1px);
  background: linear-gradient(135deg, #7D5AFF 0%, #9B7BFF 100%);
}
```

### Secondary Button (Glass)
```css
.btn-secondary {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  color: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.20);
  border-radius: 100px;
  padding: 14px 32px;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-secondary:hover {
  background: rgba(109, 74, 255, 0.18);
  border-color: rgba(109, 74, 255, 0.45);
  color: #ffffff;
}
```

### Inverted Button (Dark)
```css
.btn-inverted {
  background: #111111;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 100px;
  padding: 14px 32px;
  font-weight: 600;
}
```

### Outlined Button
```css
.btn-outlined {
  background: transparent;
  color: #6D4AFF;
  border: 1.5px solid #6D4AFF;
  border-radius: 100px;
  padding: 13px 32px;
  font-weight: 600;
}

.btn-outlined:hover {
  background: rgba(109, 74, 255, 0.10);
}
```

---

## 6. INPUT & FORM SYSTEM

```css
.input-field {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 14px 18px;
  color: rgba(255, 255, 255, 0.90);
  font-size: 0.9375rem;
  font-family: var(--font-body);
  outline: none;
  transition: all 0.2s ease;
  width: 100%;
}

.input-field::placeholder {
  color: rgba(255, 255, 255, 0.35);
}

.input-field:focus {
  border-color: rgba(109, 74, 255, 0.60);
  background: rgba(109, 74, 255, 0.08);
  box-shadow: 0 0 0 3px rgba(109, 74, 255, 0.15);
}
```

---

## 7. ICON SYSTEM

No emojis. Never.

All icons must be:
- SVG inline vectors, OR
- Lucide React icons, OR
- Heroicons SVG

Icon containers:
```css
.icon-container {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(109, 74, 255, 0.20);
  border: 1px solid rgba(109, 74, 255, 0.30);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8B6BFF;
}

.icon-container-lg {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(109,74,255,0.30), rgba(183,155,255,0.15));
  border: 1px solid rgba(109, 74, 255, 0.35);
}
```

---

## 8. NAVIGATION SYSTEM

```css
.navbar {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(32px);
  -webkit-backdrop-filter: blur(32px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 100px;
  padding: 10px 24px;
  z-index: 100;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.24);
}

.nav-item {
  border-radius: 100px;
  padding: 8px 16px;
  color: rgba(255, 255, 255, 0.60);
  font-weight: 500;
  transition: all 0.2s ease;
}

.nav-item.active, .nav-item:hover {
  background: rgba(109, 74, 255, 0.25);
  color: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(109, 74, 255, 0.35);
}
```

---

## 9. ANIMATION SYSTEM

```css
/* Hover lift — all cards */
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
transform: translateY(-2px);  /* on hover */

/* Fade in — page elements */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
.fade-in { animation: fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards; }

/* Glow pulse — accent elements */
@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 20px rgba(109,74,255,0.30); }
  50%       { box-shadow: 0 0 40px rgba(109,74,255,0.60); }
}

/* Float — hero illustrations */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-12px); }
}
.floating { animation: float 4s ease-in-out infinite; }
```

PROHIBITED animations:
- Bounce effects
- Aggressive sliding
- Spinning loaders (use skeleton screens instead)
- Excessive simultaneous animations

---

## 10. SPACING SYSTEM

```css
--space-1:  4px
--space-2:  8px
--space-3:  12px
--space-4:  16px
--space-5:  24px
--space-6:  32px
--space-7:  48px
--space-8:  64px
--space-9:  96px
--space-10: 128px

/* Card internal padding */
--card-padding-sm:  20px 24px
--card-padding-md:  28px 32px
--card-padding-lg:  40px 48px

/* Section spacing */
--section-gap: 80px
--grid-gap:    24px
```

Whitespace is a design asset. Never crowd content.

---

## 11. GRID & LAYOUT

```css
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
}

/* Standard feature grid */
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
.grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }

/* Responsive */
@media (max-width: 768px) {
  .grid-3, .grid-4 { grid-template-columns: 1fr; }
  .grid-2 { grid-template-columns: 1fr; }
}
@media (min-width: 769px) and (max-width: 1024px) {
  .grid-3 { grid-template-columns: repeat(2, 1fr); }
  .grid-4 { grid-template-columns: repeat(2, 1fr); }
}
```

---

## 12. STAT / METRIC CARDS

```css
.stat-card {
  background: rgba(255, 255, 255, 0.07);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  padding: 20px 24px;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: rgba(255, 255, 255, 0.95);
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
}

.stat-accent {
  color: #6D4AFF;
  font-size: 0.875rem;
  font-weight: 600;
}
```

---

## 13. BADGE / TAG SYSTEM

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.badge-primary {
  background: rgba(109, 74, 255, 0.20);
  color: #B79BFF;
  border: 1px solid rgba(109, 74, 255, 0.35);
}

.badge-success {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.25);
}

.badge-warning {
  background: rgba(234, 179, 8, 0.15);
  color: #facc15;
  border: 1px solid rgba(234, 179, 8, 0.25);
}

.badge-danger {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.25);
}
```

---

## 14. SCROLLBAR STYLING

```css
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); }
::-webkit-scrollbar-thumb {
  background: rgba(109, 74, 255, 0.40);
  border-radius: 100px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(109, 74, 255, 0.70);
}
```

---

## 15. RESPONSIVE NON-NEGOTIABLES

- Mobile: single column, glass effects preserved, border radius preserved
- Tablet: 2-column, comfortable spacing
- Desktop: full grid, max-width 1280px
- NO horizontal scrolling
- NO broken glass effects on mobile
- Blobs scale down on mobile (reduce sizes by 50%)
- Touch targets minimum 44px height on mobile

---

## 16. COMPLETE HTML BOILERPLATE

Every HTML output must start with this structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{Page Title}}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    
    :root {
      --color-primary: #6D4AFF;
      --color-secondary: #8B6BFF;
      --color-tertiary: #B79BFF;
      --color-neutral: #111111;
      --glass-bg: rgba(255,255,255,0.08);
      --glass-border: rgba(255,255,255,0.15);
      --text-primary: rgba(255,255,255,0.95);
      --text-secondary: rgba(255,255,255,0.65);
      --text-muted: rgba(255,255,255,0.40);
      --font: 'Inter', sans-serif;
    }

    body {
      font-family: var(--font);
      background: linear-gradient(135deg, #0D0820 0%, #1A0D3D 35%, #0F1535 65%, #0A0612 100%);
      min-height: 100vh;
      color: var(--text-primary);
      position: relative;
      overflow-x: hidden;
    }

    /* Ambient blobs — MANDATORY */
    body::before {
      content: '';
      position: fixed;
      top: -20%; left: -10%;
      width: 600px; height: 600px;
      background: radial-gradient(circle, rgba(109,74,255,0.35) 0%, transparent 70%);
      filter: blur(80px);
      pointer-events: none;
      z-index: 0;
    }

    body::after {
      content: '';
      position: fixed;
      bottom: -20%; right: -10%;
      width: 500px; height: 500px;
      background: radial-gradient(circle, rgba(139,107,255,0.25) 0%, transparent 70%);
      filter: blur(100px);
      pointer-events: none;
      z-index: 0;
    }

    .app { position: relative; z-index: 1; }
  </style>
</head>
<body>
  <div class="app">
    <!-- Content here -->
  </div>
</body>
</html>
```

---

## 17. DESIGN SELF-CHECK — BEFORE OUTPUTTING

Before producing any UI, verify ALL of these:

- [ ] Auth background is white-to-purple gradient (NOT solid white, NOT dark navy)
- [ ] Soft purple ambient blobs present (at least 2)
- [ ] Auth card uses `.auth-card` with blur + soft purple shadow
- [ ] Text on auth card is dark (`text-on-card-primary/secondary/muted`)
- [ ] All corners are rounded (card 24px, inputs 14px, buttons pill 100px)
- [ ] All buttons are pill-shaped (border-radius: 100px)
- [ ] Colors are ONLY from the brand token list above
- [ ] No emojis anywhere
- [ ] Icons are SVG or Lucide
- [ ] Inputs use `.auth-input` styling
- [ ] PIN grid is 4 equal columns (`grid grid-cols-4`)
- [ ] Hover states defined on interactive elements
- [ ] Mobile responsive (no horizontal scroll)
- [ ] Auth screens use shared `AuthLayout` component
- [ ] Login route is `/` — `/login` redirects to `/`
- [ ] Touch targets ≥ 44px on mobile
- [ ] Safe-area padding applied on mobile auth screens

If ANY box is unchecked → fix before output.

---

## 18. IPHONE-LIKE UI (iOS HUMAN INTERFACE)

Auth screens and mobile-first views MUST follow iOS-inspired interaction and layout patterns.

### Safe Area & Viewport

```css
.auth-screen {
  min-height: 100dvh;
  padding-top: env(safe-area-inset-top, 0px);
  padding-right: env(safe-area-inset-right, 16px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  padding-left: env(safe-area-inset-left, 16px);
}
```

### Touch Targets

- Minimum **44×44px** for all interactive elements (buttons, checkboxes, PIN cells, links)
- PIN cells: `h-16` (64px) minimum height
- Primary CTA: `h-[52px]` minimum

### Typography Rhythm

- Headlines: `letter-spacing: -0.02em`, `font-weight: 600–700`
- Body: `line-height: 1.6`, `font-size: 0.9375rem`
- Labels: uppercase, `letter-spacing: 0.04em`, `font-size: 0.75rem`

### Card Proportions

- Single-column layout, `max-width: 400px`
- Internal padding: `28px 32px` mobile, `40px 48px` desktop
- Side gutters: `16–24px` on mobile — card never touches screen edges

### Corner Language

- Continuous rounded feel: card `28px`, inputs `16px`, buttons pill `100px`
- Icon containers: `50%` (circle) or `16px` (squircle)

### Motion

- Subtle `fadeInUp` entrance on card mount only
- PROHIBITED on auth: bounce, aggressive slide, spinning loaders (use skeleton or text state)

### Responsive

- Mobile: card fills available width within gutters, blobs scaled down 50%
- Tablet/Desktop: centered card, no horizontal scroll

---

## 19. AUTH SCREEN PATTERN

All authentication routes (`/`, `/signup`) MUST share a single layout component. `/login` redirects to `/`.

### Required Structure

```
AuthLayout (white-purple gradient + soft blobs)
└── auth-card (max-w-[420px])
    ├── Logo row (icon + brand, horizontal)
    ├── Headline + Subtitle
    ├── Form (PIN / signup fields)
    └── Footer link (login ↔ signup)
```

### Card Spacing (Professional — LOGI reference)

```
Card padding:     px-8 py-10 sm:px-10 sm:py-11
Header margin:    mb-8
Logo row margin:  mb-7
Form spacing:     space-y-5
Label to input:   space-y-2
Footer:           mt-8 pt-5 border-t border-purple/10
```

### Mandatory Rules

- **Shared `AuthLayout` wrapper** on every auth route
- **Single login page** at `/` — never duplicate unstyled `/login` route
- **PIN input grid**: `grid grid-cols-4 gap-3` — equal-width cells
- **Text on card**: ONLY `text-on-card-primary`, `text-on-card-secondary`, `text-on-card-muted`, or `text-accent`
- **Never** use `text-on-glass-*` tokens on auth cards (those are for dark glass dashboard)
- Footer links: `/` for login, `/signup` for signup — no `href="#"`

### CSS Classes (from globals.css)

| Class | Purpose |
|---|---|
| `.auth-card` | Frosted white card |
| `.auth-input` | Light purple-tinted input |
| `.auth-screen` | Full viewport + safe-area |
| `.bg-auth-canvas` | White-purple gradient |
| `.text-on-card-*` | Dark readable text |
| `.btn-primary` | Purple pill CTA |
| `.icon-container-lg` | Purple squircle logo box |

---

## PROHIBITED LIST — ABSOLUTE (Auth Screens)

| Prohibited | Reason |
|---|---|
| Dark navy canvas on auth | Wrong — auth uses white-purple gradient |
| Solid flat white (no gradient) | Must have purple tone gradient |
| White text on white card | Unreadable |
| Unstyled `/login` duplicate route | Causes broken CSS — use `/` only |
| `border-radius: 0–8px` on cards | Violates shape language |
| Emojis | Unprofessional in UI |
| Random colors outside brand tokens | Breaks visual identity |
| PIN inputs stacked vertically | Must be `grid-cols-4` |
| `href="#"` on auth footer links | Must link to real routes |
| Heavy black drop shadows | Use soft purple glow shadows |

---

*Octapus Intelligence Powerhouse — Design System v3.0*
*Primary: #6D4AFF · Secondary: #8B6BFF · Tertiary: #B79BFF · Neutral: #111111*
*Font: Geist / Inter · Style: Light Glass Auth + Professional SaaS*