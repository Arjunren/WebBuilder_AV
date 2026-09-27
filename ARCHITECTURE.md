# Architecture

## System shape

The application has three deliberately separate layers:

```text
Structured project JSON
        ├──> Editor renderer ──> selectable, draggable canvas
        └──> Export renderer ──> standalone production HTML files
```

The editor is a Vite-built ES module application styled with Tailwind CSS. It has two runtime adapters:

- the localhost web runtime uses a small Express server for constrained project, image-upload, preview, and export endpoints;
- the Tauri Windows/Android runtime stores projects in the installed app's private IndexedDB profile and uses native file dialogs for exports and backups.

Both runtimes use the same project schema and shared export renderer. No database, Supabase project, account, or cloud service is required.

When a browser supports the proposed WebMCP API, the editor progressively registers tools for reading the active project summary, adding supported portfolio sections, and switching preview devices. These tools call the same store actions as the visible UI and are absent without browser support.

## Document model

Every project uses schema version `2` and contains metadata, SEO settings, theme tokens, one or more pages, and embedded asset records. Each page owns a component tree. Components have stable IDs, a supported `type`, plain serializable content, breakpoint style maps, and children. Version 1 files are migrated in memory when opened so existing work is preserved.

```json
{
  "version": 2,
  "project": { "id": "project_...", "name": "Portfolio", "slug": "portfolio" },
  "seo": {},
  "theme": {},
  "pages": [
    {
      "id": "page_...",
      "name": "Home",
      "slug": "index",
      "sections": []
    }
  ],
  "assets": []
}
```

Templates use this same model. There is no template-only rendering path.

## Editor renderer

The editor renderer creates DOM nodes with `textContent`, safe attributes, and controlled style properties. Editor-only selection labels and drag state live only in this renderer. Content is never treated as arbitrary HTML. Inline editing updates structured text on blur.

Rich-text blocks remain structured text rather than raw HTML. A deliberately small formatting grammar supports paragraphs, `**bold**`, and `*emphasis*`; both editor and export renderers create or emit only those allowlisted elements after escaping user content.

Drag-and-drop uses the native HTML drag data transfer API. New library blocks carry a `new:<type>` payload; existing nodes carry an `existing:<id>` payload. Container types advertise child compatibility. The model rejects self-nesting and descendant cycles.

## Export renderer

The shared production renderer receives validated project JSON and emits one file per page. The localhost service writes those files below `exports`; an installed application returns the same generated strings to native save dialogs. The home page becomes `index.html`; additional pages use their safe slugs. Each file includes:

- semantic elements for supported components;
- escaped text and attributes;
- scoped generated CSS with tablet and mobile media queries;
- accessible mobile navigation behavior;
- metadata, theme tokens, and an embedded favicon;
- no editor controls, drag attributes, history, or project JSON.

Uploaded raster images are Data URLs, so every generated page remains portable without an asset directory. The editor warns on images above 1 MB.

## State, history, and autosave

`EditorStore` owns the active document, active page, selection, viewport, save state, and bounded history. Mutations record serialized snapshots with a maximum of 60 undo entries. Undo and redo restore the complete deterministic document state.

A debounced recovery save stores a working copy in `localStorage`. In localhost mode, explicit saves atomically write structured JSON through the API. In installed-app mode, explicit saves use IndexedDB in the app's WebView profile. A successful explicit save clears the recovery copy so stale recovery data cannot silently replace a saved project.

Uninstalling the native app or clearing its application data can remove IndexedDB. Portable JSON backups remain the user-controlled recovery mechanism.

## Responsive model

Styles cascade in this order:

```text
Desktop/base → Tablet override → Mobile override
```

Each smaller viewport inherits larger values unless a property exists in its own map. The editor and production renderer use the same merge order. Grid column counts have explicit media-query output.

## Filesystem boundaries

The server owns two roots: `data/projects` and `exports`. Browser requests supply IDs or slugs, never absolute paths. Names are reduced to safe slugs, resolved against the configured root, and verified to remain beneath it. Project writes use a temporary file followed by an atomic rename.

The Tauri runtime exposes no generic command API. Its capability file grants only the core window defaults, save dialogs, and text-file writes selected through those dialogs. Editor drag-and-drop stays in the WebView by disabling Tauri's native file-drop interception.

On Android, runtime detection adds a 10px top inset at mobile widths so the application toolbar remains below the device edge during APK testing. The normal browser and Windows layouts are unchanged.

## APIs

| Method | Route                        | Purpose                                         |
| ------ | ---------------------------- | ----------------------------------------------- |
| GET    | `/api/projects`              | list saved project metadata                     |
| POST   | `/api/projects`              | validate and create/save a project              |
| GET    | `/api/projects/:id`          | reopen one project                              |
| PUT    | `/api/projects/:id`          | update a matching project                       |
| DELETE | `/api/projects/:id`          | delete one controlled project file              |
| POST   | `/api/assets`                | validate and return one embedded raster asset   |
| POST   | `/api/export/preview`        | render one selected page without writing it     |
| POST   | `/api/export`                | validate and render every page to static HTML   |
| GET    | `/api/export/:slug/download` | download the generated `index.html` entry point |

All payloads have size limits and predictable JSON errors. There is no generic filesystem or command endpoint.

These HTTP routes are not started or bundled as a server process in installed applications. The device adapter implements the equivalent operations locally and performs the same model and image-signature validation.

## Design decisions

- Vanilla modules keep the runtime small and make the component model easy to inspect.
- Full canvas rerenders are acceptable for portfolio-scale documents and keep state/DOM synchronization predictable; event-heavy operations remain delegated at the canvas boundary.
- Uploaded images stay inside project JSON for portable single-file exports. A future asset-folder mode can be added without changing component content contracts.
- Arbitrary JavaScript is never part of the project model. Advanced mode permits filtered CSS only.
- Contact forms require a user-configured external endpoint because the output is static.
