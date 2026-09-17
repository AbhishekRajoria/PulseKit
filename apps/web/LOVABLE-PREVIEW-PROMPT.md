# Lovable Restyle + Finish Prompt — the full page redesign spec

> Created 2026-09-17. This is the definitive design baseline for the PulseKit web UI,
> superseding the emerald/graphite direction in `DESIGN-PLAN.md`.
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
gratuitous KPI graphs. The ONLY earned charts (optional, secondary):
an "events in the last 24h" strip on the Events page, and a
delivery-success/latency panel on Project Overview. Nothing else.

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
  active nav state. Copper = meaning, never decoration.
- Failures #DC2626 (failures only). Pending/warning muted #D97706,
  de-emphasized. No other colors anywhere.
- HARD BAN: green as a brand/accent color; purple, violet, cyan, neon
  blue, gradient backgrounds or text, glow, glassmorphism, colorful
  blobs, rainbow badges, ANY generic AI-generated palette.
- Typography: Inter for UI/prose; JetBrains Mono ONLY for technical
  data (event names, API keys, IDs, route paths, latency values); tabular
  numerals on every metric; 11px uppercase tracking-wider micro-labels
  for table headers and field labels.

───────────────────────────────
4. EXISTING PAGES — RESTYLE, DON'T RESTRUCTURE (keep all content/copy):
- Landing: hero with request/fan-out tabs, 3 channel cards, 3-step
  pipeline, engineering principles, bottom CTA band.
- /login and /signup: centered card forms, micro-labels, inline errors.
- /projects list: see Projects fix below.
- Create-project modal: name + rate-limit presets (5–30 req/min);
  success state = "shown once" amber badge + masked pk_test_… key with
  reveal/copy + "View project".
- /docs: keep IA (sticky toc, numbered sections); improve spacing, code
  block presentation, active-section highlight, copy buttons.
- /guide: architecture page content stays as-is.

PROJECTS LIST FIX (specific decision): no sparklines, no charts. Card =
compact mono line (project id like prj_w8f2k9m) + 3-column stat strip
(events/users/unread, unread in red) + rate-limit caption (e.g. 30
req/min) + created / "last event X ago" meta. Wide operational cards
using the viewport. "New project" sits in the page header, right.

───────────────────────────────
5. BUILD THE MISSING PAGES in this same system:
a) /projects/:id Project Overview — breadcrumb "All projects"; metadata
   header (name, mono id, rate limit, created); API key card
   (password-gated reveal, masked, shown-once badge); quick-stat cards;
   the "Awaiting first signal" onboarding checklist with a copyable
   curl/SDK snippet and a pulsing live-listener indicator; optional
   single 24h-events strip.
b) /projects/:id/events Events Feed — breadcrumb; header with processed
   count; 4 stat cards (Total / Delivered / Failed / Pending); live
   WebSocket delivery stream simulation (auto-updating, newest on top,
   "Xs ago", pulse indicator); search box; events table (event name,
   user, status dot+label, channel, received); empty-state toggle with
   copyable curl: POST /api/v1/events with Authorization:
   Bearer $PULSEKIT_API_KEY, snake_case JSON body.
c) /projects/:id/events/:eventId Event Detail — event name + mono id;
   status dot + channel pill; metadata row (user, received); formatted
   JSON payload block with copy; and the DELIVERY LOG as the
   centerpiece: a wide, roomy, instrument-grade manifest table with
   Channel badge / Status / Attempt / Error / Delivered-at columns.
d) /projects/:id/notifications — two-pane: left = user list with unread
   pills and "Mark all read"; right = selected user's in-app feed with
   expandable payloads and read/unread states.

───────────────────────────────
6. CONSISTENCY REQUIREMENT
Landing and dashboard must read as the SAME product: shared typography,
colors, radius, borders, button styles, status language (dot + label),
spacing scale. No separate "marketing style" vs "app style".

───────────────────────────────
7. FACTS — keep 100% truthful everywhere:
- NEVER write "deduped"/idempotency. (Real: multi-channel fan-out,
  sliding-window rate limiting, retries, ~2s delivery, live feed.)
- HTTP codes: 202 accepted · 400 missing field · 401 invalid/absent key
  · 429 rate limited · 500 server error. NEVER 200 or 422.
- API keys are pk_test_… and shown ONCE at creation.
- Payloads/endpoints are snake_case: event_name, user_id, payload,
  user_name, to.

───────────────────────────────
8. DELIVERABLE
When done, reply with: your updated token table, the 3 biggest changes
vs the old look, and which page I should review first. This stays a
visual preview — local deterministic mock data, interactive states,
NO production code handoff.
```