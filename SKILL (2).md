---
name: webflow-components
description: Patterns for building and editing Webflow components via MCP — navbar/footer structure, class rename cycles, TextPropElement limitations, sticky layout pitfalls, ComponentInstance and custom code constraints. Use when touching components, renaming classes, or debugging elements that won't style.
---

# Webflow Components — Build & Edit Patterns

Universal patterns for Webflow component work. Project-specific component IDs live in the project's reference folder, not here.

## ⚠️ THE DIV-WRAPPER RULE (apply to every build)

Every element with a visual box (border, background-color, border-radius, box-shadow, padding-as-container) is built as a **div wrapper with text inside**. Text elements (Paragraph, Heading, Span, TextLink) ONLY get typography styling.

| Element role | Gets these styles |
|---|---|
| **Text element** (p, h*, span, text link) | typography only — font-family, font-size, font-weight, color, letter-spacing, line-height, text-decoration |
| **Div wrapper** | everything visual — borders, background-color, border-radius, box-shadow, padding, layout (flex/grid), sizing |

**Concrete examples:**
- Button → `<div class="button"><p>Label</p></div>` — div carries background + border + padding, p carries typography
- Pill / badge / tag → `<div class="tag"><p>label</p></div>` — never a styled `<span>` directly
- Stat value → `<div class="stat_number"><p>271 Years</p></div>` — never a styled `<span>` standalone
- Card → always a div containing text elements inside, never a styled `<p>` or `<h*>` acting as the card

**Why this is non-negotiable:**
- Future-proof — add icons, second lines, images inside the wrapper without rebuilding
- CMS-bindable — text elements stay clean targets for CMS field bindings; wrapper stays the styled container
- Hover combinator effects — `.card:hover .inner` only works when wrapper is a real container
- Semantic HTML — wrapper is `<div>`, headings stay real `<h*>` for SEO without inheriting card visual roles
- Layout predictability — block-level wrappers behave consistently; styled inline text has padding/shadow quirks
- Spans can't be CMS-bound at all (Webflow only binds block elements)

**Auditing rule:** any standalone styled `<span>` or text element with a background/border is a bug; rebuild as div + text-inside.

---

## ⚠️ CRITICAL: TextPropElements cannot be styled

When a Webflow element is converted to a component, its text nodes become **TextPropElements**. These:

- Render as `<a>` tags in the DOM (link text becomes a prop)
- Have **no class slot** — they cannot receive a class in Designer or via MCP
- Appear as children of `<li>` items in the Navigator, but `query_elements` shows zero children on those `<li>` elements
- Any class you add will never apply visually

**Diagnosis:** If `query_elements` on a list item shows `children: []` but the item renders text in Designer — the text is a TextPropElement.

**Fix pattern:**

1. `remove_element` on all TextPropElement-based list items
2. Inject real `<li><a class="your-class" href="/">Text</a></li>` via `whtml_builder`, **one at a time** (whtml_builder requires a single root element per injection — cannot inject 4 `<li>` siblings in one call)
3. Verify with `element_snapshot_tool`

This is the standard pattern for rebuilding nav menus inside Footer / Navbar components when the original Designer-built links became TextPropElements.

---

## Class rename cycle (removing `-1` suffix classes)

Webflow creates `classname-1` duplicates when a class already exists. The safe rename cycle:

```
1. style_tool > create_style "canonical-name"  (with full CSS properties)
2. element_tool > set_style on each element    (reassign from -1 to canonical)
3. style_tool > delete_style "classname-1"     (only works when zero usages remain)
```

**Never** try to rename in-place — Designer doesn't support it via MCP. Always create → reassign → delete.

**Batch the reassignments:** pass all `set_style` actions in a single `element_tool` call.

### Persistent `-1` class (can't delete)

Sometimes `delete_style` fails: "ensure there are no usages." The class is still referenced internally by the component. Harmless — the element renders correctly, it just shows an extra class in the panel. Leave it.

---

## Navbar pitfall: sticky + `align-items: flex-end`

A common navbar pattern is sticky + flex-end:

```css
.navbar {
  position: sticky;
  top: 0;
  height: 4.4375rem;
  align-items: flex-end;
}
```

`align-items: flex-end` anchors children to the bottom of the navbar. If any child's intrinsic height **exceeds** the navbar height, the entire row overflows **above the viewport** — invisible on screen, not below.

**The trap with images:** An Image element with no explicit width/height in a flex container expands to fill available space. On a navbar with `align-items: flex-end`, this pushes nav content above the top of the screen.

**Fix:** Always constrain image elements in the navbar with explicit dimensions on the element itself (not just the class):

```
navbar_logo: width: 2.5rem; height: 2.5rem; object-fit: contain
```

**Symptom:** Navbar links div and logo appear "above the screen" — invisible in preview. This is overflow above viewport, not below.

---

## Footer component — recommended structure

```
footer (footer_component)
  footer_inner (container-large)
    footer_brand (left col)
      footer_logo-link > footer_logo (image)
      footer_logo-text (text)
      footer_tagline (paragraph)
    footer_nav (right col)
      footer_links (ul)
        li > a.footer_link  ← real Link elements (not TextPropElements)
      footer_copyright (paragraph)
```

### Footer nav links

Must be real `Link` elements with a `footer_link` class — **not** TextPropElements. If the component was originally built with text inside link blocks and converted to a component later, those text nodes will be TextPropElements and need the rebuild pattern above.

### `footer_link` class

If footer links appear blue/underlined despite the class being applied, check:

1. Is the element a TextPropElement? (invisible to `query_elements children`)
2. Is there a global `all-links` override? (check `style_tool > query_styles`)
3. Is the link inside a component context that bypasses the class?

---

## Navbar component — recommended structure

```
navbar (navbar)
  navbar_inner (container-large)
    navbar_logo-link (Link) > navbar_logo (Image) + navbar_logo-text (Text)
    navbar_links (ul)
      li > a.navbar_link  (one per nav item)
```

Key class properties:

- `navbar`: sticky, height constrained, align-items flex-end
- `navbar_inner`: container-large, display flex, justify-content space-between, align-items center
- `navbar_logo`: explicit width + height + object-fit contain
- `navbar_link`: text styling for nav links

---

## element_builder does NOT support ComponentInstance

`element_builder` accepts: `Container`, `Section`, `DivBlock`, `Heading`, `Paragraph`, `BlockContainer`, `Link`, `List`, `ListItem`, `Image`, `FormWrapper`, etc. — **not** `ComponentInstance`.

This means you **cannot insert a component instance (Navbar, Footer, Global Styles) via MCP**. The workaround:

```
MCP:    element_builder → inject structural divs (div.page-wrapper, main.main-wrapper)
Manual: Designer → drag component instances from Components panel into page-wrapper
```

Order in Designer:

1. Global Styles component (first child of page-wrapper)
2. Navbar component
3. main.main-wrapper (already injected via MCP)
4. Footer component (last child)

**Cannot convert inline elements to components via MCP either** — right-click → Create component must be done manually in Designer.

Note: there is a separate `component_builder` MCP tool that DOES insert component instances by component name — useful for sites where the component already exists in the project. Use it via `insert_in_element` (parent) or `insert_in_slot` (component slot).

---

## HTML Embed block content is NOT writable via MCP

Webflow `HtmlEmbed` elements (the `</> Embed` block dropped onto a page or inside a component to hold raw HTML / CSS / JS) expose only `domId` and `visibility` as mutable settings via `element_tool > set_settings`. The actual HTML body of the embed is not in the writable schema.

**Practical implication:** any edit to embed content (e.g. updating CSS inside the Global Styles component embed, swapping a marquee `@keyframes` definition, changing custom JS inside an in-page embed) is a manual Designer step. There is no MCP path on any Webflow plan.

**Diagnostic:** call `get_settings` with `type: "query_settings"` on the HtmlEmbed → only `domId` and `visibility` will return. Confirms the limitation.

**Workarounds when MCP-writability is needed:**
- For per-page custom code on enterprise plans, use `data_scripts_tool > register_inline_script` + `add_page_script` (this DOES work, but only on enterprise)
- For CSS rules, prefer `style_tool > update_style` over an embed wherever possible (Designer styles are fully MCP-writable; embed CSS is not)

---

## Custom code injection is plan-gated

`data_scripts_tool` (site-level and page-level custom code injection) returns **404** on non-enterprise Webflow plans.

Workarounds:

- Add styles via `style_tool > create_style` (preferred for CSS)
- Inject elements via `whtml_builder` with `css` param (inline element CSS only, no `<style>` tags)
- Manual embed block / custom code panel (user does in Designer)

---

## ⚠️ CRITICAL: Page-level vs site-level custom code

**Never default to Site Settings → Custom Code for third-party scripts.** Site-level code loads on EVERY page — increases load time across the entire site even on pages that don't use the script.

**Rule:** If a script only serves one page (e.g. a CMS Slider on the Home page only), it goes in **page-level custom code**.

**How to add page-level custom code (manual on non-enterprise):**

Designer → Pages panel → gear icon on the page → Custom Code tab → **Before `</body>` tag**

**Reminder:** Page-level Custom Code does NOT execute in Designer preview. The script only runs on the published site (`*.webflow.io` staging or production). Always test custom code by publishing to staging then opening that URL with a hard refresh.

**Decision table:**

| Script scope | Where to put it |
|---|---|
| Used on every page (analytics, global fonts) | Site Settings → Custom Code → Footer Code |
| Used on one page only (per-page lib) | Page Settings → Custom Code → Footer Code |
| Used on 2–3 pages | Page Settings on each of those pages |

Always get the exact `<script>` tag from the library's official docs — never guess CDN URLs.

---

## Where project-specific data lives

Per-client component IDs, site IDs, page IDs — do NOT live in this skill. They live in:

- The project's `reference/element-ids.md` file
- Project memory files

If you need an ID and don't have it: ask the user or query `data_sites_tool` / `data_pages_tool` / `de_component_tool > get_all_components`.
