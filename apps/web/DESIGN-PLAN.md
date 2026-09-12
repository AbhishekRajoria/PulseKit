# PulseKit — DESIGN PLAN.md
*Visual direction, component inventory, page-by-page layout, motion, states.*
*Stack: Next.js 16 App Router · React 19 · Tailwind CSS v4 · Inter + JetBrains Mono · no component library*

---

## 0. Design Brief Answer — One Direction, Argued

### The direction: Instrument-grade light

Not dark-first. Not the "near-black with acid-green accent" that every dev tool defaults to in 2026. PulseKit is a developer dashboard built around signal — event pulses, delivery streams, real-time status. The right analogy is not a code editor (dark, dense, attention-absorbing) but a **heart-rate monitor or signal analyser**: white-dominant, high-contrast, with a single energetic accent that marks live data.

The three reference images you provided all share this: white or near-white surface, very low colour saturation everywhere except where data needs emphasis. That's the right instinct. The distinction PulseKit can own within that space is **the pulse itself as a design element** — not an overdone ECG graphic, but the rhythm: live-feed rows that arrive with a quiet heartbeat animation, stat cards where the number is the headline, a signature emerald that only fires when something is delivered.

**Why not dark?** Dark-first was the default dev tool look from 2018–2024. In 2026, most developer tools (Linear, Vercel, Railway, Resend, Neon — every tool in PulseKit's own stack) ship light-first. Dark mode is a user preference, not a brand statement. A clean white-first dashboard with genuine information hierarchy reads more confidently than one hiding in darkness.

**Why emerald?** The product name contains "pulse." Delivered events are good news — green is semantically correct. Emerald (not lime, not seafoam) is precise enough to feel intentional rather than default. It appears only on positive delivery states and one interactive accent, nowhere else. Everything else is graphite.

---

## 1. Token System

### 1.1 Color (Tailwind v4 `@theme` additions)

Add to `globals.css` alongside existing vars:

```css
@theme inline {
  /* Base */
  --color-canvas:    #f8f9fa;   /* page background — slightly cooler than #fafafa */
  --color-surface:   #ffffff;   /* card / panel */
  --color-surface-2: #f3f4f6;  /* inset / code blocks */
  --color-border:    #e5e7eb;   /* default border */
  --color-border-strong: #d1d5db; /* dividers, separator lines */

  /* Foreground */
  --color-ink:       #111827;   /* primary text — not pure black */
  --color-ink-2:     #374151;   /* secondary text */
  --color-ink-3:     #6b7280;   /* muted / metadata */
  --color-ink-4:     #9ca3af;   /* placeholders, timestamps */

  /* Accent — used ONLY for delivered status + primary CTA */
  --color-pulse:     #10b981;   /* emerald-500 */
  --color-pulse-bg:  #ecfdf5;   /* emerald-50 for badges */
  --color-pulse-dim: #d1fae5;   /* hover / subtle wash */

  /* Status (keep existing pills, harmonise) */
  --color-status-delivered: #10b981;  /* emerald */
  --color-status-failed:    #ef4444;  /* red-500 */
  --color-status-pending:   #f59e0b;  /* amber-500 */
  --color-status-rate:      #f97316;  /* orange-500 */
  --color-status-dedup:     #9ca3af;  /* gray-400 */

  /* Channel (keep existing, tighten) */
  --color-ch-email:   #7c3aed;  /* violet-700 */
  --color-ch-slack:   #0d9488;  /* teal-600 */
  --color-ch-webhook: #0284c7;  /* sky-600 */
  --color-ch-inapp:   #4338ca;  /* indigo-700 */

  /* Sidebar */
  --color-sidebar-bg: #ffffff;
  --color-sidebar-active-bg: #f3f4f6;
  --color-sidebar-active-text: #111827;
}
```

**WCAG check:** `--color-ink` (#111827) on `--color-surface` (#fff) = 16.75:1 ✓. Emerald (#10b981) on white = 2.2:1 — never use as text on white; only on `--color-pulse-bg` or as an icon/dot.

### 1.2 Typography

**Inter** stays as the only prose face. **JetBrains Mono** stays as the only monospace face. No third family.

Scale (add to Tailwind config or use as reference):

| Role | Size | Weight | Line-height | Usage |
|---|---|---|---|---|
| `page-title` | 1.25rem / 20px | 600 | 1.4 | Page `<h1>` |
| `section-label` | 0.6875rem / 11px | 500 | 1.6 | Section headers — *sentence case, not all-caps* |
| `card-metric` | 1.875rem / 30px | 700 | 1 | Stat card primary number |
| `card-label` | 0.75rem / 12px | 400 | 1.5 | Stat card label beneath number |
| `body` | 0.875rem / 14px | 400 | 1.6 | Default text |
| `body-sm` | 0.75rem / 12px | 400 | 1.5 | Metadata, timestamps |
| `mono-data` | 0.8125rem / 13px | 400 | 1.5 | user_id, event names in table, payload |
| `mono-key` | 0.75rem / 12px | 400 | 1.5 | API key display |

**Type rule:** Section labels are sentence case ("Recent events", not "RECENT EVENTS"). This is the single clearest break from generic dashboard templates.

### 1.3 Spacing & Radius

- Base unit: 4px
- Card padding: 20px (p-5)
- Page horizontal padding: 24px (px-6)
- Card border-radius: 10px (rounded-[10px]) — tighter than rounded-xl (12px), slightly more composed
- Pill border-radius: 999px
- Input border-radius: 6px
- Sidebar item border-radius: 6px

### 1.4 Shadows

Use sparingly. One shadow token:

```css
--shadow-card: 0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04);
```

No elevation shadow hierarchy. Cards lift via border, not shadow. Shadow only on dropdowns and modals.

---

## 2. Layout Shell

### 2.1 Decision: Keep sidebar, add icon rail

**Verdict:** Keep the collapsible fixed sidebar. Icon rail (narrower) would work for 3–4 nav items but PulseKit's contextual project nav (project → events / notifications) needs text labels to be legible without hover. Keep the existing collapsed `w-16` / expanded `w-60` pattern.

**Change:** sidebar background stays white, but add a `1px border-r` in `--color-border`. Remove any shadow on the sidebar.

**Project switching** (for future multi-project): add a project context switcher at the top of the sidebar below the logo — a compact pill showing the current project name with a chevron. Clicking opens a dropdown. This avoids a separate topbar entirely.

```
┌─────────────────────────────────────────────────────────┐
│ [P] PulseKit         │  Page content                    │
│ ─────────────────    │                                   │
│ ◎ my-saas-app   ⌄   │  (max-w-5xl, mx-auto, px-6 py-8) │
│ ─────────────────    │                                   │
│ Overview             │                                   │
│ Projects             │                                   │
│                      │                                   │
│ — my-saas-app ——     │                                   │
│   Events             │                                   │
│   Notifications      │                                   │
│                      │                                   │
│ [collapse ‹]         │                                   │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Page max-width

Events page (table-heavy): `max-w-6xl`
All other pages: `max-w-4xl`
Both: `mx-auto px-6 py-8`

---

## 3. Component Inventory & Specs

### 3.1 Stat Card

Used on the events page (4 cards: Total / Delivered / Failed / Pending).

**Hierarchy rule:** The number is the headline. Everything else is supporting.

```
┌──────────────────────────┐
│ 2,847                    │   ← 30px bold, ink
│ Total events             │   ← 12px, ink-3
│                          │
│ ↑ 12% from yesterday     │   ← 11px, ink-4 (optional trend)
└──────────────────────────┘
```

- Card: white, border `--color-border`, padding 20px, radius 10px
- "Delivered" card only: number in `--color-pulse` (emerald) — the only coloured number
- "Failed" card: number in `--color-status-failed` (red)
- "Pending": number in `--color-status-pending` (amber)
- "Total": number in `--color-ink`

**Do not** put an icon in the stat card. The number is enough.

### 3.2 Status Pill

```
● delivered     ← dot + label, emerald
● failed        ← red
● pending       ← amber
● rate_limited  ← orange
● deduplicated  ← gray
```

Pill: `inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium`

Background: 10% opacity of status colour. Text: status colour at full opacity.

```css
/* Example for delivered */
.pill-delivered {
  background: var(--color-pulse-bg);   /* #ecfdf5 */
  color: var(--color-pulse);           /* #10b981 */
}
```

### 3.3 Channel Pill

```
email    ← violet
slack    ← teal
webhook  ← sky
inapp    ← indigo
```

Same shape as status pill. Suffix `×2` repeat count in `ink-3` if multiple attempts. Example: `email ×3`

### 3.4 Events Table

Columns (priority order — hide rightmost first on smaller screens):

| Column | Width | Hide at | Notes |
|---|---|---|---|
| Event | flex-1 | never | `text-sm ink` + JetBrains Mono |
| User | 140px | sm | `text-xs mono-data ink-3` |
| Status | 120px | never | status pill |
| Channel | 120px | md | channel pill + ×N |
| Received | 100px | lg | relative time ("2m ago") |

Row hover: `bg-gray-50` transition 100ms. Row click → event detail.

**No `<a href>` raw tags.** Use Next `<Link>` with `className="block"` wrapping the `<tr>` content. Or use `router.push()` on row click.

### 3.5 Live Feed

The visual centrepiece. Design intent: a gentle heartbeat, not a news ticker.

```
┌─────────────────────────────────────────────────────────┐
│ Live feed          ● connected                          │
│ ─────────────────────────────────────────────────────── │
│ payment.failed   user_123   ● delivered   email   2s   │  ← newest, pulse-in
│ user.signup      user_456   ● delivered   inapp   8s   │
│ order.created    user_123   ● failed      slack   12s  │
│ server.down      user_789   ● pending     email   31s  │
└─────────────────────────────────────────────────────────┘
```

**Animation:** new rows enter with `opacity-0 → opacity-100 + translate-y-[-4px] → translate-y-0` over 200ms. One row, one animation. No cascading.

**Connection indicator:** a 6px dot, `--color-pulse` when connected, `--color-ink-4` when reconnecting. Pulses with a `@keyframes pulse` (scale 1 → 1.2 → 1, 2s loop) only when connected.

**Reduced motion:** `@media (prefers-reduced-motion: reduce)` — remove translate, keep opacity fade only, remove dot pulse.

**Empty state:** "Waiting for events…" in ink-4, mono face, no illustration.

### 3.6 API Key Display

Shown exactly once after project creation. Do not use a toast — use the inline success card (current approach is right).

```
┌──────────────────────────────────────────────────────────┐
│ Project created                                          │
│                                                          │
│ Your API key — shown once                               │
│ ┌──────────────────────────────────┬───────┬──────────┐ │
│ │ pk_test_••••••••••••••••••••••   │ Show  │  Copy    │ │
│ └──────────────────────────────────┴───────┴──────────┘ │
│                                                          │
│ Store this securely. You won't see it again.            │
│                                                [→ View project]│
└──────────────────────────────────────────────────────────┘
```

- Background: `--color-pulse-bg` (#ecfdf5) with `border border-emerald-200`
- "Shown once" is not a badge — it's a plain `text-sm text-ink-3` line below the key
- Key field: JetBrains Mono, `bg-white border border-gray-200 rounded-md px-3 py-2`
- Show/Hide + Copy are `text-sm text-ink-3` buttons, no border

**Password-gated reveal** (on project detail): inline accordion panel below the project meta. Click "Reveal key" → password input appears inline (no modal). Submit → masked key + Show/Hide/Copy. This is lower stakes than the create flow — accordion is right.

### 3.7 Event Detail — Payload

```
┌───────────────────────────────────┐
│ Payload                    [Copy] │
│ ─────────────────────────────────│
│ {                                 │
│   "amount": 4999,                 │
│   "currency": "INR",              │
│   "reason": "card_declined"       │
│ }                                 │
└───────────────────────────────────┘
```

- Block: `bg-[--color-surface-2] rounded-[10px] border border-gray-200 p-4`
- Font: JetBrains Mono, 13px, ink-2
- No syntax highlighting colours (adds a dependency, wrong aesthetic for this tool)
- Copy button: top-right, `text-xs text-ink-3`, becomes "Copied" for 1.5s
- Expand/collapse for deep objects: `<details>` + `<summary>` — native, no JS dependency

### 3.8 Notification Inbox

**Decision on user selector:** Do not fold notifications into a unified activity feed. The existing per-user inbox model is correct for a notification platform — a developer needs to see what a specific end-user received. Keep the user selector.

**Redesign the selector:** Replace the hardcoded dropdown with a compact horizontal pill group:

```
Show inbox for:  [user_123]  [user_456]  [user_789]
```

Active pill: `bg-gray-900 text-white`. Inactive: `bg-gray-100 text-ink-2`. When real user IDs come from the API, map to these pills dynamically.

**Flag in code comment:** `// TODO: derive user list from notifications table, not hardcode`

Inbox row:
- Unread: `font-medium ink` title, left border `2px solid --color-pulse`
- Read: `font-normal ink-3` title, no border
- Expand row → body text appears with `max-h-0 → max-h-[200px]` transition 150ms

---

## 4. Page-by-Page Layout

### 4.1 `/` — Landing

One screen, no scroll needed on desktop.

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  [P] PulseKit                          [Sign in →]  │
│                                                      │
│                                                      │
│         One SDK call.                                │
│         Every delivery, logged.                      │
│                                                      │
│         [Get started →]                              │
│                                                      │
│         ──────────────────────────────               │
│                                                      │
│         pulse.notify({                               │
│           event: 'payment.failed',                   │
│           user: 'user_123',                          │
│           data: { amount: 499 }                      │
│         })                                           │
│                                                      │
└──────────────────────────────────────────────────────┘
```

- Background: `--color-canvas`
- Headline: 2.25rem, weight 700, ink, max-width 480px, left-aligned (not centred — centred landing pages read as consumer apps)
- Code block: JetBrains Mono, `bg-white border rounded-[10px] p-5 shadow-card`, max-width 400px
- One line of emerald in the code block: the event name string in `--color-pulse`

**Update metadata** in `app/layout.tsx`: `title: "PulseKit"`, `description: "Developer notification infrastructure. One SDK call, every delivery logged."`

### 4.2 `/login`

Single column, vertically centred on `min-h-screen bg-canvas`.

```
┌──────────────────────────┐
│ [P] PulseKit             │
│                          │
│ Sign in                  │
│                          │
│ Email                    │
│ [_____________________]  │
│                          │
│ Password                 │
│ [_____________________]  │
│                          │
│ [  Sign in  ]            │
└──────────────────────────┘
```

Card: `w-full max-w-sm bg-white border rounded-[10px] p-8 shadow-card`
No "create account" link — developer tool, accounts are provisioned.
Error state: `text-sm text-red-600` below the submit button, no toast.

### 4.3 `/projects` — Project list

```
Projects                          [+ New project]

┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ my-saas-app  │ │ staging      │ │              │
│              │ │              │ │  + New       │
│ 30 req/min   │ │ 100 req/min  │ │  project     │
│ Created 3d   │ │ Created 1d   │ │              │
└──────────────┘ └──────────────┘ └──────────────┘

── Create project ──────────────────────────────── (inline, expands below)
```

Project cards: white, border, hover `border-gray-300` transition 100ms. Click → project detail. Cards are links, not buttons.

**Create form:** inline below the grid, not a modal. On success, replace with the API key success card (existing flow, keep it).

**Empty state (0 projects):**

```
No projects yet

Instrument your app with one line:
pulse.notify({ event: 'payment.failed', user: 'user_123', data: {} })

[Create your first project →]
```

Mono code snippet inline, no box needed at this scale.

### 4.4 `/projects/[id]` — Project detail

```
← Projects

my-saas-app                    [Edit name]   [Delete]

30 req/min · Created 3 days ago

── API Key ─────────────────────────────────────────
[Reveal key]  (accordion, password-gated)

── Quick look ──────────────────────────────────────

┌─────────────────────┐  ┌─────────────────────────┐
│ Events              │  │ Notifications            │
│ 2,847 total         │  │ 12 unread                │
│ [View events →]     │  │ [View inbox →]           │
└─────────────────────┘  └─────────────────────────┘
```

Quick-look cards: same card style, left-aligned text, single large number, link to full page.

### 4.5 `/projects/[id]/events` — Events view

```
Events                                    [↓ Export]

┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ 2,847    │ │ 2,791    │ │ 42       │ │ 14       │
│ Total    │ │ Delivered│ │ Failed   │ │ Pending  │
└──────────┘ └──────────┘ └──────────┘ └──────────┘

── Live feed ───────────────────────────────────────
● connected
payment.failed   user_123   ● delivered   email   2s
user.signup      user_456   ● delivered   inapp   8s

── All events ──────────────────────────────────────

[Search events…]                         [Filter ⌄]

Event          User          Status       Received
payment.fail…  user_123      ● delivered  2m ago
user.signup    user_456      ● delivered  8m ago
order.creat…   user_789      ● failed     12m ago
```

**Search/filter:** Add a search input (`<input>` with debounce, client component island) that filters the displayed table client-side. Server-side pagination is a future concern — for MVP, client filter + `max 100 rows` server-side limit is acceptable. Note this in a `// TODO: server-side pagination when event volume > 500` comment.

**Filter dropdown:** Status filter only. Channel filter optional. Trigger: small `Filter` button with chevron, dropdown appears below with checkbox groups.

### 4.6 `/projects/[id]/events/[eventId]` — Event detail

```
← Events

payment.failed                    ● delivered   email

user_123 · Received 14 Aug 2026 15:01:42

── Payload ─────────────────────────────────  [Copy]
{
  "amount": 4999,
  "currency": "INR"
}

── Delivery log ────────────────────────────────────

Channel  Status      Attempt  Error   Delivered
email    ● delivered  1        —      15:01:44
slack    ● failed     1        403    15:01:43
```

Delivery log table: same column widths as events table. `error_message ?? "—"`. `delivered_at` in locale time.

When `logs.length === 0`: "No delivery attempts recorded yet." in ink-4.

---

## 5. Motion & Animation

**Total animated elements: 4. That is the budget.**

| Element | Animation | Duration | Reduced motion |
|---|---|---|---|
| Live feed new row | opacity 0→1 + translateY -4px→0 | 200ms ease-out | opacity only |
| Connection dot | scale pulse loop | 2s infinite | static dot |
| Notification row expand | max-height 0→auto | 150ms ease | instant |
| Sidebar collapse | width transition | 200ms ease | instant |

No page-load animations. No card hover animations. No scroll-triggered reveals. The live feed's arrival animation earns its place because it communicates "this is new." Everything else is static.

---

## 6. Empty States & First-Run

### 0 projects
As shown in 4.3. No illustration. Copy + curl snippet + CTA.

### 0 events (project has no events yet)
```
No events yet

Send your first event:

curl -X POST http://localhost:8080/api/v1/events \
  -H "Authorization: Bearer pk_test_..." \
  -H "Content-Type: application/json" \
  -d '{"event_name":"test.event","user_id":"user_1","payload":{}}'
```

Code block: JetBrains Mono, `bg-surface-2 rounded-[10px] border p-4`, Copy button top-right.

### Live feed waiting
"Waiting for events — send one to see it appear here." ink-4, mono.

### Event with no logs
"No delivery attempts recorded." Row in delivery log table, ink-4, no icon.

---

## 7. Questions Resolved

**Q1. Visual identity:** Clean instrument-grade light (argued above). ECG metaphor used subtly: live feed as the pulse, emerald on delivered, dot animation. Not applied to logos or decorative graphics.

**Q2. Color system:** Light-first, no `prefers-color-scheme` adaptive for MVP (adds CSS complexity with no user benefit at portfolio scale). Single accent: emerald. Full palette above.

**Q3. Layout:** Keep sidebar, add project switcher pill at top. Icon rail deferred.

**Q4. API key moments:** Inline success card (not modal) for create — correct, keep. Password-gated reveal as inline accordion — not modal.

**Q5. Events table:** Client-side filter for MVP, server pagination commented for future. Stat cards stay — they are the fastest read.

**Q6. Payload/JSON:** Monospace block, no syntax colouring, native `<details>` for deep expand, Copy button.

**Q7. Notifications:** Per-user inbox stays. Pill group replaces dropdown selector. Not folded into activity feed.

**Q8. Feed motion:** Single row arrival animation. Dot pulse. Budget of 4 animations total.

**Q9. Empty/first-run:** curl snippet in code block. No illustration.

**Q10. Fonts:** Inter + JetBrains Mono only. No display face — the page title and wordmark are fine in Inter 600.

**Q11. Scope cuts:** The channel config UI (email `to`, Slack webhook URL) is out of scope for this design plan. It belongs in a future Project Settings page. Sketch it as: `/projects/[id]/settings` with two sections — "Delivery channels" (toggle + endpoint field per channel) and "Rate limit." Not designed here, noted as next surface.

---

## 8. Implementation Phases

### Phase 1 — Foundation (do first, everything builds on it)
- Add token system to `globals.css`
- Update `app/layout.tsx` metadata
- Update sidebar: project switcher pill, sentence-case labels, tighter radius on nav items
- Update card base styles globally

### Phase 2 — Events page (highest-value surface)
- Stat card hierarchy (number prominent, no icon)
- Live feed component redesign (connection dot, row animation)
- Events table (correct columns, Link not `<a>`, client search island)
- Event detail (delivery log table, payload block with Copy)

### Phase 3 — Project lifecycle
- Project list (card grid, empty state with snippet)
- Create form → API key success card
- Project detail (quick-look cards, accordion reveal)

### Phase 4 — Notifications + landing
- Notification inbox (pill selector, unread left-border, expand animation)
- Landing page (left-aligned headline, code block, single CTA)
- Login page (centred card)

### Phase 5 — Polish
- Empty states for all pages
- Reduced-motion pass
- WCAG colour contrast audit
- Mobile sidebar overlay

---

## 9. Code-Level Notes (Tailwind v4 specific)

```css
/* Add to globals.css @layer base */
*:focus-visible {
  outline: 2px solid var(--color-pulse);
  outline-offset: 2px;
}

button, [role="button"] {
  cursor: pointer;
}

/* Pill base (compose with status/channel variants) */
.pill {
  @apply inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium;
}

/* Mono data (user IDs, event names in tables) */
.mono-data {
  font-family: var(--font-mono);
  @apply text-[13px] text-[--color-ink-3];
}
```

**Server/client split reminder:** Stat cards, event table, delivery log table, project cards — all server components. LiveFeed, notification inbox, search input, pill selector — client components. Do not add `"use client"` to page files; extract interactive islands. The `force-dynamic` on events page stays.

**No shadcn/radix.** Every dropdown, accordion, and dialog is hand-rolled. For the filter dropdown: `<details><summary>Filter</summary>...checkboxes...</details>` — native, accessible, zero JS. For the API key accordion: same pattern.

---

*End of DESIGN PLAN.md*
