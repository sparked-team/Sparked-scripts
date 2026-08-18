---
name: webflow-cms
description: Build CMS-driven Webflow pages correctly via MCP — avoiding duplicate items, broken bindings, and structural mismatches between static reference cards and CMS templates. Use when building or modifying Webflow Collection Lists, DynamoItem templates, nested MultiReference lists, or CMS field bindings.
---

# Webflow CMS — Correct Build Workflow

Universal patterns for Webflow CMS work. Project-specific collection IDs, item IDs, and field schemas live in the project's reference folder, not here.

## Vocabulary: Dynamo* vs Designer labels

Webflow's MCP exposes Collection List elements with internal "Dynamo" names. These map 1:1 to Designer labels:

| MCP element type | Designer label | Role |
|---|---|---|
| `DynamoWrapper` | Collection List Wrapper | Outer container, bound to a CMS collection |
| `DynamoList` | Collection List | The inner list — items render here |
| `DynamoItem` | Collection Item | The template card, cloned once per CMS entry |
| `DynamoEmpty` | Empty State | Shown when collection has zero items |

"Dynamo" is Webflow's internal codename for the CMS engine. Same elements, different name in the SDK.

---

## ⚠️ THE 5 NON-NEGOTIABLE RULES

1. **ALWAYS `list_collection_items` before `create_collection_items`** — checking field schema is not enough; items can exist even when schema shows only Name+Slug defaults
2. **NEVER bind collection lists while duplicate items exist** — bindings get stuck pointing at deleted items and cannot be cleanly updated in Designer
3. **DynamoItem template must use `div → <p>` for CMS-bindable text** — never `<span>+text` directly; the div carries the style, the `<p>` carries the binding
4. **whtml_builder fails on childless elements** — inject WHILE the parent has at least one child; for rebuilds: inject new content FIRST, then delete old content
5. **Inspect static reference cards before building DynamoItem** — the template must match the static design exactly in structure

---

## Phase 1 — Audit BEFORE touching anything

Do all of these before any create/inject operations:

```
1. cms_tool > list_collection_items     (on main collection)
2. cms_tool > list_collection_items     (on EVERY secondary/reference collection)
3. cms_tool > get_collection_details    (field schema for binding map)
4. Read the local HTML reference file   (if applicable)
5. style_tool > get_styles              (with skip_properties: true to discover existing Client-First classes)
6. element_tool > query_elements        (on static reference cards with children_depth: -1)
```

**Stop signs:**

- If items already exist with clean slugs → do NOT create duplicates
- If a slug has a hash suffix like `-3311e` → it's a duplicate, delete it
- If multiple items share the same Name → duplicates exist

---

## Phase 2 — Build DynamoItem to match static reference

The DynamoItem card must be structurally identical to the static reference, with these substitutions for CMS compatibility:

| Static reference uses | DynamoItem should use |
|---|---|
| `<span class="card_num">01 / 06</span>` | `<div class="card_num"><p>01 / 06</p></div>` |
| `<span class="card_pill">Label</span>` | `<div class="card_pill"><p>Label</p></div>` |
| `<span class="card_stat">Stat</span>` | `<div class="card_stat"><p>Stat</p></div>` |
| `<h2 class="card_name">Title</h2>` | same (Heading already binds directly) |
| `<p class="card_desc">…</p>` | same (Paragraph already binds directly) |
| `<a class="card_link">Text</a>` | same (Link element) |
| `<cite>— Author</cite>` | `<div class="card_quote-cite"><p>Citation</p></div>` |

**Rule:** every CMS-bindable text element needs to be a `<p>` (or Heading), with its style class on a wrapping `<div>` if the design requires a styled container. Spans are inline-only and cannot be CMS-bound in Webflow.

**Build via whtml_builder injection** — pass the full HTML in one go. If a DynamoItem already has content (old card), inject new content first with `prepend`, then delete old.

After injection, apply Client-First styles to the 3-level structure:

- DynamoWrapper → `<scope>_list-wrapper` (e.g. `rc_list-wrapper`)
- DynamoList → `<scope>_list-body`
- DynamoItem → `<scope>_list-item`

---

## Phase 3 — Nested Collection Lists for MultiReference fields

For each multi-value field (tags, references, etc.):

1. User adds a Collection List INSIDE the target container div (manual in Designer — MCP cannot bind Collection Wrappers to collections)
2. Apply 3 styles to the nested structure:
   ```
   <scope>_list-wrapper:  display:flex; flex-wrap:wrap; gap:6px; width:100%
   <scope>_list:          display:flex; flex-wrap:wrap; gap:6px; width:100%
   <scope>_list-item:     display:contents
   ```
3. Inject `<div class="<scope>_tag"><p>Name</p></div>` into each nested DynamoItem
4. User binds nested wrapper to the `*-ref` MultiReference field
5. User binds the `<p>` inside `<scope>_tag` to `Name` field of referenced collection

**Why `display:contents` on the item:** Makes the DynamoItem invisible to layout so the inner pill becomes a direct flex child of the list, flowing horizontally as individual pills. Without `display:contents`, each item is its own block and pills stack vertically.

---

## Phase 4 — CMS data (only if collections were empty in Phase 1)

1. Create items in SECONDARY collections first
2. Create main collection items
3. Update main items with MultiReference links to secondary item IDs
4. Verify with `list_collection_items` — no duplicates

---

## ⚠️ CMS writes go to draft — publish_collection_items separately

`update_collection_items` and `create_collection_items` write to DRAFT state. The changes do not appear on the live site until either:

- `publish_collection_items` is called with the affected item IDs (programmatic, takes seconds), OR
- The user re-publishes the entire site from Designer

For batch updates (e.g. uploading many images to many items), the cleanest pattern is:

1. One batched `update_collection_items` call with all items
2. Followed by one `publish_collection_items` call with all the item IDs

Skipping step 2 leaves the changes invisible to visitors even though the API responded with success.

---

## Pattern: bulk image upload + bind to CMS

When uploading many local images and binding them to CMS records (e.g. researcher portraits, sponsor logos, product photos), the full pipeline:

### 1. Compute MD5 of each file
```bash
md5 -q "filename.jpg"
```

### 2. Create asset metadata in one batched MCP call
`data_assets_tool > create_asset` with one action per file. Each action takes `site_id`, `file_name`, `file_hash`. Response includes `uploadUrl` + `uploadDetails` (S3 presigned form fields) per asset.

For more than ~5 assets, the response will likely exceed the tool result size cap — it gets saved to disk automatically. Parse with `jq` or Python.

### 3. POST each file to S3 in parallel
The S3 upload is multipart/form-data with the form fields from `uploadDetails` PLUS the file binary under the `file` field. Order matters: `file` field must be LAST.

Use Python with `concurrent.futures.ThreadPoolExecutor` for parallel uploads — single bash is fine for ~5 files but Python with 10 workers handles 30+ cleanly. The bash macOS-default version (3.2) doesn't support associative arrays so Python is more portable anyway.

### 4. Bind assets to CMS records
`data_cms_tool > update_collection_items` with one items array containing every record. Each item's `photo` field (or equivalent Image field slug) takes:
```json
{
  "fileId": "<asset_id_from_create_asset>",
  "url": "<hostedUrl_from_create_asset>",
  "alt": "<descriptive_alt_text>"
}
```
Webflow internally creates a CMS-scoped copy of the asset and returns its own `fileId` in the response — that's normal.

### 5. Publish
`data_cms_tool > publish_collection_items` with the array of item IDs.

### Pitfalls
- File names with diacritics (Mladen Popović → Mladen Popovic in CMS) need normalization before matching to records
- `data_assets_tool` doesn't accept local file paths directly — you must use the S3 presigned URL flow
- `asset_tool > upload_image_by_url` requires a public URL, so it doesn't help for local files
- Always check existing CMS items first — never create asset duplicates that conflict with existing records

---

## Phase 5 — Designer bindings (manual, user does these)

Standard binding map:

| Element | Binding target | How |
|---|---|---|
| `<scope>_num` → `<p>` | Number field | Click `<p>`, bind text |
| `<scope>_name` (h2) | Name | Click h2, bind text |
| `<scope>_pill` → `<p>` | PlainText field | Click `<p>`, bind text |
| `<scope>_stat` → `<p>` | Stat field | Click `<p>`, bind text |
| Image | Image field | Click image, Settings panel, bind src |
| `<scope>_desc` (p) | Description | Click p, bind text |
| Quote `<p>` | Quote | Click p, bind text |
| Link element | URL field | **Settings panel → URL → purple CMS icon** |
| Nested wrapper | `*-ref` MultiRef field | Settings panel → Source |
| Nested `<p>` in pill | Name | Click `<p>`, bind text |

**Link binding is the trickiest:** users often try to bind the text node inside the link to the Link CMS field, which shows the URL as text. Correct method = Settings panel (gear icon) → URL field → purple database icon → select the Link CMS field. This binds the `href` attribute, not the visible text.

---

## Phase 6 — Verify & finalize

1. Preview in Designer → verify pills flow horizontally, images load, all fields populated
2. Only AFTER CMS version confirmed working → remove static reference cards
3. Publish site (CMS publish via API fails with 409 if site not yet published in Webflow)

---

## Common gotchas & fixes

### "Text Link" placeholder after whtml_builder

Webflow replaces injected `<a>` element text content with default "Text Link" placeholder. The `href` is preserved, the visible text is not. Fix with `element_tool > set_text` on the String child of the Link element after injection.

### Designer MCP times out

The Designer tab must be active and in foreground. When it goes idle, MCP calls time out. Ask user to click the Designer URL (with `?app=` MCP bridge param) to reactivate before retrying. Data API tools (`cms_tool`, `data_pages_tool`, `data_sites_tool`) work without the Designer open.

### whtml_builder fails with "Failed to create element"

The target parent has zero children. Either:

- Inject while there's still at least one existing child, then delete old
- Find a different parent that has children
- Build the structure via `element_builder` one element at a time (slower but works)

### Slug ends with random hash suffix

Webflow auto-suffixed because the slug collided with an existing item. Strong signal of a duplicate — investigate before continuing.

### Pills stack vertically instead of horizontally

The Collection List Wrapper/List/Item are block elements by default. Apply the 3 nested-list styles above; the `display: contents` on the item is the critical piece.

### Comma-separated text vs individual pills

- PlainText field → comma-separated string → renders as one styled block
- MultiReference field + nested Collection List → individual pills (matches static design)
- For pill design use MultiReference. PlainText is only OK if visual separation isn't critical.

---

## Where project-specific data lives

Per-client collection IDs, item IDs, field schemas, MultiReference slugs — do NOT live in this skill. They live in:

- The project's `reference/cms-collections.md` file
- Project memory files

If you need a collection ID and don't have it: ask the user or query `cms_tool > get_collection_list`.
