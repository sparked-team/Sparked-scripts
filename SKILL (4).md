---
name: webflow-variables
description: Audit, reorganize, and rebind Webflow design token variables via MCP. Covers Client-First folder naming, the two-tier primitive→semantic color system, safe deletion order, spacing in rem, and MCP tool limitations. Use when creating, renaming, deleting, or rebinding variables or collections.
---

# Webflow Variables — Design Token Workflow

Universal patterns for Webflow design token work. Project-specific variable names and bindings live in the project's reference folder, not here.

## ⚠️ THE 3 NON-NEGOTIABLE RULES

1. **ALWAYS query style bindings BEFORE deleting any variable** — deleting a bound variable silently breaks styles (font disappears, background drops out). There is no warning.
2. **ALWAYS rebind styles to new variables BEFORE deleting old ones** — if a style is bound to variable A and you delete A before creating B, the binding is gone permanently.
3. **NEVER use px for spacing variables** — use `custom_value: "4rem"` etc. Client-First is rem-based throughout; mixing px breaks fluid responsive.

---

## Phase 0 — Audit before touching anything

```
1. variable_tool > get_variable_collections  (query: "all")
2. variable_tool > get_variables             (on each collection, include_all_modes: true)
3. style_tool > query_styles                 (with include_properties: true) for:
   - font-family       → reveals heading/body/mono font bindings
   - background-color  → reveals body + background-color-* bindings
   - color             → reveals text color bindings
   - any other property you plan to touch
```

Map every variable ID to which styles reference it. Build a dependency table before touching anything.

---

## Client-First folder structure

Variable names use `/` as folder separators. Webflow creates nested folders in the Variables panel from these.

```
Color/
  Color/Primitive/        ← raw hex values, never used directly in styles
    e.g. cream, white, black, neutral-100…900, brand-blue, success-light, error-dark

  Color/Background/       ← semantic, reference primitives
    primary, secondary, tertiary, alternate
    success, warning, error

  Color/Text/             ← semantic, reference primitives
    primary, secondary, alternate
    success, warning, error

  Color/Border/           ← semantic
    primary, secondary, alternate

  Color/Link/             ← semantic
    primary, secondary, alternate

Font/
  Font/heading            ← display / heading family
  Font/body               ← body family
  Font/mono               ← monospace family

Spacing/
  Spacing/page-pad        ← e.g. 4rem (desktop horizontal padding)
  Spacing/section-large   ← e.g. 8.25rem
  Spacing/section-medium  ← e.g. 5rem
  Spacing/section-small   ← e.g. 3rem
  Spacing/container-max   ← e.g. 82rem
```

Naming convention: `[element] - [style] - [identifier]`, not `color-blue` or `bg-red`. Semantic names survive theming and rebranding; literal color names do not.

---

## Rename — safe at any time

Renaming a variable does NOT break style bindings — Webflow tracks bindings by internal ID, not by name. The CSS variable name changes (e.g. `--color--background--primary`) but any styles using the variable still work.

**Batch renames** in a single `variable_tool` call — up to ~20 actions per call without issue.

---

## Creating size variables in rem

`create_size_variable` / `update_size_variable` both accept `custom_value` as an arbitrary CSS string:

```json
{
  "create_size_variable": {
    "variable_name": "Spacing/page-pad",
    "value": { "custom_value": "4rem" }
  }
}
```

Do NOT use `static_value` with `unit: "px"` for spacing — the whole point of variables is rem-based scaling.

---

## Deletion order — the only safe sequence

```
1. Create new replacement variable
2. Rebind every affected style to the new variable  (style_tool > update_style, variable_as_value)
3. Verify rebind succeeded (check response IDs)
4. Delete the old variable
```

Styles most likely to have variable bindings:

- `body` — font-family, background-color, color
- `h1`, `h2`, `h3`, `h4` — font-family
- `heading-style-h1/h2/h3/h4` — font-family
- `text-size-large/medium/regular/small` — font-family
- `text-style-quote` — font-family, border-left-color
- `background-color-primary/secondary/tertiary/alternate` — background-color, color
- `text-color-primary/secondary/alternate` — color
- `padding-global` — padding-left, padding-right
- `padding-section-large/medium/small` — padding-top, padding-bottom
- `container-large/medium/small` — max-width

Query these first when auditing variable usage.

---

## Two-tier color system

**Primitive tier** — raw values, one source of truth per color:

```
Color/Primitive/cream   = #efeeee
Color/Primitive/rust    = #BF7665
Color/Primitive/black   = #000000
```

**Semantic tier** — descriptive names, should reference primitives:

```
Color/Background/primary   → Color/Primitive/cream
Color/Background/tertiary  → Color/Primitive/rust
Color/Background/alternate → Color/Primitive/black
```

Styles bind to **semantic tokens only**, never directly to primitives. This way changing a primitive (e.g. tweaking the rust shade) updates every usage site automatically.

Note: aliasing semantic → primitive within the same collection currently fails via MCP. Set these manually in Designer using the variable picker.

---

## MCP tool limitations (must be done manually in Designer)

| Action | Available via MCP? |
|---|---|
| Rename variable | ✅ `rename_variable` |
| Delete variable | ✅ `delete_variable` |
| Create variable | ✅ `create_*_variable` |
| Rebind style to variable | ✅ `update_style` + `variable_as_value` |
| **Delete collection** | ❌ Manual in Designer |
| **Rename collection** | ❌ Manual in Designer |
| **Variable aliasing within same collection** (one variable → another) | ❌ `update_color_variable` with `existing_variable_id` errors — do manually in Designer |

---

## Style variable modes (per-mode overrides)

To make a style resolve a collection's variables using a specific mode:

```
get_style_variable_modes        → read modes currently applied to a style
set_style_variable_mode         → apply { collectionId: modeId } modes
remove_style_variable_mode      → remove one collection's mode override
remove_all_style_variable_modes → clear all mode overrides on a style
```

Scope: `style_name` plus optional `variant_id` / `breakpoint_id` / `pseudo`. Useful for dark mode or themed sections.

---

## Where project-specific data lives

Per-client variable names, palette values, active style bindings, current cleanup status — do NOT live in this skill. They live in:

- The project's `reference/element-ids.md` or similar reference doc
- Project memory files

If you need to know the current variable state: query `variable_tool > get_variable_collections` and `get_variables`.
