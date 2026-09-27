# Local Portfolio Builder

Local Portfolio Builder is a visual, drag-and-drop portfolio website editor available as a browser-based localhost tool and a Tauri desktop/Android application. It stores editable projects on the current device and exports clean, responsive, multi-page static websites that do not need Node.js after export.

## Highlights

- Real HTML5 drag-and-drop insertion and reordering with valid container nesting
- Editable portfolio sections, layout primitives, text, images, actions, navigation, social links, video, and contact forms
- Safe rich text with paragraphs, bold, and emphasis—without arbitrary HTML execution
- Content and visual property inspector with desktop, tablet, and mobile overrides
- Layers navigator, inline text editing, duplicate/delete, undo/redo, and keyboard shortcuts
- Independent website pages with page switching, rename/delete controls, and one generated HTML file per page
- Eight starter templates plus a blank canvas
- Local JSON project saving, portable backup/import, and browser recovery autosave
- PNG/JPEG/WebP asset manager with embedded image export
- Full-screen generated-site preview
- Direct HTML downloads and a generated-file list after export
- Built-in usage guide, canvas zoom, and a common accessibility issue checker
- Phone-friendly editor with bottom-sheet access to blocks, pages, styles, checks, and help
- Deployment assistant for GitHub Pages, Netlify, Vercel, Cloudflare Pages, cPanel, Apache/Nginx, and local hosting
- Installable Windows and Android shells with private, device-local IndexedDB storage and native save dialogs
- No Supabase, account, cloud database, or internet connection required for editing
- Mobile-safe Android toolbar inset plus an in-app developer credit for [ArjunrenVon](https://github.com/ArjunrenVon)

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- A current Chrome, Edge, Firefox, or Safari browser

Native packages additionally require the platform prerequisites described in [DEPLOYMENT.md](DEPLOYMENT.md).

## Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The Vite client proxies its local API to `http://127.0.0.1:3000`.

For a production-style local run:

```bash
npm run build
npm start
```

Then open [http://127.0.0.1:3000](http://127.0.0.1:3000).

The server binds to `127.0.0.1` by default and is not publicly exposed.

## Run as an installed application

The packaged application uses IndexedDB in its private WebView profile instead of the Express API. Start desktop development mode with:

```bash
npm run app:dev
```

Build installers with:

```bash
npm run app:build:windows
npm run app:build:android
```

The Android project only needs to be initialized once with `npm run app:init:android`. Native builds still contain web assets and can be inspected by a determined recipient, so keep credentials and proprietary server logic out of the package.

## Workflow

1. Choose a blank canvas or starter template.
2. Drag blocks from the left panel into the canvas, or click a block for keyboard-friendly insertion.
3. Select an element to edit content and styles in the right panel.
4. Switch Desktop, Tablet, and Mobile modes to add breakpoint overrides.
5. Use **Pages** to add independent pages and **Layers** to inspect each page hierarchy.
6. Run the accessibility check and use canvas zoom where useful.
7. Save the editable project locally or download a portable project backup. Installed apps store explicit saves in device-local IndexedDB.
8. Preview the production renderer.
9. Select **Save / Export** to create `exports/<project-slug>/index.html` plus one `<page-slug>.html` file for each additional page.
10. Download the generated HTML files or choose a platform in the deployment assistant for instructions.

Project JSON and final site HTML are intentionally separate. Opening an exported site does not include or expose the editor.

## Commands

```bash
npm run dev              # Vite editor + local API with watch mode
npm run build            # compile the editor into dist/
npm start                # serve the built editor and API on port 3000
npm run format           # format source and docs
npm run format:check     # verify formatting
npm run lint             # ESLint
npm test                 # unit and integration tests
npm run test:e2e         # Playwright browser tests
npm run audit            # high-severity dependency audit
npm run check            # formatting, lint, tests, and build
npm run app:dev          # run the Tauri desktop application in development
npm run app:build:windows # build a Windows NSIS installer
npm run app:init:android # generate the Android Studio project once
npm run app:build:android # build a signed Android release package
npm run app:build:android:debug # build a debug-signed ARM64 + x86_64 APK for testing
npm run app:collect      # collect underscore-named EXE/APK release assets
```

`npm run app:collect` creates `WebBuilder_AV_Windows.exe` and `WebBuilder_AV_Android.apk` under the ignored `release-artifacts/` directory after both builds succeed.

The first E2E run may require:

```bash
npx playwright install chromium
```

## Keyboard shortcuts

| Shortcut                             | Action                               |
| ------------------------------------ | ------------------------------------ |
| Ctrl/Cmd + S                         | Save project                         |
| Ctrl/Cmd + Z                         | Undo                                 |
| Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y | Redo                                 |
| Ctrl/Cmd + D                         | Duplicate selected element           |
| Delete / Backspace                   | Request deletion of selected element |
| Escape                               | Deselect or close an active dialog   |

## Project structure

```text
src/
  client/                 editor UI and browser modules
    js/components/        block catalog and factories
    js/editor/            canvas rendering and drag/drop
    js/panels/            properties, layers, and pages
    js/state/             serializable state and history
    js/storage/           localhost API and device-local IndexedDB adapters
  server/                 localhost Express server
    routes/               constrained JSON, upload, and export APIs
    services/             project persistence and production renderer
    utils/                filesystem boundary helpers
  shared/                 document model, validation, and templates
src-tauri/                Tauri desktop/Android shell, capabilities, and icons
tests/                    unit, integration, and Playwright tests
data/projects/            editable project JSON (ignored)
exports/                  generated static sites (ignored)
```

## Troubleshooting

- **Port already in use:** stop the process using ports 5173 or 3000, or set a different API `PORT` and update the Vite proxy.
- **Image rejected:** use a real PNG, JPEG, or WebP file under 5 MB. SVG and HTML uploads are rejected.
- **Export fails:** correct any unsafe URL shown by the validation message, then retry.
- **Contact form does not email:** configure a trusted external form endpoint. Static HTML cannot securely send email by itself.
- **Large export:** embedded images make each generated HTML file larger. Resize/compress images before uploading.

See [ARCHITECTURE.md](ARCHITECTURE.md), [SECURITY.md](SECURITY.md), and [DEPLOYMENT.md](DEPLOYMENT.md) for deeper guidance.

## License

MIT © 2026 ArjunrenVon
