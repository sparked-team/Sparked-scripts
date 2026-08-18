---
name: webflow-workflow
description: End-to-end build workflow for Webflow sites following Client-First conventions. Covers the correct sequence from variables through global styles, style guide, components, page template, and page building. Use at the start of any new build or page, or when unsure what to do next.
---

# Webflow Build Workflow (Client-First)

Universal phase order for any Webflow site build following Client-First conventions. Project-specific IDs and current state live in the project's reference folder and memory, not here.

## The 6-phase sequence (never skip, never reorder)

```
1. Variables        → design tokens (incl. responsive modes per breakpoint)
2. Global Styles    → typography + utility classes
3. Style Guide      → living reference page
4. Components       → navbar, footer, reusable UI
5. Page Template    → shell every page is built from
6. Build Pages      → fill main-wrapper with sections (using Grid for content, Flex for components)
```

Why this order: each phase depends on the previous. Building components before variables means rebuilding when tokens change. Building pages before the template means inconsistent shells across the site.

## ⚠️ Grid vs Flex — the responsive-survival rule

**For CONTENT SECTIONS (the parts that have to re-flow across breakpoints): use CSS Grid.**
**For COMPONENTS with fixed inline relationships (button text + icon, navbar logo + links, footer columns, carousel/marquee tracks): use Flex.**

| Layout | Use | Why |
|---|---|---|
| Topics section (3 cards → 1 column on mobile) | **Grid** with `repeat(auto-fit, minmax(280px, 1fr))` | Card grid that reflows from 3 → 2 → 1 without writing breakpoint rules |
| Ontology section (4-card asymmetric grid) | **Grid** with `grid-template-areas` or named columns | Need to control exactly which card sits where at each size |
| Logos / sponsors strip | **Grid** auto-fit | Number of visible logos changes per viewport — grid auto-handles it |
| Article / blog index | **Grid** auto-fit | Same reason |
| Navbar (logo + links) | **Flex** with `justify-content: space-between` | Linear horizontal relationship, doesn't need to re-flow into a grid |
| Footer (brand column + nav column) | **Flex** at desktop → Grid at mobile if stacking | The brand + nav side-by-side is inherently linear |
| Button (icon + label) | **Flex** | Two items always inline |
| Card internals (eyebrow → heading → body → footer) | **Flex** column | Stack of items in order |
| Pill / tag (text + optional icon) | **Flex** inline | Inline relationship |
| Carousel track / Marquee track | **Flex** | Linear horizontal sequence by definition |
| Stat numbers strip | **Flex** if same row always; **Grid** if needs to wrap |
| Hero section (text + image side-by-side, stacks on mobile) | **Grid** 2-col → 1-col | Grid handles the layout direction shift cleanly |

**Why this matters:** A Flex parent only knows "lay items in a row/column with these grow/shrink rules." It doesn't know how to *re-author* the layout at smaller sizes. A Grid parent with `repeat(auto-fit, minmax(W, 1fr))` automatically packs items into however many columns fit, with zero breakpoint overrides. For an editorial site that needs to read well at every viewport, Grid for content sections is the lower-maintenance choice.

**Flex stays useful for components** because components have fixed internal anatomy — a button is always icon + text in that order; a navbar is always logo on left + links on right at any size that fits. Re-flow doesn't happen inside the component, only between components.

## ⚠️ Every styled element is a div + text inside

Tied to the Grid/Flex rule and to Levan's div-wrapper hard rule: every element with a visual box (border, background, padding, shadow) is a `<div>` with text elements inside. Text elements only get typography. Spans are for inline accents within paragraphs, never as standalone styled units.

See `/webflow-components` skill for the full div-wrapper rule.

---

## Phase 1 — Variables (design tokens)

Set up a single "Design Tokens" collection with 3 folders before touching any styles.

```
Color/Primitive/    ← raw hex values (brand colors, neutrals, system)
Color/Background/   ← semantic bg tokens (primary, secondary, tertiary, alternate)
Color/Text/         ← semantic text tokens (primary, secondary, alternate)
Color/Border/       ← border tokens
Color/Link/         ← link tokens
Font/               ← heading, body, mono
Spacing/            ← page-pad, section-large/medium/small, container-max
```

**Rules:** rem not px for spacing. Query style bindings before deleting any variable.
See full rules: `/webflow-variables` skill.

---

## Phase 2 — Global Styles

Foundation styles that every page and component inherits. These bind to variables from Phase 1.

**Typography hierarchy:**
- `body` → font-family `Font/body`, background-color `Color/Background/primary`, color `Color/Text/primary`
- `h1`–`h4` → font-family `Font/heading`
- `heading-style-h1/h2/h3/h4` → heading font, sized per scale
- `text-size-large/medium/regular/small` → body font, sized per scale
- `text-style-quote` → optional accent border + italic for blockquotes

**Utility layout classes:**
- `padding-global` → padding-left/right: `Spacing/page-pad`
- `padding-section-large/medium/small` → padding-top/bottom: Spacing variables
- `container-large` → max-width: `Spacing/container-max`, auto margins
- `container-medium` → max-width: 64rem (default)
- `container-small` → max-width: 48rem (default)

**Color utility classes (Client-First naming):**
- `background-color-primary/secondary/tertiary/alternate` → bg + paired text color
- `text-color-primary/secondary/alternate`

These go in a **Global Styles component** placed inside `page-wrapper` on every page.

### Type rendering recipe — paste into the Global Styles embed

The standard Client-First snippet is correct but minimal. This expanded version adds proper kerning + ligatures and gives small text a path to read better (subpixel rendering thickens fragile strokes at sizes below ~14px):

```css
/* Global type rendering */
body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  font-kerning: normal;
  font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
  font-optical-sizing: auto;
}

/* Small body text reads better with the browser default subpixel rendering */
.text-size-small,
.text-size-tiny,
.text-style-muted,
small {
  -webkit-font-smoothing: subpixel-antialiased;
  letter-spacing: 0.005em;
}
```

| Property | Why it's there |
|---|---|
| `-webkit-font-smoothing: antialiased` | Forces grayscale antialiasing on macOS — cleaner shapes for headlines |
| `-moz-osx-font-smoothing: grayscale` | Firefox-on-macOS equivalent |
| `text-rendering: optimizeLegibility` | Browser-level kerning + ligatures |
| `font-kerning: normal` | Explicit kerning if browser strips text-rendering |
| `font-feature-settings: "kern" 1, "liga" 1, "calt" 1` | OpenType kerning, standard ligatures, contextual alternates |
| `font-optical-sizing: auto` | Picks the right optical size axis on variable fonts (no-op otherwise) |
| `subpixel-antialiased` on small text | Reverts to default rendering so strokes don't read as broken hairlines below 14px |

**Why this goes in the Global Styles component, NOT Site Settings → Custom Code:** putting it in the Global Styles component means the typography improvements are visible in the Designer canvas while building, not just on the published site. Site Settings code only loads at the published runtime.

### Body color softening (optional polish)

Pure `#000000` on `#ffffff` is 21:1 contrast — technically perfect but can look harsh on retina displays. For editorial sites, body text at `#0e0e0e` or `rgba(0,0,0,0.92)` is more comfortable to read without sacrificing accessibility:

```css
body { color: #0e0e0e; }
```

Or bind a `Color/Text/primary` variable to a slightly-off-black instead of pure black.

---

## Phase 3 — Style Guide page (living document)

A draft page that visually documents every token + utility class. Never published. Grows with the project — never "finished."

Sections to include:
- Color palette (all primitive + semantic tokens)
- Typography scale (every heading-style-* + text-size-*)
- Spacing scale
- Button variants
- Tag / pill variants
- Component previews as they're built

---

## Phase 4 — Components

Build shared components before any pages. Order matters:

1. **Global Styles component** — utility class embeds applied site-wide
2. **Navbar component** — sticky shell, logo + nav links
3. **Footer component** — brand col + nav col + copyright
4. **Other reusable UI** — cards, pills, modals; build as needed before first page that uses them

**Component anti-patterns:** see `/webflow-components` skill for TextPropElement traps, rename cycles, image overflow, and ComponentInstance MCP limitations.

---

## Phase 5 — Page Template

The `_Template` page is the shell every new page starts from. Never published.

### Structure

```
body
  div.page-wrapper
    ComponentInstance: Global Styles
    ComponentInstance: Navbar
    main.main-wrapper        ← empty — fill with sections per page
    ComponentInstance: Footer
```

### Using the template

1. Designer Pages panel → right-click `_Template` → Duplicate
2. Rename the duplicate
3. Set slug, SEO title/description (via `data_pages_tool > update_page_settings`)
4. Open the new page and build sections inside `main-wrapper`

**Do NOT duplicate an existing content page** — it carries page-specific sections, settings, and class overrides. Always duplicate `_Template` only.

**Cannot create pages via MCP** — `data_pages_tool` has no `create_page` action. Page creation and duplication = manual Designer step.

**Slug note:** Webflow strips underscores from slugs (`_template` becomes `template`). The page title retains the underscore.

### Building the template (MCP + manual split)

Component instances cannot be inserted via MCP — `element_builder` has no `ComponentInstance` type. Standard split:

1. MCP: `element_builder` → inject `div.page-wrapper` into body
2. MCP: `element_builder` → inject `main.main-wrapper` inside page-wrapper
3. Manual: drag **Global Styles**, **Navbar**, **Footer** from Components panel into page-wrapper around main-wrapper

Use this same split when building on top of the template on new pages.

### Section pattern (every section follows this)

```html
<section class="section_[name] [background-color-*] padding-section-[size]">
  <div class="padding-global">
    <div class="container-large">
      <!-- section content -->
    </div>
  </div>
</section>
```

---

## Phase 6 — Build Pages

With the template in place, each new page:

1. Duplicate `_Template` in Designer
2. Update page settings (slug, SEO) via MCP if needed
3. Inside `main-wrapper`, add sections using the section pattern above
4. Apply `background-color-*` utility to each section for colour zoning
5. Use `padding-section-large/medium/small` for vertical rhythm
6. Bind any CMS fields per `/webflow-cms` skill
7. Run accessibility audit per `/webflow-accessibility` skill before calling done

---

## Skills map

| Task | Skill |
|---|---|
| Variables / design tokens | `/webflow-variables` |
| Components, class renames, navbar/footer | `/webflow-components` |
| CMS collection lists, DynamoItem, bindings | `/webflow-cms` |
| GSAP, ScrollTrigger, custom JS, carousels | `/webflow-custom-js` |
| WCAG 2.1 AA accessibility | `/webflow-accessibility` |
| Master entry / decision tree | `/webflow` |
| This workflow reference | `/webflow-workflow` |

---

## Where project-specific data lives

Per-client / per-site state (page IDs, component IDs, collection IDs, current build status, palette specifics, design decisions) does NOT go in this skill. It lives in:

- **Project folder** (e.g. `~/Desktop/Webflow - <Client>/reference/element-ids.md`) — IDs and links
- **Memory** (`~/.claude/projects/.../memory/`) — current state, decisions, history

If a project doesn't have a project folder yet, create one with at minimum:
```
Webflow - <Client>/
├── .mcp.json              ← Webflow Docs MCP if useful
├── README.md
└── reference/
    └── element-ids.md     ← site / page / component / collection / element IDs
```
