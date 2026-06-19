# Jeff The Chef

**Jeff The Chef** is a planned Chrome and Arc extension that acts like a small,
voice-enabled kitchen assistant inside the browser.

Say **“Chef Jeff”**, use a keyboard shortcut, or enter a command and Jeff
appears. He can capture and organise notes, answer quick cooking questions,
suggest useful timings, and create timers while the user keeps working from the
current tab.

> This repository is in early implementation. Local notes, persistent timers,
> the side-panel shell, avatar overlay, and a provider-neutral backend
> foundation are now present; voice and live AI integration remain deliberately
> disabled.

## Project aim

Make common kitchen tasks quick and hands-free without forcing the user to leave
the page they are viewing. Jeff should feel immediate and friendly, while
remaining predictable when he edits data, starts timers, or uses an AI service.

The product should:

- Reduce friction when recording recipe ideas, substitutions, and shopping
  reminders.
- Provide brief, useful answers without becoming a full recipe application.
- Make cooking timers easy to create and manage by voice or text.
- Keep the user in control of microphone access, stored information, and AI
  requests.
- Work consistently in current desktop versions of Chrome and Arc.

## Expected experience

1. The user installs Jeff and completes a clear microphone/privacy introduction.
2. They enable wake-word listening or retain text and keyboard-only controls.
3. The user says “Chef Jeff,” clicks the extension, or uses its shortcut.
4. A lightweight chef avatar appears and indicates that Jeff is listening.
5. The user gives a command, such as:
   - “Make a note that the sourdough needs less water next time.”
   - “Change my sourdough note to say 20 grams less water.”
   - “Delete my shopping-list note.”
   - “How long should salmon rest after cooking?”
   - “Set a twelve-minute timer for the potatoes.”
6. Jeff confirms the result, asks for clarification when needed, and requires
   confirmation before destructive actions.

## Planned features

### First release

- Summon Jeff by wake word, extension button, keyboard shortcut, or typed
  command.
- Create, view, edit, search, and delete local notes.
- Create, list, cancel, and receive notifications for multiple labelled timers.
- Ask concise cooking and food-preparation questions through a secure AI
  gateway.
- Show a small on-page avatar for status and a side panel for longer
  interactions.
- Provide visible microphone and listening states plus an immediate mute
  control.

### Later possibilities

- Optional note sync between devices.
- Recipe-aware collections and shopping lists.
- More expressive avatar animation and optional spoken replies.
- Personal cooking preferences and dietary context.
- Context-aware help for a page, only after explicit permission.

## Proposed technology stack

| Area                    | Proposed choice                                           |
| ----------------------- | --------------------------------------------------------- |
| Extension platform      | Chrome Manifest V3                                        |
| Language                | TypeScript                                                |
| UI                      | React, Vite, Tailwind CSS                                 |
| Browser UI              | Chrome Side Panel API and a content-script avatar overlay |
| Extension orchestration | Manifest V3 service worker and runtime messaging          |
| Wake word               | Bundled local detector running in an offscreen document   |
| Local data              | `chrome.storage.local`                                    |
| Timers                  | `chrome.alarms` and browser notifications                 |
| AI integration          | Provider-agnostic TypeScript backend proxy                |
| Testing                 | Vitest and Playwright                                     |
| Runtime and packages    | Bun                                                       |
| Containers              | Docker and Docker Compose                                 |

The AI provider should remain replaceable. Production credentials must live on
the backend and must never be packaged in the extension.

## Privacy principles

- Wake-word listening is opt-in and can be disabled at any time.
- A persistent visual indicator shows when the microphone is active.
- Wake-word detection happens locally using packaged code and model assets.
- Continuous background audio is never sent to the AI backend.
- Audio is captured for transcription only after Jeff is activated.
- Notes remain on the device by default.
- Jeff does not read page content unless a later feature requests separate,
  explicit consent.
- AI requests include only the text and limited context needed to answer the
  current request.

## Proposed project structure

The implementation is expected to grow into this structure:

```text
jeff-the-chef/
├── README.md
├── docs/
│   └── PROJECT_PLAN.md
├── extension/
│   ├── manifest.json
│   ├── src/
│   │   ├── background/
│   │   ├── content/
│   │   ├── offscreen/
│   │   ├── side-panel/
│   │   └── shared/
│   └── public/
└── backend/
    └── src/
```

The first implementation foundation now exists alongside the documentation.

## Development

Requires Bun 1.3 or newer. Docker Desktop is optional for local container
workflows.

```bash
bun install
bun run typecheck
bun run test
bun run build
```

Load `extension/dist` as an unpacked extension in Chrome or Arc after building.
Use `bun run dev:extension` for watch builds and `bun run dev:backend` to run
the local backend on port 8787.

### Styled launcher and Docker

The launcher installs dependencies, checks the project, builds both workspaces,
starts the containers, and waits for their health checks:

```bash
./start.sh
```

This also works with the existing `start_lab=./start.sh` alias. Useful options
are `--no-docker`, `--skip-checks`, and `--skip-install`.

The Docker services expose:

- Extension web preview: `http://localhost:4173/side-panel.html`
- Backend health: `http://localhost:8787/health`

The preview demonstrates layout only because normal web pages do not provide
Chrome extension APIs. Load `extension/dist` unpacked for working notes, timers,
alarms, and the avatar. Stop containers with `docker compose down` or the
existing `stop_lab` alias.

Architecture and privacy flows are illustrated in
[docs/DIAGRAMS.md](docs/DIAGRAMS.md). The educational encrypted-notes workflow
is documented in [docs/notes/README.md](docs/notes/README.md).

## Reference project

The neighbouring [`yt-speed-extension`](../yt-speed-extension/README.md) project
provides a useful starting reference for:

- Manifest V3 configuration.
- An `extension/` directory that can be loaded unpacked in Chrome or Arc.
- Communication between the popup/content script and service worker.
- Local extension assets and icons.
- Clear installation and development instructions.

Jeff will need a different UI and permission model because it introduces
microphone access, an on-page avatar, persistent timers, and a remote AI
service. Its implementation should reuse the reference project’s simple
separation of concerns rather than copying its YouTube-specific logic.

## Roadmap

1. **Foundation:** Create the extension shell, side panel, avatar overlay,
   shared message types, and local settings.
2. **Local tools:** Implement note management, typed commands, timers, and
   notifications.
3. **Voice:** Add microphone onboarding, local “Chef Jeff” detection,
   transcription, and voice-command handling.
4. **AI:** Connect a secure provider-agnostic backend and validate all proposed
   actions locally.
5. **Hardening:** Add accessibility, automated tests, permission review, privacy
   documentation, and Chrome Web Store preparation.

See [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md) for the complete product and
technical plan.
