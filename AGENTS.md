# AGENTS.md

## Project

Jeff The Chef is a planned Manifest V3 browser extension: a small, voice-enabled
kitchen assistant for Chrome and Arc. It will manage local notes and timers,
answer concise cooking questions through a backend, and provide optional local
wake-word activation.

The repository is in early implementation. Read `README.md`,
`docs/PROJECT_PLAN.md`, and `docs/DIAGRAMS.md` before making architectural or
product decisions. Keep those documents accurate as implementation choices
become concrete.

## Product principles

- Keep local tools useful without a network connection.
- Make microphone, wake-word, and command-capture states obvious to the user.
- Require explicit confirmation for destructive or ambiguous actions.
- Treat AI output as untrusted data; validate it before displaying or acting on
  it.
- Keep notes local unless the user explicitly opts into a future sync feature.
- Do not read page content or broaden permissions without a documented product
  requirement and explicit user consent.
- Preserve a complete text and keyboard path for every core workflow.

## Planned architecture

Keep these responsibilities separate:

- `extension/src/background/`: runtime routing, alarms, notifications, state
  coordination, and backend requests.
- `extension/src/offscreen/`: microphone lifecycle, wake-word detection, and
  post-activation command audio capture only.
- `extension/src/content/`: isolated avatar overlay; never scrape page content.
- `extension/src/side-panel/`: onboarding, conversation UI, notes, timers, and
  settings.
- `extension/src/shared/`: schemas, discriminated message types, repositories,
  validation, and shared errors.
- `backend/src/`: provider-neutral transcription and assistant endpoints,
  authentication/rate limiting, redacted logging, and provider adapters.

Business rules belong in shared services or the service worker, not in UI or
offscreen components. The extension must remain independent of any single AI
provider.

## Technical direction

- Use Bun for dependency management, workspace scripts, and the backend runtime.
  Do not add npm or pnpm lockfiles.
- Use TypeScript with strict type checking.
- Use React, Vite, and Tailwind CSS for extension UI.
- Target Chrome Manifest V3 and document the minimum supported Chrome version.
- Use runtime schemas at every trust boundary, including extension messages,
  storage reads, and backend responses.
- Use `chrome.storage.local` for notes, settings, and timer records.
- Use `chrome.alarms` for timer wake-ups, but derive state from persisted end
  times and recreate missing alarms during reconciliation.
- Never rely on a continuously running service worker or JavaScript countdown.
- Bundle all executable extension code, WebAssembly, models, and assets. Do not
  load remote code.
- Never place provider keys or reusable backend secrets in the extension.

## Data and privacy invariants

- Wake-word listening is opt-in and processed locally.
- Pre-activation audio must never be sent to the backend.
- Command audio is captured only after activation and retained only as long as
  transcription requires.
- Transcript, note, and question content must not appear in production logs.
- Render user and model text as text, not trusted HTML.
- Validate runtime message senders and reject unknown action types and fields.
- Keep permissions and host access minimal; prefer optional host permissions
  when the interaction design allows them.

## Implementation conventions

- Prefer small modules with explicit inputs and outputs over shared mutable
  state.
- Model commands as discriminated unions and exhaustively handle every variant.
- Store timestamps as ISO 8601 strings and calculate elapsed time from the
  current clock.
- Make storage updates resilient to partial failures and preserve original data
  when edits fail.
- Use stable IDs for notes and timers; use timer IDs in alarm names.
- Return typed, user-safe errors for offline, timeout, rate-limit, permission,
  and invalid-response failures.
- Avoid dependencies for behaviour that is simple, security-sensitive, or easy
  to implement clearly in the project.

## Testing expectations

Add tests with each behaviour change. The intended stack is Vitest for unit and
integration tests and Playwright for browser acceptance tests.

At minimum, cover:

- Command classification, duration parsing, and schema validation.
- Note matching, ambiguity, edits, deletion confirmation, and failure recovery.
- Concurrent timers, cancellation, delayed alarms, and restart reconciliation.
- Microphone enable, mute, revoke, timeout, and text fallback paths.
- Service-worker, offscreen-document, content-script, and side-panel messaging.
- Malformed or hostile runtime messages and backend responses.
- Offline, timeout, quota, and provider failures without breaking local tools.
- Keyboard navigation, visible status text, and reduced-motion behaviour.

Run `bun run check` and `bun run build` before handing off implementation
changes. Run relevant browser tests when available. Do not claim checks passed
when the required scripts, Docker daemon, or browser environment are absent.

## Change discipline

- Keep changes scoped to the request and preserve unrelated user work.
- Update documentation when behaviour, permissions, data handling, APIs, or
  supported browsers change.
- Flag decisions that affect privacy, permissions, backend cost, or Chrome Web
  Store review before silently locking them into implementation.
- Do not commit generated build output, credentials, recordings, local models
  with unclear redistribution rights, or environment files containing secrets.
