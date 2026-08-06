# Architecture — Expense Tracker

## Table of Contents

1. [Application Architecture](#1-application-architecture)
2. [System Components](#2-system-components)
3. [Project Structure](#3-project-structure)
4. [Data Flow](#4-data-flow)
5. [Component Responsibilities](#5-component-responsibilities)
6. [Data Storage](#6-data-storage)
7. [External Dependencies](#7-external-dependencies)
8. [Architecture Decisions](#8-architecture-decisions)

---

## 1. Application Architecture

### Overall Architecture

Expense Tracker is a **client-side, single-page application (SPA)** with no
backend, no server, and no build pipeline. Every computation — state
management, validation, rendering, persistence, and charting — happens inside
the user's browser, in a single browser tab, within a single page load.

The architecture deliberately follows the **single source of truth** principle:
one JavaScript array (`transactions`) is the authoritative state of the
application. Every visible part of the UI — the balance card, the transaction
list, and the pie chart — is derived from that array. When the array changes,
all three UI regions are re-derived in full.

### Client-Side Architecture

The application is structured around three concerns that map directly to its
three files:

| Concern | File | Technology |
|---|---|---|
| Structure | `index.html` | HTML5 |
| Presentation | `css/style.css` | CSS3 |
| Behaviour & state | `js/app.js` | Vanilla JavaScript (ES6+) |

These three layers communicate in one direction only:

- **HTML** declares the structure and provides element IDs that JavaScript
  targets.
- **CSS** provides class-based style rules that JavaScript applies or removes
  (e.g. `input-error`, `badge-food`).
- **JavaScript** reads from and writes to the DOM; it never modifies HTML or
  CSS files at runtime.

There is no virtual DOM, no component tree, no state management library, and
no build step. The browser itself is the runtime and the renderer.

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser Tab                             │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      index.html                           │  │
│  │   (static structure — parsed once on page load)           │  │
│  └───────────────────────────────────────────────────────────┘  │
│               │                          │                      │
│               │ links                    │ links                │
│               ▼                          ▼                      │
│  ┌─────────────────────┐   ┌─────────────────────────────────┐  │
│  │    css/style.css    │   │          js/app.js              │  │
│  │  (presentation      │   │  ┌─────────────────────────┐    │  │
│  │   layer — static)   │   │  │  State: transactions[]  │    │  │
│  └─────────────────────┘   │  └────────────┬────────────┘    │  │
│                             │               │ drives          │  │
│                             │  ┌────────────▼────────────┐   │  │
│                             │  │     Render functions     │   │  │
│                             │  │  renderTransactions()    │   │  │
│                             │  │  updateBalance()         │   │  │
│                             │  │  updateChart()           │   │  │
│                             │  └────────────┬────────────┘    │  │
│                             │               │ writes to        │  │
│                             │  ┌────────────▼────────────┐   │  │
│                             │  │       DOM (Live UI)      │   │  │
│                             │  │  #transaction-list       │   │  │
│                             │  │  #total-balance          │   │  │
│                             │  │  #spending-chart         │   │  │
│                             │  └─────────────────────────┘   │  │
│                             └─────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────┐      ┌──────────────────────────┐    │
│  │  Chart.js (CDN)      │      │  LocalStorage API        │    │
│  │  Renders pie chart   │      │  Persists transactions[] │    │
│  │  on <canvas>         │      │  across page reloads     │    │
│  └──────────────────────┘      └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. System Components

### HTML (`index.html`)

HTML is responsible exclusively for **structure**. It declares every DOM
element that JavaScript will later query and manipulate. No logic, no
styling, and no dynamic content generation happens inside the HTML file.

Key structural elements defined in HTML:

- `<div class="app-container">` — the centred page wrapper
- `<section class="balance-card">` with `id="total-balance"` — target for
  balance updates
- `<form id="transaction-form">` — the input form with three fields
- `<ul id="transaction-list">` — the container JavaScript injects `<li>`
  elements into
- `<canvas id="spending-chart">` — the target surface Chart.js draws on
- `id="empty-state"` and `id="chart-empty-state"` — the placeholder paragraphs
  JavaScript shows or hides

The `<script src="js/app.js">` tag is placed at the very end of `<body>` so
the entire DOM is parsed and available before any JavaScript runs.

Chart.js is loaded via a `<script>` tag in `<head>` from the jsDelivr CDN,
making the `Chart` global constructor available before `app.js` executes.

### CSS (`css/style.css`)

CSS is responsible exclusively for **presentation**. It defines no logic and
holds no data. Its role in the architecture is two-fold:

1. **Static styles** — layout (CSS Grid, Flexbox), colours, typography,
   spacing, shadows, borders, and the `@keyframes fadeIn` animation. These
   apply unconditionally.

2. **State-driven styles** — rules that JavaScript activates by adding or
   removing class names. The two classes used this way are:
   - `.input-error` — applied to a field element when validation fails;
     turns its border red and shows a red glow ring.
   - `.badge-food`, `.badge-transport`, `.badge-fun` — applied to badge
     `<span>` elements at render time; each sets a different background colour.

All colours are defined as CSS custom properties in `:root`, making CSS the
single source of truth for the visual palette. JavaScript references colours
by hard-coded hex strings only inside `updateChart()`, where Chart.js requires
them as dataset properties rather than CSS classes.

### JavaScript (`js/app.js`)

JavaScript is the **entire behaviour layer** of the application. It is
responsible for:

- Holding the in-memory application state (`transactions` array and
  `spendingChart` instance)
- Reading DOM references once at startup
- Validating user input and displaying or clearing error messages
- Building transaction objects and mutating the state array
- Re-rendering all UI regions after every state change
- Communicating with Chart.js to create or update the pie chart
- Reading from and writing to LocalStorage

The file is structured as a flat collection of named functions with a short
initialisation block at the bottom. There are no classes, no modules, and no
closures beyond simple event listeners.

### Chart.js

Chart.js is a third-party JavaScript library loaded from the jsDelivr CDN. It
is responsible for **all canvas drawing operations**. The application code
never writes directly to the `<canvas>` element — it only creates a
`Chart` instance (`new Chart(ctx, config)`) and calls `.update()` on it.

The chart instance is stored in the module-level variable `spendingChart`.
On the first call to `updateChart()`, `spendingChart` is `null` and a new
`Chart` instance is created. On every subsequent call, the existing instance's
`data.labels`, `data.datasets[0].data`, and `data.datasets[0].backgroundColor`
are updated and `spendingChart.update()` is called. This lets Chart.js manage
its own animated transition from the old data state to the new one.

When all transactions are deleted, `spendingChart.destroy()` is called to
release the canvas context and free memory, and `spendingChart` is reset
to `null` so the creation path runs again if data is added later.

### LocalStorage

LocalStorage is a browser-native key-value store. The application uses it as
its **only persistence layer**. There is no database, no server, and no file
system access.

All read and write operations are encapsulated in two functions:
`saveToStorage()` and `loadFromStorage()`. The entire `transactions` array is
serialised to a single JSON string and stored under the fixed key
`'expense_tracker_transactions'`. Full details are covered in
[Section 6 — Data Storage](#6-data-storage).

---

## 3. Project Structure

```
CodingCamp-3August26-Andini-Adelia-Putri/
│
├── index.html                  ← Entry point and full DOM structure
│
├── css/
│   └── style.css               ← All presentation styles
│
├── js/
│   └── app.js                  ← All application logic and state
│
├── docs/
│   ├── requirements.md         ← Functional and non-functional requirements
│   ├── design.md               ← Visual design documentation
│   └── architecture.md         ← This file
│
└── README.md                   ← Project overview and summary documentation
```

The source code follows a strict three-file constraint: one HTML, one CSS,
one JavaScript. The `docs/` folder contains documentation only and has no
effect on how the application runs. There are no configuration files,
no package manifests, and no build outputs because no build pipeline exists.

---

## 4. Data Flow

### Narrative Description

All data in the application originates from one source: the user typing into
the form. From there it passes through validation, is transformed into a
structured object, added to the in-memory state, used to update three
independent UI regions, and finally persisted to LocalStorage. On the next
page load, the flow runs in reverse: LocalStorage → state array → all three
UI regions.

Every mutation of the `transactions` array — whether an addition or a deletion
— triggers the same four-function sequence:

```
renderTransactions()  →  updateBalance()  →  updateChart()  →  saveToStorage()
```

This means the DOM, the balance figure, the pie chart, and LocalStorage are
always in sync with the state array after every user action.

### Add Transaction Flow

```
User fills form and clicks "+ Add Transaction"
            │
            ▼
  form submit event fires
  event.preventDefault() blocks browser reload
            │
            ▼
      validateForm()
            │
   ┌────────┴────────┐
   │                 │
  FAIL              PASS
   │                 │
showError()     Build transaction object:
on each         { id, name, amount, category }
invalid               │
field                 ▼
(return)      transactions.push(newTransaction)
                      │
          ┌───────────┼───────────┬──────────────┐
          │           │           │              │
          ▼           ▼           ▼              ▼
  renderTransactions()  updateBalance()  updateChart()  saveToStorage()
          │           │           │              │
  Clear <ul>    reduce() all    Group by      JSON.stringify
  Re-build      amounts        category      → localStorage
  all <li>s     → DOM          → Chart.js      .setItem()
                                .update()
                      │
                  form.reset()
                  clearAllErrors()
```

### Delete Transaction Flow

```
User clicks 🗑️ on a transaction
            │
            ▼
  deleteTransaction(id) called
            │
            ▼
  transactions = transactions.filter(t => t.id !== id)
            │
          ┌─┴──────────────┬──────────────┬──────────────┐
          │                │              │              │
          ▼                ▼              ▼              ▼
  renderTransactions()  updateBalance()  updateChart()  saveToStorage()
```

### Page Load (Restore) Flow

```
Browser parses and executes js/app.js
            │
            ▼
    loadFromStorage()
            │
   localStorage.getItem('expense_tracker_transactions')
            │
   ┌────────┴────────┐
   │                 │
  null           JSON string found
   │                 │
  (array         JSON.parse()
  stays [])           │
                ┌─────┴─────┐
                │           │
           parse fails   Array valid
                │           │
         transactions   transactions = parsed
            = []             │
                             ▼
                   renderTransactions()
                   updateBalance()
                   updateChart()
```

---

## 5. Component Responsibilities

### `index.html` — Structure Provider

Declares the complete DOM skeleton that JavaScript queries at runtime. Its
responsibility ends at parse time. Every element that JavaScript needs to
read from or write to is identified by a unique `id` attribute. The file
also loads the two external assets the app depends on: Chart.js (in `<head>`)
and `app.js` (at the end of `<body>`).

### `css/style.css` — Presentation Layer

Owns all visual decisions: colour, spacing, typography, layout, animation,
and responsive breakpoints. Exposes two CSS class contracts to JavaScript:
`.input-error` (validation state) and the `.badge-{category}` variants
(dynamic category colouring). Everything else in the stylesheet is purely
declarative and independent of JavaScript.

### `js/app.js` — State and Behaviour Layer

Owns the entire runtime of the application. Its internal responsibilities
divide cleanly into eight areas:

| Area | Functions |
|---|---|
| State | `let transactions = []`, `let spendingChart = null` |
| DOM references | All `const` declarations at the top of the file |
| ID generation | `generateId()` |
| Formatting | `formatRupiah()` |
| Security | `escapeHtml()` |
| Validation | `validateForm()`, `showError()`, `clearError()`, `clearAllErrors()` |
| Rendering | `renderTransactions()`, `createTransactionItem()`, `updateBalance()`, `updateChart()` |
| Mutation | `deleteTransaction()` (invoked via event listeners on each `<li>`) |
| Persistence | `saveToStorage()`, `loadFromStorage()`, `STORAGE_KEY` constant |
| Initialisation | The four-line block at the bottom of the file |

### `transactions` Array — Single Source of Truth

Not a file, but the most architecturally significant entity in the project.
Every function that produces visible output reads exclusively from this array.
No UI region caches its own copy of the data. This means the UI can never
drift out of sync with the state — a full re-render after every mutation
guarantees consistency.

### `spendingChart` Variable — Chart Instance Handle

Holds the active Chart.js `Chart` object between calls to `updateChart()`.
Its `null`/not-`null` state determines the two code paths inside
`updateChart()`: create a new chart, or update the existing one in-place.

### Event Listeners — User Interaction Entry Points

Three types of event listeners connect user actions to the state:

| Event | Element | Handler |
|---|---|---|
| `submit` | `#transaction-form` | Validation → object creation → state mutation → render → save |
| `click` | Each `.btn-delete` inside a `<li>` | `deleteTransaction(id)` |
| `input` / `change` | `#item-name`, `#amount`, `#category` | Live error clearing |

Delete button listeners are attached inside `createTransactionItem()` at the
moment each `<li>` is built, with the transaction `id` captured in the closure.

---

## 6. Data Storage

### Storage Mechanism

The application uses the browser's **`localStorage` API** — a synchronous,
string-only, origin-scoped key-value store built into every modern browser.
Data in `localStorage` persists until it is explicitly removed or the user
clears their browser storage. It is not cleared by closing the tab or
restarting the browser.

### Storage Key

All data is stored under a single fixed key:

```
expense_tracker_transactions
```

This key is defined as a module-level constant in `app.js`:

```js
const STORAGE_KEY = 'expense_tracker_transactions';
```

Using a named constant (rather than an inline string literal) means the key
value is defined exactly once and referenced from both `saveToStorage()` and
`loadFromStorage()`, preventing mismatches.

### Data Format

The value stored under the key is the `transactions` array serialised as a
JSON string. Each element in the array is a plain JavaScript object with four
properties:

```json
[
  {
    "id":       "lf2k3m9abc1x",
    "name":     "Lunch",
    "amount":   35000,
    "category": "Food"
  },
  {
    "id":       "lf2k3m9xyz2y",
    "name":     "Grab",
    "amount":   18000,
    "category": "Transport"
  }
]
```

| Property | Type | Description |
|---|---|---|
| `id` | `string` | Unique identifier generated by `generateId()` using `Date.now()` and `Math.random()` |
| `name` | `string` | The item name as entered by the user (trimmed of leading/trailing whitespace) |
| `amount` | `number` | The transaction amount as a plain JavaScript number (not formatted) |
| `category` | `string` | One of `"Food"`, `"Transport"`, or `"Fun"` |

Amounts are stored as raw numbers, not as formatted Rupiah strings. Formatting
is applied at render time by `formatRupiah()`, keeping the stored data clean
and calculation-ready.

### Writing to Storage (`saveToStorage`)

```js
function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}
```

`saveToStorage()` is called at the end of every operation that mutates the
`transactions` array — both `form submit` (add) and `deleteTransaction()`
(delete). This ensures LocalStorage is always a faithful mirror of the
in-memory state immediately after every change.

### Reading from Storage (`loadFromStorage`)

```js
function loadFromStorage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        transactions = parsed;
      }
    } catch (error) {
      console.warn('Could not parse saved transactions. Starting fresh.', error);
      transactions = [];
    }
  }
}
```

`loadFromStorage()` is called once, as the very first statement in the
page-load initialisation block, before any rendering occurs. This sequence
is critical: the state array must be populated before `renderTransactions()`,
`updateBalance()`, and `updateChart()` run.

The function applies two defensive checks before accepting the data:

1. **`JSON.parse` inside `try/catch`** — protects against `SyntaxError` if
   the stored string is malformed (e.g. manually edited in DevTools).
2. **`Array.isArray(parsed)` check** — protects against valid JSON that is
   not an array (e.g. a plain object or a number), which would cause the rest
   of the app to throw on array methods.

If either check fails, `transactions` remains `[]` and the app starts with a
clean empty state rather than crashing.

### Storage Lifecycle

```
Page loads
    │
    ▼
loadFromStorage()
    │── localStorage has key ──► JSON.parse ──► transactions = parsed array
    │── no key found ──────────► transactions stays []
    │
    ▼
UI renders from transactions[]
    │
    ▼                                         ▼
User adds transaction               User deletes transaction
    │                                         │
saveToStorage()                       saveToStorage()
localStorage updated                  localStorage updated
```

---

## 7. External Dependencies

The application has exactly **one external library** and uses **three
browser-native APIs**. There are no package managers, lock files, or
transitive dependencies.

### External Library

| Library | Source | Purpose |
|---|---|---|
| **Chart.js** | `https://cdn.jsdelivr.net/npm/chart.js` (jsDelivr CDN) | Renders the interactive pie chart on the `<canvas>` element. Provides the `Chart` global constructor and all canvas drawing operations. |

Chart.js is loaded via a `<script>` tag in `<head>` and exposes a single
global: `Chart`. The application uses only the `pie` chart type, the built-in
`legend` plugin, the built-in `tooltip` plugin, and the `.update()` and
`.destroy()` instance methods.

### Browser-Native APIs

| API | Where Used | Purpose |
|---|---|---|
| **DOM API** | Throughout `app.js` | `document.getElementById()`, `document.createElement()`, `element.classList`, `element.innerHTML`, `element.textContent`, `element.style.display`, `element.dataset`, `element.addEventListener()`, `element.appendChild()` |
| **LocalStorage API** | `saveToStorage()`, `loadFromStorage()` | `localStorage.setItem()`, `localStorage.getItem()` for persistent client-side data storage |
| **Canvas API** | `updateChart()` (via Chart.js) | `canvas.getContext('2d')` — the 2D rendering context is obtained once and passed to the `Chart` constructor; all subsequent canvas operations are delegated to Chart.js |

No other libraries, frameworks, polyfills, or web APIs are used.

---

## 8. Architecture Decisions

### Why Vanilla JavaScript instead of a framework?

Frameworks like React, Vue, or Angular solve problems that arise at a
certain scale: large component trees, complex shared state, asynchronous
data fetching, team collaboration across many files, and performance
optimisation of large DOM updates.

None of those problems exist here. The application has:

- One piece of state: a flat array of plain objects.
- Three output regions: a text node, a list, and a canvas.
- Two user actions: add and delete.

For this scope, a framework adds indirection and a required build pipeline
without solving any real problem. Vanilla JavaScript keeps every operation
visible and traceable — when `renderTransactions()` is called, the entire
render path from function call to DOM node is readable in a single file with
no abstraction layers in between.

The zero-setup constraint also matters: the application must run by opening
`index.html` directly in a browser. ES modules are blocked on `file://` URLs,
and framework-based apps require a development server or a bundled build.
Vanilla JavaScript in a plain `<script>` tag is the only approach that
satisfies this constraint without exceptions.

### Why LocalStorage instead of a backend?

A backend introduces server setup, network latency, authentication, a
database schema, API endpoints, error handling for network failures, and
hosting costs — none of which are appropriate for a personal, single-user
expense tracker.

LocalStorage stores data in the browser, scoped to the origin, without any
of that infrastructure. It is synchronous, always available offline, and
requires zero configuration. For a tool used by one person on one device,
the tradeoff is entirely in LocalStorage's favour.

The application treats LocalStorage as a write-through cache: every mutation
to the in-memory `transactions` array is immediately mirrored to LocalStorage
via `saveToStorage()`. This means LocalStorage is always up to date and
`loadFromStorage()` on the next page load always recovers the full state.

### Why Chart.js?

Rendering a pie chart from scratch on a `<canvas>` element requires
significant low-level work: calculating slice angles, drawing arcs, rendering
a legend, handling hit-testing for tooltips, and managing responsive resizing.
Chart.js encapsulates all of that behind a declarative configuration object.

The integration surface is deliberately small. The application provides:
an array of labels, an array of values, and an array of colours.
Chart.js handles everything else. The `.update()` method also provides
free animated transitions between data states — a UI quality that would
otherwise require a custom animation loop.

Chart.js is loaded from the jsDelivr CDN rather than bundled locally.
This keeps the project dependency-free at the file level while still
delivering a production-quality charting library.

### Benefits of the Current Architecture

**Traceability.** Every action the user takes can be traced end-to-end in
a single ~280-line file. There are no abstraction layers, no event buses, and
no indirect state updates. `form submit` → `transactions.push()` →
`renderTransactions()` is the complete path.

**Predictability.** Because the entire UI is re-derived from the state array
after every mutation (full re-render rather than incremental patching), there
is no possibility of the list, the balance, and the chart falling out of sync
with each other or with LocalStorage.

**Zero dependencies at the file level.** Opening `index.html` in a browser
is sufficient to run the application. No terminal, no npm, no server, and no
internet connection after the first load are required.

**Beginner readability.** The code uses only ES6 features (arrow functions,
template literals, `const`/`let`, `Array.filter`, `Array.reduce`,
`Array.forEach`) that are standard in modern JavaScript curricula. Every
function is named, single-purpose, and commented.

**Low operational risk.** There are no servers to go down, no API keys to
expire, no packages to audit for vulnerabilities, and no deployment pipeline
to maintain. The application will continue to work correctly as long as a
modern browser exists.
