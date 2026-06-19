<!-- Records the real Jeff The Chef project work completed on 19 June 2026. -->

# Project changes — 19 June 2026

## Repository foundation

- Added an npm workspace for the browser extension and backend.
- Added shared TypeScript, formatting, build, type-check, and test
  configuration.
- Added durable agent guidance in the root `AGENTS.md` file.

## Extension

- Created a Manifest V3 extension shell for Chrome and compatible Chromium
  browsers.
- Added a React and Tailwind CSS side panel.
- Implemented local note creation, listing, and confirmed deletion.
- Implemented labelled timers backed by persisted end times, Chrome alarms, and
  notifications.
- Added timer reconciliation after service-worker or browser restarts.
- Added a keyboard shortcut and action-button flow with an isolated avatar
  overlay and protected-page fallback.
- Reserved an offscreen document without enabling microphone access.

## Backend

- Created a Fastify TypeScript service with a health endpoint.
- Added a provider-neutral assistant interface.
- Added strict request and response validation and safe unavailable-provider
  behaviour.
- Kept local extension tools independent from backend availability.

## Documentation and learning work

- Added user experience, system architecture, AI privacy, timer lifecycle, and
  note safety diagrams.
- Documented that user notes, questions, and wake-word audio are not model
  training data.
- Added an AES-256-GCM notes encryption and decryption exercise.
- Added harmless test notes plus encrypted copies for round-trip verification.

## Still to do

- Complete note editing and search.
- Add onboarding and settings.
- Perform microphone and wake-word feasibility spikes before enabling voice.
- Choose and secure an AI provider plus an installation authentication and rate
  limiting design.
- Add Playwright browser acceptance tests and final extension artwork.

## Bun and Docker follow-up

- Replaced npm workspace commands and the npm lockfile with Bun and `bun.lock`.
- Added production multi-stage Dockerfiles for the backend and extension build.
- Added Docker Compose services with backend and preview health checks.
- Added an animated `start.sh` launcher compatible with the existing
  `start_lab=./start.sh` alias.
- Added Bun and Docker commands to the README and agent guidance.
