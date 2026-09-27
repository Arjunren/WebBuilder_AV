# Security

## Philosophy and scope

Local Portfolio Builder is local-first software with no accounts or cloud database. It runs through either a loopback Express service or an installed Tauri WebView. Security controls focus on the actual trust boundaries: untrusted project content, browser-to-server requests, file imports, filesystem writes, URLs, native capabilities, and generated HTML.

Installed-app projects live in device-local IndexedDB. This protects data from unrelated websites, but it is not encryption against another process or administrator with access to the same device account. Use portable backups and device-level disk encryption for sensitive work.

## Localhost and HTTP protections

- The server binds to `127.0.0.1` by default.
- CORS is not enabled; browser requests remain same-origin.
- Host filtering rejects DNS-rebinding requests that do not address loopback/localhost.
- State-changing requests with an `Origin` header are accepted only from configured local editor origins.
- Helmet sets security headers and a restrictive Content Security Policy.
- JSON requests default to a 2 MB limit.
- Stack traces are not returned to clients.
- No environment variables or secrets are bundled into browser code.

The installed app does not start the HTTP API. Its restrictive CSP permits only bundled content, local data/blob resources needed for images and previews, and explicit HTTPS actions. Tauri capabilities allow native save dialogs and writes to user-selected text files; no shell, arbitrary command, or unrestricted read capability is enabled.

Do not set `HOST=0.0.0.0` on an untrusted network. If remote access is required, place the application behind an authenticated, TLS-terminating reverse proxy and reassess the threat model.

## XSS and content handling

- The project model stores typed content, not executable HTML or JavaScript.
- Editor text is written with `textContent`.
- Export text and attributes are HTML-escaped.
- URL fields reject unsafe protocols such as `javascript:`.
- Image Data URLs are limited to PNG, JPEG, and WebP.
- Custom CSS is length-limited and rejects imports, script-breaking markup, `expression()`, and JavaScript URLs.
- Exported mobile navigation uses fixed application code; user scripts are never emitted.

## Filesystem protections

- Browser input cannot select an output directory.
- Project IDs and export names are sanitized, resolved, and verified below application-controlled roots.
- Dotfiles are not served.
- There is no arbitrary read/write route.
- The server never executes a project or exported file.
- No shell command is constructed from browser input.
- Installed-app exports use the operating-system save picker; the app cannot silently choose an arbitrary output path.

## Upload protections

- Only one image per request is accepted.
- The default maximum size is 5 MB.
- MIME allowlisting is combined with PNG/JPEG/WebP magic-byte validation.
- SVG, HTML, scripts, and other active file types are rejected.
- Original filenames are sanitized and used only as project metadata.

Raster images are embedded unchanged. For public production use, add image decoding/re-encoding and decompression-bomb protection with a maintained image processor.

## Project validation

API envelopes are schema-validated with Zod. Model validation checks version, project name, page IDs and slugs, section arrays, component types, duplicate IDs, supported URLs, and component count/nesting limits. Imported project backups pass the same model validation before entering editor state. The production renderer additionally allowlists CSS properties and filters values.

The accessibility report is a focused authoring aid, not a security boundary or certification. It checks common structural issues such as missing H1 headings, heading-level jumps, empty image alternatives, and unlabeled links/buttons.

## Dependency security

- Dependency versions are pinned by `package-lock.json`.
- CI runs `npm audit --audit-level=high`.
- Dependabot checks npm dependencies weekly.
- Runtime dependencies are intentionally limited to Express, Helmet, Multer, Zod, and the Tauri dialog/filesystem APIs.

Run locally:

```bash
npm audit --audit-level=high
npm outdated
```

## Logging

The server logs generic operational errors during local development. It does not log project payloads, embedded image contents, environment variables, or secrets. Client responses receive generic server failures.

## Vulnerability reporting

Open a private GitHub security advisory for the repository owner. Include the affected version, reproduction steps, impact, and a minimal proof of concept. Do not include real personal portfolio data.

## Production considerations

This release is designed for a trusted user on one personal device. Before making it multi-user or publicly reachable, add authentication, per-user authorization, CSRF protections, rate limiting, isolated storage, audit logging, stronger image processing, and a complete deployment-specific CSP review.

An EXE or APK conceals source better than distributing a repository, but client-side JavaScript, Rust binaries, and bundled assets can still be inspected or reverse engineered. Never embed API secrets, signing credentials, private algorithms, or database administrator keys in a client package. Keep sensitive logic behind an authenticated server if it is added later.
