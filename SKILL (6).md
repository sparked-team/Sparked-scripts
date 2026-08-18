---
name: webflow
description: Master entry point for any Webflow site work — bundles the full set of Webflow sub-skills (workflow, components, cms, variables, custom-js, accessibility) and maps the decision tree for which to use when. Read this FIRST for any Webflow task. Triggers on "webflow", "design tokens", "client-first", "collection list", "DynamoItem", "MCP designer", any Webflow site URL, or any client site build / edit request.
---

# Webflow — Master Skill

Single entry point for any Webflow site work, regardless of client. Read this first to pick the right sub-skill, then dive into the specific one for execution details.

---

## The Webflow skills at a glance

### Webflow context (own skills)

| Skill | When to use |
|---|---|
| **`/webflow`** | Always start here. Decision tree below. |
| **`/webflow-workflow`** | Starting a new site, new page, or unsure of the build order. 6-phase pattern: variables → global styles → style guide → components → template → pages. |
| **`/webflow-components`** | Building or editing Navbar, Footer, or any reusable component. TextPropElement traps, class rename cycles, ComponentInstance MCP limits. |
| **`/webflow-cms`** | Building or editing CMS-driven pages with Collection Lists. The 5 non-negotiable rules (always `list_collection_items` first, etc.) and the DynamoItem → `<div><p>` pattern. |
| **`/webflow-variables`** | Creating, renaming, deleting, or rebinding design tokens. Two-tier primitive→semantic system, safe deletion order, MCP limits. |
| **`/webflow-custom-js`** | Adding any third-party JS to a Webflow site. Page-level vs site-level rule, IX2 interop, retiring native Slider, Lenis-vs-ScrollSmoother. Always pair with a `gsap-*` skill for the GSAP API itself. |
| **`/webflow-accessibility`** | Before calling any page or change "done." WCAG 2.1 AA checklist + 10-point quick audit. |

### GSAP API (official GreenSock skills — installed)

GSAP powers Webflow Interactions and is the recommended animation library when adding custom JS to Webflow. Skills bundle: [github.com/greensock/gsap-skills](https://github.com/greensock/gsap-skills), MIT, installed via `npx skills add`.

| Skill | Covers |
|---|---|
| `/gsap-core` | Tweens (`gsap.to/from/fromTo`), easing, duration, stagger, defaults, `gsap.matchMedia()` for responsive + reduced-motion |
| `/gsap-timeline` | `gsap.timeline()`, position parameter, nesting, playback control |
| `/gsap-scrolltrigger` | Scroll-linked animation, pinning, scrub, triggers |
| `/gsap-plugins` | Registration, ScrollToPlugin, ScrollSmoother, Flip, Draggable, Inertia, Observer, SplitText, ScrambleText, SVG plugins, CustomEase, EasePack, CustomWiggle, CustomBounce, GSDevTools |
| `/gsap-react` | `useGSAP` hook + cleanup patterns |
| `/gsap-utils` | Helpers: clamp, mapRange, toArray, snap, random, wrap, pipe |
| `/gsap-performance` | FPS, layout thrash, will-change, profiling |
| `/gsap-frameworks` | Vue, Svelte integration |

---

## Decision tree — pick the right skill

```
Starting a brand new site?
  → /webflow-workflow  (6-phase order)
  + create a project folder: ~/Desktop/Webflow - <Client>/

Setting up design tokens or rebinding variables?
  → /webflow-variables

Building or fixing a Navbar / Footer / reusable component?
  → /webflow-components

Working with a Collection List, DynamoItem, or CMS bindings?
  → /webflow-cms

Adding custom JS (GSAP, scroll animations, custom carousels)?
  → /webflow-custom-js  (Webflow-specific placement + IX2 interop)
  → plus the relevant /gsap-* skill for the GSAP API:
      tweens / easing / staggers           → /gsap-core
      multi-step sequencing                → /gsap-timeline
      scroll-linked / pinning              → /gsap-scrolltrigger
      Draggable / SplitText / ScrollSmoother → /gsap-plugins
      React useGSAP cleanup                → /gsap-react

Final check before publishing or calling work "done"?
  → /webflow-accessibility  (10-point quick audit)

Element won't style / won't take a class / can't be edited?
  → /webflow-components  (likely TextPropElement)

Element renders but Designer MCP times out?
  → ask user to click the project's Designer-with-MCP-bridge URL
  → if Data API tool also exists for the task, prefer it (cms_tool, data_pages_tool, data_sites_tool)
```

---

## Universal rules across all Webflow work

These apply on every project, every session:

### 1. Project state lives in the project folder + memory, never in skills

Skills are universal patterns. Per-client IDs, page mappings, current build status, palette, design decisions go in:

- The project folder (`~/Desktop/Webflow - <Client>/reference/`)
- Memory files (`~/.claude/projects/.../memory/`)

If a skill ever references a specific page ID or component ID, that's a bug — move it out.

### 2. Page-level custom code beats site-level for per-page scripts

Site Settings → Custom Code loads on EVERY page. Only put truly global scripts there (analytics, global fonts). Page-specific libraries (carousels, page-specific GSAP, Finsweet attribute scripts for one page) go in Page Settings → Custom Code → Before `</body>`.

### 3. Always `list_collection_items` before `create_collection_items`

Checking field schema alone misses existing items. Duplicate items break CMS bindings irreversibly. This rule has cost full collection rebuilds — do not skip.

### 4. Designer MCP needs the tab foregrounded

Designer-side tools (`element_tool`, `style_tool`, `whtml_builder`, `page_tool`, `de_component_tool`, `asset_tool`) time out when the Webflow Designer browser tab is backgrounded. Data API tools (`cms_tool`, `data_pages_tool`, `data_sites_tool`, `data_scripts_tool`) work without the tab open. Prefer Data API tools when both options exist.

When a Designer tool times out: share the project's Designer URL (with `?app=` MCP bridge param) as a clickable markdown link and ask the user to click it to reactivate. Do not retry indefinitely.

### 5. Spans are inline only

CMS bindings work on block elements (`div`, `p`, `h1`–`h6`). Spans cannot be CMS-bound and cannot be standalone styled units. Use `<div><p>text</p></div>` for any styled CMS-bindable text.

### 6. Accessibility is mandatory, not optional

Every page gets the 10-point quick audit before being called done. Every interactive element gets a visible focus state. Every image gets meaningful alt text (or `alt=""` + `aria-hidden="true"` for decorative). No exceptions.

### 7. Never delete a variable without querying bindings first

Deletion is silent — bound styles break with no warning. Rebind first, verify, then delete.

### 8. Never bind Collection Lists while duplicate items exist

Bindings get stuck pointing at deleted items and cannot be cleanly updated in the Designer. Clean duplicates first.

---

## Standard project folder layout

For any Webflow client project, create:

```
~/Desktop/Webflow - <Client>/
├── .mcp.json                ← Webflow Docs MCP server (optional but recommended)
├── README.md                ← project map: where files live, IDs, links
├── reference/
│   ├── element-ids.md       ← site / page / component / collection / element IDs
│   ├── cms-collections.md   ← collection schemas + binding plans
│   └── designer-link.md     ← Designer URL with ?app= MCP bridge param
├── custom-code/
│   ├── README.md            ← where each snippet goes in Webflow
│   └── <snippet>.html       ← per-page custom code to paste
└── notes/                   ← design specs, behavior docs, decisions
```

The `.mcp.json` template for the Webflow Docs MCP:

```json
{
  "mcpServers": {
    "webflow-docs": {
      "url": "https://developers.webflow.com/api/fern-docs/mcp"
    }
  }
}
```

Opening a Claude Code session from this folder auto-loads the Docs MCP, giving access to official Webflow SDK / REST API documentation as searchable tools.

---

## MCP servers used for Webflow work

| Server | What it does | Auth | Active when |
|---|---|---|---|
| `webflow` (`https://mcp.webflow.com/mcp`) | Build & edit live sites — Designer + Data API tools | OAuth into workspace | Always (registered globally) |
| `webflow-docs` (`https://developers.webflow.com/api/fern-docs/mcp`) | Read official SDK / REST API docs | None (public) | When Claude Code runs from a project folder with `.mcp.json` |

To activate Designer-side tools: click the project's Designer URL with `?app=<bridge-id>&workflow=canvas` to bring the tab to the foreground.

---

## Quick reference: tool families

### Data API tools (work without Designer tab open)
- `cms_tool` / `data_cms_tool` — collections, items, fields, bindings
- `data_pages_tool` — pages, branches, metadata, SEO
- `data_sites_tool` — site info, locales, publish
- `data_scripts_tool` — custom code (enterprise plans only via MCP)
- `data_assets_tool` — asset upload, metadata
- `data_localization_tool` — secondary-locale content

### Designer tools (need Designer tab foregrounded)
- `element_tool` — query, set styles, set text, set link, set attributes, move, remove
- `element_builder` — create new elements (no ComponentInstance support)
- `component_builder` — insert component instances by name
- `de_component_tool` — manage components, props, variants, canvas navigation
- `style_tool` — create / update / remove styles
- `variable_tool` — design tokens
- `whtml_builder` — HTML+CSS injection (single root, no `<style>`, Webflow-only breakpoints)
- `page_tool` — current page context, switch pages, branches
- `asset_tool` — folder + asset management
- `element_snapshot_tool` — visual PNG snapshot for verification

### Docs lookup (via `webflow-docs` MCP when active)
- Fetches official Webflow developer docs pages and Tool reference

---

## When in doubt

1. Run the relevant sub-skill's checklist
2. Run `/webflow-accessibility` before publish
3. Save project-specific learnings to memory or to the project's `reference/` folder, not into this skill
