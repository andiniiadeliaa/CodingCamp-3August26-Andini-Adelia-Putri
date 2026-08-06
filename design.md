# Design Documentation — Expense & Budget Visualizer

## Table of Contents

1. [Design Concept](#1-design-concept)
2. [UI Layout Structure](#2-ui-layout-structure)
3. [Color Palette](#3-color-palette)
4. [Typography](#4-typography)
5. [Components Used](#5-components-used)
6. [Responsive Design](#6-responsive-design)
7. [Design Decisions](#7-design-decisions)

---

## 1. Design Concept

The design follows a **clean, card-based visual language** built around a
purple accent colour. The goal is to feel modern and trustworthy without being
heavy or complex — a tool you glance at quickly, not one you study.

Three principles guide every design choice:

**Clarity first.** The most important information (total spent) is the
largest element on the page. Everything else is subordinate to it.

**Immediate feedback.** Every user action — typing, submitting, deleting —
produces a visible, instant response. There are no loading states and no
ambiguity about whether something worked.

**Calm, not cluttered.** Whitespace, consistent spacing, and a restrained
colour palette keep the interface from feeling noisy even when the transaction
list is long.

---

## 2. UI Layout Structure

The page is organised into four vertical sections inside a centred container
with a maximum width of `960px`:

```
┌────────────────────────────────────────────────────┐
│                    app-header                      │
│             💰 Expense Tracker  (h1)               │
│          "Track your daily spending"               │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│                   balance-card                     │
│                TOTAL SPENT  (label)                │
│                   Rp 0  (h2)                       │
└────────────────────────────────────────────────────┘

┌─────────────────────┬──────────────────────────────┐
│                     │     Transaction History      │
│  Add Transaction    │  ─────────────────────────  │
│  ───────────────    │  item · badge · amount · 🗑️ │
│  Item Name field    │  item · badge · amount · 🗑️ │
│  Amount field       │  item · badge · amount · 🗑️ │
│  Category select    ├──────────────────────────────┤
│  [+ Add] button     │   Spending by Category       │
│                     │      (pie chart)             │
│                     │      [legend]                │
└─────────────────────┴──────────────────────────────┘

┌────────────────────────────────────────────────────┐
│                    app-footer                      │
│            © 2026 Expense Tracker                  │
└────────────────────────────────────────────────────┘
```

### Section Roles

| Section | CSS Class | Purpose |
|---|---|---|
| Header | `.app-header` | App name and subtitle, centred |
| Balance card | `.balance-card` | Gradient card showing the running total |
| Main grid | `.main-grid` | Two-column CSS Grid containing left and right columns |
| Left column | `.left-column` | Contains the Add Transaction form card |
| Right column | `.right-column` | Contains the Transaction History card and the Chart card |
| Footer | `.app-footer` | Copyright line, centred, muted |

---

## 3. Color Palette

All colours are defined as CSS custom properties in `:root` inside `style.css`.
This means the entire colour scheme can be changed from a single location.

### Base Colors

| Role | CSS Variable | Hex | Description |
|---|---|---|---|
| Page background | `--color-bg` | `#f0f2f5` | Light blue-grey; used behind all cards and as transaction row backgrounds |
| Card surface | `--color-surface` | `#ffffff` | Pure white; all card backgrounds |
| Body text | `--color-text` | `#1e1e2e` | Near-black with a cool undertone; all primary text |
| Muted text | `--color-text-muted` | `#6b7280` | Medium grey; subtitle, labels, footer, empty states |
| Border | `--color-border` | `#e5e7eb` | Light grey; input borders, card title divider, scrollbar thumb |

### Accent Colors

| Role | CSS Variable | Hex | Description |
|---|---|---|---|
| Primary | `--color-primary` | `#6c63ff` | Purple; header h1, buttons, input focus ring, gradient start |
| Primary hover | `--color-primary-hover` | `#574fd6` | Darker purple; button hover state |
| Balance gradient end | — | `#9333ea` | Deep purple; right side of balance card gradient |
| Danger | `--color-danger` | `#ef4444` | Red; validation error borders, messages, delete hover text |
| Danger hover | `--color-danger-hover` | `#dc2626` | Darker red; reserved for danger interactions |

### Category Colors

These colours are used consistently in both the category badges and the
pie chart slices, creating a direct visual link between the two.

| Category | CSS Variable | Hex | Color |
|---|---|---|---|
| Food | `--color-food` | `#f97316` | Orange |
| Transport | `--color-transport` | `#3b82f6` | Blue |
| Fun | `--color-fun` | `#a855f7` | Purple |

---

## 4. Typography

The font stack is `'Segoe UI', system-ui, -apple-system, sans-serif`.
No external fonts are loaded — the app uses the native system font on every
platform, which keeps load time fast and text rendering sharp.

### Type Scale

| Element | Size | Weight | Color | Notes |
|---|---|---|---|---|
| App heading `h1` | `2rem` | 700 | `--color-primary` | Shrinks to `1.6rem` on mobile |
| Subtitle | `0.95rem` | 400 | `--color-text-muted` | Below the heading |
| Balance amount | `2.4rem` | 700 | `#ffffff` | Shrinks to `2rem` on mobile |
| Balance label | `0.9rem` | 400 | `#ffffff` at 85% opacity | Uppercase, `1px` letter-spacing |
| Card title | `1.05rem` | 600 | `--color-text` | Separated from content by a bottom border |
| Form label | `0.875rem` | 500 | `--color-text` | Sits above its input |
| Input / select text | `0.95rem` | 400 | `--color-text` | Placeholder text is muted |
| Submit button | `1rem` | 600 | `#ffffff` | — |
| Transaction name | `0.9rem` | 600 | `--color-text` | Truncated with ellipsis if too long |
| Transaction amount | `0.9rem` | 700 | `--color-text` | `white-space: nowrap` prevents wrapping |
| Category badge | `0.7rem` | 600 | `#ffffff` | Uppercase, `0.5px` letter-spacing |
| Validation error | `0.78rem` | 400 | `--color-danger` | Sits below the field; always occupies `min-height: 1em` |
| Empty state | `0.875rem` | 400 | `--color-text-muted` | Centred within its card |
| Footer | `0.8rem` | 400 | `--color-text-muted` | Centred |

**Line height:** `1.6` on the `body` element — slightly generous to improve
readability at small font sizes on mobile.

---

## 5. Components Used

### Balance Card (`.balance-card`)

A full-width, gradient-background card placed above the main grid.

- Background: `linear-gradient(135deg, #6c63ff, #9333ea)`
- Box shadow: `0 4px 20px rgba(108, 99, 255, 0.35)` — coloured shadow that
  matches the card, giving it a soft glow.
- Border radius: `12px`
- Text is centred and white; the label is uppercase with `1px` letter-spacing
  to create visual separation from the large amount below.

### Card (`.card`)

Reusable white surface component that wraps the form, the transaction list,
and the chart.

- Background: `#ffffff`
- Border radius: `12px`
- Padding: `24px`
- Shadow: `0 2px 12px rgba(0, 0, 0, 0.07)` — subtle, not competitive with the
  balance card.
- Card title uses a `1px` bottom border (`--color-border`) as a visual divider.

### Input Form

Three stacked `.form-group` blocks, each containing a label, a field, and an
error message span.

- Fields have a `1.5px` border that transitions to `--color-primary` on focus
  with a `3px` purple glow ring via `box-shadow`.
- Invalid fields show a red border and a `3px` red glow ring.
- The `min-height: 1em` on `.error-msg` prevents the card height from
  changing when errors appear or disappear (no layout shift).

### Submit Button (`.btn-add`)

- Full width, `12px` vertical padding, `6px` border radius.
- `background-color` transitions between `--color-primary` and
  `--color-primary-hover` on hover (`0.2s ease`).
- Scales to `98%` on `:active` for a subtle press effect.

### Transaction List (`.transaction-list`)

An unstyled `<ul>` rendered as a flex column with `10px` gap between items.

- `max-height: 340px` with `overflow-y: auto` keeps it from pushing the page
  taller than the form beside it.
- Custom scrollbar (Webkit): `5px` wide, transparent track, rounded grey thumb.
- Each `<li>` uses flexbox: `.transaction-info` (name + badge) on the left,
  `.transaction-right` (amount + delete button) on the right.
- New items animate in via `@keyframes fadeIn` (opacity `0→1`, vertical
  translate `−6px→0`, duration `0.25s ease`).

### Category Badge (`.badge`)

A pill-shaped `<span>` (`border-radius: 99px`) with coloured background,
white text, uppercase lettering, and `0.5px` letter-spacing. Three variants:
`.badge-food`, `.badge-transport`, `.badge-fun`.

### Delete Button (`.btn-delete`)

A ghost button — no border, no background by default — so it does not distract
from the transaction data. On hover it reveals `--color-danger` text and a
`rgba(239, 68, 68, 0.08)` background tint to signal the destructive action.
Each button carries an `aria-label` identifying the transaction it deletes.

### Pie Chart

A Chart.js `pie` chart rendered on a `<canvas id="spending-chart">` element.

- Wrapped in `.chart-wrapper` with `max-width: 260px` centred via
  `margin: 0 auto` to keep it proportional on wide screens.
- `responsive: true` and `maintainAspectRatio: true` let Chart.js resize
  the canvas proportionally within its wrapper.
- Legend positioned at the bottom; `14px` square swatches, `16px` padding
  between items.
- Tooltips show the category name and the Rupiah-formatted amount.
- The chart instance is stored in `spendingChart` and updated in-place
  (`.update()`) rather than destroyed and recreated, so Chart.js handles
  the transition animation automatically.

### Empty State (`.empty-state`)

A centred, muted paragraph used in two places — inside the transaction list
card and inside the chart card. Toggled via `style.display` in JavaScript.
Preserves the card's minimum height when no data is present.

---

## 6. Responsive Design

### Breakpoint

One breakpoint controls the entire layout shift:

```css
@media (max-width: 640px)
```

### Behaviour at Each Size

| Property | Desktop (> 640 px) | Mobile (≤ 640 px) |
|---|---|---|
| `.main-grid` columns | `1fr 1fr` (two columns) | `1fr` (single column) |
| Column order | Form left · List + Chart right | Form → List → Chart (top to bottom) |
| `.balance-amount` font size | `2.4rem` | `2rem` |
| `.app-header h1` font size | `2rem` | `1.6rem` |

### Mobile Viewport Meta Tag

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

This tag ensures mobile browsers render at the device's native pixel width
and do not apply a default zoom-out. Without it, the layout would appear tiny
on phones regardless of the CSS breakpoint.

### Fluid Elements

- `.app-container` uses `padding: 24px 16px` — `16px` side padding on mobile
  so content never touches the screen edge.
- The submit button is `width: 100%` and naturally spans the full card width
  at any column size.
- All inputs are `width: 100%` inside their `.form-group` containers.
- The chart `max-width: 260px` prevents oversizing on desktop while still
  filling a narrow mobile column naturally.

---

## 7. Design Decisions

### Why a gradient on the balance card?

The balance is the single most important piece of information in the app.
A gradient card with a coloured drop shadow creates visual weight that draws
the eye there first, without needing a border, icon, or extra decoration.
The `135deg` angle is a common convention for upward motion in financial UI.

### Why CSS custom properties for all colours?

Centralising every colour in `:root` variables means the full palette can be
changed in one block of CSS. It also makes the relationship between components
explicit — the category badge colours and the chart slice colours share the
same variable names, guaranteeing they always match without repeating hex codes.

### Why reserve `min-height` on error messages?

Without `min-height: 1em` on `.error-msg`, the form card would grow taller
when an error appears and shrink when it disappears. That layout shift is
jarring during fast, repeated interaction. Reserving the space upfront makes
the form feel stable and predictable.

### Why update the chart in-place instead of recreating it?

Calling `spendingChart.update()` tells Chart.js to animate from the previous
data state to the new one. Destroying and recreating the chart on every change
would produce a visual flash and lose the animated transition. Storing the
instance in a module-level variable (`let spendingChart = null`) is the
minimal pattern required to achieve smooth updates.

### Why `escapeHtml()` instead of `textContent`?

In `createTransactionItem`, the transaction name is embedded inside a template
literal string assigned to `innerHTML`. Using `innerHTML` is convenient for
building complex nested markup, but it means any `<`, `>`, `"`, or `&`
in a user's input would be parsed as HTML rather than displayed as text.
The `escapeHtml()` utility converts those characters to HTML entities before
injection, making the template literal approach safe without switching to a
more verbose `createElement` / `textContent` chain for every element.

### Why a flat single-file JavaScript structure?

The application intentionally avoids ES modules. Browsers block
`type="module"` scripts when a page is opened as a local `file://` URL,
which would break the zero-setup requirement. A single flat script loaded
at the bottom of `<body>` runs in any browser by simply opening
`index.html` directly — no local server, no bundler, no configuration needed.

### Why `fadeIn` only on new items, not on delete?

Adding a transaction is a positive, creative action that benefits from a
welcoming entrance animation. Deleting an item needs to feel immediate and
decisive — a fade-out animation would introduce a delay and create uncertainty
about whether the deletion was actually processed. Instant removal communicates
finality clearly.
