# Lovable Restyle + Finish Prompt — the full page redesign spec

> Created 2026-09-17, hardened 2026-09-17 after external design-review pass.
> Definitive design baseline for the PulseKit web UI, superseding the
> emerald/graphite direction in `DESIGN-PLAN.md`.
> Paste this into the SAME Lovable project (not a new one) with the dashboard
> inspiration screenshots attached in the thread. Preview only — local mock data,
> no production code handoff.

```
You hold the full PulseKit context from this project. This message is the
DEFINITIVE design baseline — it supersedes all earlier design directions.
Execute it in ONE pass: restyle the existing preview to the new system AND
build the missing pages. Do not ask clarifying questions; make reasonable
calls consistent with this spec.

ENTIRE THREAD'S DECISIONS ARE LOCKED IN THIS SPEC.

───────────────────────────────
0. FACTS FIRST — truthful contract (non-negotiable; applies to every word)
- Real capabilities: one POST to /api/v1/events → email (Resend) + Slack
  (webhook) + in-app notifications, sliding-window rate limiting, retries,
  ~2s delivery, live WebSocket delivery feed.
- NEVER write "deduped", "idempotency", or any SHA/message-hash keys.
  NO CLI exists. There is no other ingest endpoint.
- HTTP codes: 202 accepted · 400 missing/invalid field · 401 invalid or
  absent API key · 429 rate limited · 500 server error.
  Explicitly NEVER 200 for event ingest, and NEVER 422 — anywhere.
- API keys are pk_test_… and are shown exactly ONCE at project creation
  inside an "shown once" amber badge.
- If any install command appears on any page it MUST be
  `npm install pulsekit-sdk` (the package is pulsekit-sdk, NOT pulsekit).
- All payloads/endpoints are snake_case: event_name, user_id, payload,
  user_name, to.

───────────────────────────────
1. PRODUCT CHARACTER (read first — it governs every page)
PulseKit is a developer-infrastructure notification platform: one API
call delivers to email (Resend) + Slack + in-app, with sliding-window
rate limiting, retries, and a live WebSocket delivery feed. It is
OPERATIONAL and TECHNICAL. It is NOT an analytics dashboard and NOT a
generic SaaS marketing template.

DENSITY RULE: dense where the product has real information, whitespace
where it doesn't. Density comes from tables, lists, delivery manifests,
status timelines, and event detail. NEVER invent data or widgets to fill
space. No donut charts, no decorative sparklines, no fake growth %, no
gratuitous KPI graphs.

EARNED DATA PANELS — allowed, optional, secondary (never default-heavy):
- "Events in the last 24h" strip (Events page).
- Delivery-success/latency panel (Project Overview).
- A "delivery status breakdown" bar (Project Overview): horizontal
  proportions of delivered/failed/pending across recent events, built
  as plain divs with width %, no chart library.
Nothing else. If a widget doesn't answer "is my infra working?", it
doesn't belong.

───────────────────────────────
2. VISUAL REFERENCE
The dashboard-inspiration images attached in this thread are your
PRIMARY reference — for layout, spacing, text hierarchy, card
composition, and grid. Not the current preview (it is the starting
point, not the target).

QUALITIES TO REPLICATE: strong hierarchy (page heading → section heading
→ primary metric → supporting text → metadata/labels), generous but
intentional spacing (spacious, not sparse), a wide grid that uses the
viewport, large well-structured cards, thin hairline borders, restrained
shadows, simple icons, consistent 12–16px radius.

───────────────────────────────
3. COLOR SYSTEM — MONOCHROME-FIRST + COPPER-AS-SIGNAL
- Ink: charcoal #1C1917 (primary text); warm slate #57534E (secondary).
- Surfaces: canvas warm paper #FAF9F7; cards #FFFFFF; surface-2 #F5F4F2
  (code wells, table headers); hairline borders #E7E3DE.
- Primary actions/buttons: deep navy #111827, hover #1F2937.
- COPPER #C2410C (hover #EA580C, tint #FDF3EE) — used ONLY as signal:
  live/pulse indicator, "delivered" status, the single primary CTA,
  active nav state. Copper = meaning, NEVER decoration.
- COPPER GUARDRAIL: copper must never appear on borders, dividers,
  secondary text, icons, or background fills. If a page has more than
  3 copper pixels-groups, you've overused it.
- Failures #DC2626 (failures only). Pending/warning muted #D97706,
  de-emphasized. No other colors anywhere.
- HARD BAN: green as a brand/accent color; purple, violet, cyan, neon
  blue, gradient backgrounds or text, glow, glassmorphism, colorful
  blobs, rainbow badges, ANY generic AI-generated palette.
- These are CUSTOM TOKENS. Use the exact hex values as named tokens
  (canvas, hairline, ink, surface-2, copper); do NOT approximate with
  Tailwind stone/warm-gray named scales — stock stone runs cooler and
  fights the copper.
- Typography: Inter for UI/prose; JetBrains Mono ONLY for technical
  data (event names, API keys, IDs, route paths, latency values); tabular
  numerals on every metric; 11px uppercase tracking-wider micro-labels
  for table headers and field labels.

───────────────────────────────
4. EXISTING PAGES — RESTYLE, DON'T RESTRUCTURE
ALREADY BUILT in this preview and NOT to be rebuilt from scratch —
restyle them in place, keep ALL content and copy:
- Landing (hero with request/fan-out tabs, 3 channel cards, 3-step
  pipeline, engineering principles, bottom CTA band).
- /login and /signup (centered card forms, micro-labels, inline errors).
- /projects list (see Projects fix below).
- Create-project modal (name + rate-limit presets 5–30 req/min; success
  state = "shown once" amber badge + masked pk_test_… key with
  reveal/copy + "View project").
- /docs (keep IA: sticky toc, numbered sections; improve spacing, code
  block presentation, active-section highlight, copy buttons).
- /guide (architecture page content stays as-is).

PROJECTS LIST FIX (specific decision): no sparklines, no charts. Card =
compact mono line (project id like prj_w8f2k9m) + 3-column stat strip
(events/users/unread, unread in red) + rate-limit caption (e.g. 30
req/min) + created / "last event X ago" meta. Wide operational cards
using the viewport. "New project" sits in the page header, right.

SIDEBAR IA (applies to the dashboard shell): the Events and Notifications
sidebar items are PROJECT-SCOPED — they always resolve to
/projects/[id]/events and /projects/[id]/notifications of the currently
selected project (from the project switcher). There is NO global
cross-project feed. Show this by scoping the nav to the selected project.

───────────────────────────────
5. BUILD THE MISSING PAGES — NOT yet in this preview, build them fresh
a) /projects/:id Project Overview — breadcrumb "All projects"; metadata
   header (name, mono id, rate limit, created); API key card
   (password-gated reveal, masked, shown-once badge); quick-stat cards;
   the "Awaiting first signal" onboarding checklist WITH a copyable
   curl/SDK snippet and a pulsing live-listener indicator (this checklist
   appears on this page only, when the project has zero events);
   optional: 24h-events strip + delivery-status-breakdown bar.
b) /projects/:id/events Events Feed — breadcrumb; header with processed
   count; 4 stat cards (Total / Delivered / Failed / Pending); live
   WebSocket delivery stream simulation (auto-updating, newest on top,
   "Xs ago", pulse indicator) where each stream row shows the
   PER-CHANNEL delivery path (e.g. "email → delivered", "slack → failed
   ×2") and is expandable; search box; events table (event name, user,
   status dot+label, channel, received); empty-state toggle with
   copyable curl: POST /api/v1/events with Authorization:
   Bearer $PULSEKIT_API_KEY, snake_case JSON body.
c) /projects/:id/events/:eventId Event Detail — event name + mono id;
   status dot + channel pill; metadata row (user, received); the
   JSON EVENT PAYLOAD block (mono, #F5F4F2 well, hairline border, copy
   button) paired with a RESPONSE RECEIPT block showing what PulseKit
   confirmed: 202 { eventId, receivedAt } — two mono blocks, labelled
   "Event payload" and "Receipt", side-by-side on wide, stacked on
   narrow; and the DELIVERY LOG as the centerpiece: a wide, roomy,
   instrument-grade manifest table with Channel badge / Status /
   Attempt / Duration (delivered−received, ms) / Error (full inline
   text, never truncated) / Delivered-at. Optional but recommended:
   a vertical status timeline beside the table (plain divs, no library):
   Received → Queued → per-channel delivered/failed with attempt +
   timestamps. Read as a forensic debugging tool, not a data grid.
d) /projects/:id/notifications — two-pane: left = user list with unread
   pills and "Mark all read"; right = selected user's in-app feed with
   expandable payloads and read/unread states.

───────────────────────────────
6. CONSISTENCY REQUIREMENT
Landing and dashboard must read as the SAME product: shared typography,
colors, radius, borders, button styles, status language (dot + label),
spacing scale, and copy voice. No separate "marketing style" vs "app
style".

───────────────────────────────
7. DELIVERABLE
When done, reply with: your updated token table, the 3 biggest changes
vs the old look, and which page I should review first. This stays a
visual preview — local deterministic mock data, interactive states,
NO production code handoff.
```