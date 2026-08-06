# Requirements — Expense & Budget Visualizer

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Functional Requirements](#2-functional-requirements)
3. [Non-Functional Requirements](#3-non-functional-requirements)
4. [User Flow](#4-user-flow)
5. [Technology Stack](#5-technology-stack)

---

## 1. Project Overview

**Expense & Budget Visualizer** is a mobile-friendly, client-side web application
that helps users track their daily personal spending. Users can log transactions
by entering an item name, an amount in Indonesian Rupiah (Rp), and a spending
category. The app maintains a live running total, displays a scrollable
transaction history, and renders a pie chart that breaks spending down by
category. All data is persisted locally in the browser so it survives page
refreshes — no account, login, or internet connection is needed after the
initial load.

**Target users:** Individuals who want a lightweight, no-signup tool for
monitoring day-to-day expenses on any device.

**Scope:** Single-page application (SPA) that runs entirely in the browser.
No backend, no database, no build step required.

---

## 2. Functional Requirements

### FR-01 — Add a Transaction

The user can submit a new transaction through a form containing three fields:

| Field | Type | Constraints |
|---|---|---|
| Item Name | Text input | Required; must not be blank |
| Amount | Number input | Required; must be a positive number greater than 0 |
| Category | Select dropdown | Required; must choose one of: Food, Transport, Fun |

On successful submission the form resets to its empty state and the new
transaction appears immediately in the transaction list.

### FR-02 — Form Validation

All three fields are validated on submit. If any field fails validation:

- A red border and a focus shadow appear on the invalid field.
- An inline error message is displayed directly below the field.
- The form is **not** submitted until all fields are valid.

Errors clear in real time as the user corrects each field, before resubmitting.

### FR-03 — Transaction List

Every added transaction is displayed in a scrollable list. Each list entry shows:

- The item name (truncated with an ellipsis if it is too long).
- A colour-coded category badge (pill shape).
- The amount formatted as Indonesian Rupiah (e.g. `Rp 25.000`).
- A delete (🗑️) button.

The list is capped at `340px` height and scrolls independently when it overflows.

### FR-04 — Delete a Transaction

Clicking the 🗑️ button on any list entry permanently removes that transaction.
The list, the total balance, and the pie chart all update immediately after deletion.

### FR-05 — Total Balance

A prominently styled card at the top of the page displays the cumulative total
of all transaction amounts, formatted as Rupiah. It updates automatically
after every add and every delete. When all transactions are deleted it resets
to `Rp 0`.

### FR-06 — Spending Pie Chart

A pie chart visualises the proportion of total spending allocated to each
category. It updates automatically whenever the transaction list changes.
Each category slice is a distinct colour matching its category badge.
Tooltips show the exact Rupiah amount for each slice. When no transactions
exist the chart canvas is hidden and a placeholder message is shown instead.

### FR-07 — Empty States

Two empty-state messages are shown when there is no data:

- Inside the Transaction History card: *"No transactions yet. Add one above!"*
- Inside the Spending by Category card: *"Add transactions to see the chart."*

Both are hidden as soon as the first transaction is added.

### FR-08 — LocalStorage Persistence

All transactions are saved to the browser's LocalStorage under the key
`expense_tracker_transactions` every time the list changes. When the page
loads, saved data is restored automatically so no entries are lost on refresh
or browser restart.

---

## 3. Non-Functional Requirements

### NFR-01 — Performance

The application loads and runs entirely in the browser. After the Chart.js
library is fetched from the CDN on first load, no further network requests are
made during normal use. All state updates and DOM changes are synchronous and
complete within a single animation frame.

### NFR-02 — Responsiveness

The layout is fully responsive across all screen sizes:

- **Desktop (> 640 px):** Two-column grid — form on the left, transaction list
  and chart on the right.
- **Mobile (≤ 640 px):** Single-column stack — form, then list, then chart,
  each full-width.

Font sizes scale down gracefully at the mobile breakpoint.

### NFR-03 — Browser Compatibility

The application targets all modern browsers: Chrome, Firefox, Edge, and Safari.
No polyfills are required. The only external dependency (Chart.js) is loaded
from a CDN and supports the same browser set.

### NFR-04 — Security

User-supplied strings (item names) are sanitised with an `escapeHtml()` function
before they are written into the DOM. This prevents Cross-Site Scripting (XSS)
attacks regardless of what characters a user enters in the name field.

### NFR-05 — Data Reliability

LocalStorage reads are wrapped in a `try/catch` block. If saved data is
malformed or corrupted (e.g. from manual browser storage edits), the error is
logged to the console and the application starts with an empty state rather
than crashing.

### NFR-06 — Accessibility

- Every form field has an explicit `<label>` linked by `for`/`id`.
- The balance card and form sections use `aria-label` attributes.
- Each delete button carries an `aria-label` that names the specific
  transaction it will remove (e.g. `"Delete Lunch"`).
- Focus ring styles are preserved on all interactive elements.

### NFR-07 — Maintainability

The project is intentionally simple and dependency-free:

- One HTML file, one CSS file, one JavaScript file.
- All CSS colours are defined as custom properties in `:root`.
- Every JavaScript function has a single, clearly-named responsibility.
- All functions and sections are commented for beginner readability.

### NFR-08 — Zero Setup

No build tools, package managers, compilers, or servers are needed.
Opening `index.html` directly in any modern browser is sufficient to run
the full application.

---

## 4. User Flow

```
User opens index.html
        │
        ▼
  App loads saved data from LocalStorage
        │
        ├── Data found ──► Render transaction list + balance + chart
        │
        └── No data ────► Show empty-state messages
                                    │
                                    ▼
                      User fills in the Add Transaction form
                                    │
                        ┌───────────┴───────────┐
                        │                       │
                   Validation fails        Validation passes
                        │                       │
                  Show inline errors      Create transaction object
                  (form stays open)             │
                                         Append to transactions array
                                                │
                                         ┌──────┼──────┐
                                         │      │      │
                                      Render  Update  Update
                                       list  balance  chart
                                                │
                                         Save to LocalStorage
                                                │
                                          Reset form
                                                │
                                    User reviews transaction list
                                                │
                                   User clicks 🗑️ on an entry
                                                │
                                     Remove from array
                                                │
                                  ┌─────────────┼─────────────┐
                                  │             │             │
                               Render        Update        Update
                                list         balance        chart
                                                │
                                         Save to LocalStorage
```

---

## 5. Technology Stack

| Technology | Role |
|---|---|
| **HTML5** | Page structure and semantic markup |
| **CSS3** | Styling, responsive layout (CSS Grid + Flexbox), CSS variables, transitions, animations |
| **Vanilla JavaScript (ES6+)** | Application logic — state, DOM rendering, validation, chart management, LocalStorage |
| **Chart.js** (CDN) | Interactive pie chart rendered on a `<canvas>` element |
| **LocalStorage API** | Client-side data persistence across browser sessions |

### Why no framework?

The application intentionally uses only native browser APIs and one charting
library. This keeps the project:

- **Immediately runnable** — no `npm install` or build step.
- **Beginner-friendly** — the code maps 1-to-1 with what runs in the browser.
- **Lightweight** — the only external asset is Chart.js (~200 KB from CDN).
