---
name: Form Creator
description: Full-stack form builder — dynamic forms, response collection, and assignment-mode grading
colors:
  background: "#ffffff"
  foreground: "#020817"
  primary: "#2563eb"
  primary-foreground: "#f8fafc"
  secondary: "#f1f5f9"
  secondary-foreground: "#020817"
  muted-foreground: "#64748b"
  destructive: "#ef4444"
  destructive-foreground: "#f8fafc"
  border: "#e2e8f0"
  chart-1: "#e76e50"
  chart-2: "#2a9d90"
  chart-3: "#274754"
  chart-4: "#e8c468"
  chart-5: "#f4a462"
typography:
  display:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 6vw, 4.5rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "normal"
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "normal"
rounded:
  sm: "6px"
  md: "8px"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  card:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "24px"
---

# Design System: Form Creator

## 1. Overview

**Current state: unstyled defaults, no established creative point of view.**

This is the out-of-the-box shadcn/ui ("New York" style) token set layered on Tailwind CSS, with no customization beyond what the scaffolding generator produced. The primary color is Tailwind's stock `blue-600`; the neutral ramp is stock `slate`; the type scale is a single Inter weight stack; the radius is the shadcn default 8px. Nothing here was chosen for this product — it's the blank canvas every shadcn project starts from.

The landing page (`src/app/page.tsx`) diverges further into unrelated decorative territory: a blue-to-purple gradient background, gradient-clipped hero text, emoji as UI iconography, hover-scale bounce transforms, and hype copy ("Actually Convert", "Trusted by 10,000+ users worldwide"). This is not a considered brand layer on top of the shadcn baseline — it's disconnected from it, and from the rest of the product's dashboard/form-builder screens, which never received the same treatment.

This file exists to record that starting point precisely, ahead of the institutional/authoritative redesign committed to in `PRODUCT.md`. **Every color, weight, and shadow named below is a candidate for replacement, not a system to preserve.** Re-run `/impeccable document` once the redesign lands to capture the real, intentional system in its place.

**Key Characteristics:**
- Default shadcn/ui "New York" tokens (HSL CSS custom properties on `:root` / `.dark`), unmodified
- Single typeface (Inter) at default Tailwind weights, no display/body pairing
- Flat baseline elevation (`shadow-sm` on cards) with Tailwind default `shadow-lg` / `shadow-2xl` for overlays
- One unrelated decorative excursion (the landing page gradient hero) not reflected anywhere else in the product

## 2. Colors

Stock shadcn/ui "New York" palette: one saturated blue accent, a slate neutral ramp, no secondary or tertiary role — `secondary`, `muted`, and `accent` all resolve to the identical slate value in the current tokens.

### Primary
- **Tailwind Blue 600** (`#2563eb`): the only accent color in the system. Used for primary buttons, links, focus rings, and the default badge — undifferentiated from any other blue-accented SaaS scaffold. Runs counter to PRODUCT.md's "near-monochrome, restrained accent" anti-reference.

### Neutral
- **Pure White** (`#ffffff`): page and card background.
- **Near-Black Slate** (`#020817`): body text and headings.
- **Slate 100** (`#f1f5f9`): shared value for `secondary`, `muted`, and `accent` surfaces (subtle panel fills, tab backgrounds, hover states) — the three roles are not currently differentiated.
- **Slate 500** (`#64748b`): muted/secondary text (card descriptions, helper copy).
- **Slate 200** (`#e2e8f0`): borders and input strokes throughout.

### Semantic
- **Red 500** (`#ef4444`): destructive actions (delete buttons, destructive badges, error states).

### Data Visualization
- Five chart colors used in `recharts` analytics views: `#e76e50` (burnt orange), `#2a9d90` (teal), `#274754` (dark slate-blue), `#e8c468` (gold), `#f4a462` (sandy orange) — a warm, unrelated qualitative palette that doesn't draw from the same blue/slate system used everywhere else.

### Named Rules
**The Undifferentiated Neutral Rule.** `secondary`, `muted`, and `accent` currently share one literal value (`#f1f5f9`). Nothing today distinguishes "this is a muted background" from "this is a secondary surface" from "this is an accent fill" — they're interchangeable by accident, not by design.

## 3. Typography

**Display Font:** Inter (via `next/font/google`, automatic system fallback)
**Body Font:** Inter (same family, no pairing)

**Character:** A single geometric-humanist sans at default weights — functional, unremarkable, carries no deliberate personality. No contrast axis (no serif/sans or mono pairing) anywhere in the product.

### Hierarchy
- **Display** (700, `text-6xl md:text-7xl` ≈ 60–72px, tight leading): landing-page hero only. Paired with gradient-clip fill (see Don'ts).
- **Title** (600, `text-2xl` / 24px, `leading-none tracking-tight`): card titles across dashboard, form builder, and modals.
- **Body** (400, `text-sm` / 14px, 1.5 line-height): default paragraph and description text everywhere, including card descriptions and form field labels.
- **Label** (600, `text-xs` / 12px): badges and small status indicators.

### Named Rules
**The One-Weight Rule (current state).** Every text role uses the same Inter family; hierarchy is carried entirely by size and weight step, never by a second typeface. Flag for the redesign: PRODUCT.md's institutional register may call for a second, more structural typeface for display/label roles to separate "official document" text from body copy.

## 4. Elevation

Mostly flat, with Tailwind's default shadow scale applied inconsistently by component: cards sit nearly flush with the page (`shadow-sm`), while Radix-driven overlays (dialogs, selects) jump straight to a noticeably heavier `shadow-lg`, and the large response-detail modal jumps further still to `shadow-2xl`. There's no intermediate step and no stated rationale for which components get which tier.

### Shadow Vocabulary
- **Resting** (`box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05)`): default card shadow — barely perceptible.
- **Overlay** (`box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)`): dialog and select dropdown content.
- **Modal (large)** (`box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25)`): the large response-detail modal variant only.

### Named Rules
**The Missing-Middle Rule (current state).** There is a resting shadow and an overlay shadow with nothing between them — no hover/lifted state exists on cards or buttons outside the landing page's `hover:-translate-y-2` bounce (itself a Don't). Any redesign should define a deliberate 3–4 step elevation scale rather than jumping from flat to heavy.

## 5. Components

### Buttons
- **Shape:** 8px radius (`rounded-md`), tightening to match `--radius` token.
- **Primary:** solid Blue 600 fill, white text, `h-10 px-4 py-2` default sizing; four size steps (`sm` / `default` / `lg` / `icon`).
- **Hover / Focus:** primary darkens via opacity (`hover:bg-primary/90`); focus shows a 2px ring in the primary hue offset from the button.
- **Secondary / Outline / Ghost / Link:** secondary is flat slate-100; outline is a bordered transparent button; ghost has no border or fill until hover; link renders as underlined primary-colored text. Six variants total, standard shadcn set, no product-specific variant exists.

### Badges
- **Style:** fully rounded (`rounded-full`), `text-xs font-semibold`, four variants (default/secondary/destructive/outline) mapping directly to the button color roles.

### Cards
- **Corner Style:** 8px radius.
- **Background:** flat white, 1px slate-200 border, resting shadow only.
- **Internal Padding:** 24px (header and content), header and content stacked with a 6px title/description gap.
- **Shadow Strategy:** see Elevation — resting tier only; no hover-lift state defined.

### Inputs / Fields
- **Style:** 1px slate-200 border, white background, 8px height unit (`h-10`), 6px effective radius.
- **Focus:** 2px ring in the primary hue with 2px offset — same focus treatment as buttons, consistently applied.
- **Disabled:** 50% opacity, cursor changes to not-allowed.

### Navigation
- White background, `shadow-sm`, single bottom border, fixed 64px height. Text links are plain gray-600, darkening to gray-900 on hover with no underline or background change — a lighter-weight treatment than the buttons and cards elsewhere, and not tied to the same token set (raw Tailwind gray, not the `muted-foreground` token).

### Dialogs / Modals
- Centered fixed-position panel, 8px radius, 1px border, overlay shadow tier, 200ms `cubic-bezier(0.16, 1, 0.3, 1)` fade + scale-from-0.96 entrance via Radix data-state hooks. A larger `.modal-content-large` variant (max-width 56rem, scrollable) exists for the response-detail view and jumps to the heavier shadow-2xl tier without an explicit reason.

## 6. Do's and Don'ts

Per PRODUCT.md's anti-references, the following patterns from the current landing page are explicitly slated for removal — repeated here verbatim so this spec enforces the strategic line:

### Do:
- **Do** treat this file as a "before" snapshot — regenerate it once the institutional redesign is implemented, capturing real, intentional tokens in place of these defaults.
- **Do** keep the existing focus-ring and disabled-state conventions (2px ring, offset 2px, 50% opacity disabled) — these are accessible defaults worth carrying forward regardless of the visual redesign.
- **Do** differentiate `secondary`, `muted`, and `accent` into three distinct values if the redesign keeps a shadcn-token structure — they're accidentally identical today, not deliberately unified.

### Don't:
- **Don't** carry forward the landing page's gradient background (`from-blue-50 via-indigo-50 to-purple-50`) or gradient-clipped hero text (`bg-gradient-to-r ... bg-clip-text text-transparent`) — explicitly named anti-references in PRODUCT.md.
- **Don't** keep emoji as UI iconography (the feature-card icons on the landing page use raw emoji glyphs like 🏗️) — replace with the same icon system (`lucide-react`) already used everywhere else in the product.
- **Don't** keep hover-scale bounce transforms (`hover:scale-105`, `hover:-translate-y-2`) — PRODUCT.md calls for restraint and rejects decorative motion that doesn't serve legibility or trust.
- **Don't** keep hype marketing copy ("Actually Convert", "Trusted by 10,000+ users worldwide", "Setup in 2 minutes") — the institutional register communicates confidence through structure and clarity, not SaaS enthusiasm.
- **Don't** default the whole product to Tailwind Blue 600 as the single differentiator between "branded" and "unbranded" elements — PRODUCT.md calls for near-monochrome with at most one restrained accent, and this stock blue reads as generic rather than deliberate.
- **Don't** ship dark mode as the default (a `.dark` variant exists in tokens but nothing in the codebase switches it on) — PRODUCT.md explicitly calls for a light-first, paper-like baseline.
