# Jeff The Chef — Project Plan

## 1. Project overview

Jeff The Chef is a desktop Chromium extension that offers a compact cooking
assistant from any browser tab. It combines deterministic local tools—notes and
timers—with AI-assisted answers. Users interact by saying “Chef Jeff,” typing a
command, clicking the extension action, or using a keyboard shortcut.

Jeff is not intended to replace a recipe manager, general voice assistant, or
medical/nutritional professional. The initial product should do a small number
of kitchen tasks reliably, make its listening state obvious, and confirm
consequential actions.

## 2. Product goals

### Primary goals

- Let users capture information without interrupting cooking or browsing.
- Make note and timer operations fast through both voice and text.
- Provide concise answers to ordinary cooking questions.
- Give the character a friendly presence without letting animation dominate the
  workflow.
- Build trust through local storage, transparent permissions, and confirmation
  rules.

### Non-goals for the first release

- Full recipe import, meal planning, calorie tracking, or grocery delivery.
- User accounts or cross-device synchronisation.
- Reading the active webpage automatically.
- A photorealistic or 3D avatar.
- Open-ended control of browser tabs or arbitrary websites.
- Medical, allergy, or food-safety guarantees from an AI response.

## 3. Target users and situations

The initial audience is a desktop Chrome or Arc user who browses recipes,
watches cooking content, or works from a laptop in the kitchen.

Representative situations include:

- Hands are busy, so the user records a quick observation by voice.
- A recipe gives no timing and the user wants a reasonable suggestion.
- Several dishes need independent labelled timers.
- The user wants a short substitution or technique answer without opening
  another tab.
- The user returns later to find or update a previous note.

## 4. Experience design

### Interaction surfaces

**Avatar overlay:** A small 2D Jeff appears on the active page when summoned. It
communicates a limited set of states: idle, listening, thinking, confirming,
complete, and error. The overlay must not block important page controls and can
be dismissed immediately.

**Side panel:** Notes, conversation history for the current session, active
timers, settings, and longer answers live in the browser side panel. This
provides more room than a popup and can remain open while the user browses.

**Fallback controls:** Clicking the extension action and using a configurable
keyboard shortcut must always work when wake-word listening is off or
unavailable.

### Core user journeys

#### Onboarding

1. Explain what Jeff can do and that wake-word listening is optional.
2. Request microphone permission only when the user enables voice.
3. Explain that wake-word audio is processed locally and command audio begins
   after activation.
4. Let the user test “Chef Jeff,” review the visible listening indicator, and
   find the mute control.
5. Offer text and shortcut controls if permission is denied.

#### Create a note

1. User summons Jeff and says or types the note.
2. Jeff extracts a proposed title and body.
3. Jeff saves the note locally and confirms its title.
4. If the intended content is unclear, Jeff presents the draft before saving.

#### Edit or delete a note

1. Jeff searches local notes by title and content.
2. If one clear match exists, Jeff previews the proposed edit or deletion.
3. Deletion always requires explicit confirmation.
4. Multiple matches produce a short selection list; Jeff never guesses which
   note to modify.

#### Ask a question

1. Jeff sends the transcribed or typed question to the backend.
2. The backend returns a concise response and, when appropriate, structured
   suggested actions.
3. Suggestions are shown separately from facts and are not executed
   automatically.
4. High-risk food safety, allergy, or health questions include cautious language
   and do not claim certainty.

#### Create a timer

1. Jeff recognises an explicit duration or obtains an AI timing suggestion.
2. Suggested durations require confirmation; directly requested durations do
   not.
3. The extension creates a labelled browser alarm and stores its timer record.
4. Jeff shows remaining time in the side panel and produces a notification when
   complete.

## 5. Functional requirements

### Summoning and voice

- Support the phrase “Chef Jeff” as the initial wake word.
- Run wake-word detection locally from bundled extension assets.
- Keep voice opt-in and remember the user’s enabled/disabled choice.
- Display a persistent microphone indicator while capture is active.
- Stop capture immediately when muted or disabled.
- Begin speech transcription only after wake-word activation.
- End command capture on a short silence timeout, explicit cancel, or maximum
  duration.
- Fall back to text when the microphone, local model, or transcription provider
  fails.

### Notes

- Create, list, view, search, edit, and delete notes.
- Persist notes in `chrome.storage.local`.
- Match notes case-insensitively by title and body.
- Require confirmation for deletion and ambiguous edits.
- Preserve the original note if an update fails.
- Keep note operations usable without a network connection.

### Timers

- Create multiple concurrent timers with human-readable labels.
- List active and recently completed timers.
- Cancel timers individually.
- Restore timer state after the service worker restarts or the browser reopens.
- Derive remaining time from the stored end time rather than a continuously
  running JavaScript counter.
- Notify the user when a timer completes, subject to browser notification
  settings.

### AI answers

- Route requests through a separately deployed backend proxy.
- Keep the extension independent from any single model provider.
- Return short answers by default, with an option to expand.
- Treat model-proposed actions as untrusted input and validate them against a
  strict schema.
- Never allow the model to delete data or execute an ambiguous action without
  local confirmation.
- Provide clear offline, timeout, rate-limit, and service-error messages.

## 6. Proposed architecture

### Extension components

| Component                  | Responsibility                                                                   |
| -------------------------- | -------------------------------------------------------------------------------- |
| Manifest V3 service worker | Message routing, alarms, notifications, state coordination, and backend requests |
| Offscreen document         | Microphone stream, local wake-word detector, and command audio capture           |
| Content script             | Inject and control the avatar overlay on permitted pages                         |
| Side panel                 | Conversation UI, note manager, timer list, onboarding, and settings              |
| Shared module              | Typed messages, schemas, storage repositories, validation, and error types       |

The offscreen document communicates through `chrome.runtime` messaging. It
should contain only media lifecycle and detection logic; business rules remain
in shared modules and the service worker.

### Backend components

The initial backend can be a small TypeScript HTTP service suitable for a
serverless or container deployment. It should expose provider-neutral
application endpoints and keep provider keys in environment variables.

The initial local and container runtime is Bun. Docker Compose provides a
repeatable backend service and static extension preview; the unpacked extension
build remains the authoritative browser test target.

Responsibilities:

- Authenticate or rate-limit extension installations using a replaceable
  mechanism.
- Transcribe post-activation audio when cloud transcription is enabled.
- Send cooking questions to the configured AI provider.
- Convert provider responses into the application’s structured response schema.
- Apply timeouts, request-size limits, logging redaction, and abuse controls.
- Never persist audio or question content by default.

### Data flow

1. The offscreen document detects “Chef Jeff” locally.
2. It informs the service worker and starts command capture.
3. The service worker tells the active content script to show Jeff in the
   listening state.
4. Transcribed text is classified as a local command or an AI question.
5. Local commands execute through validated note/timer services; questions go
   through the backend.
6. The service worker returns a typed result to the side panel and avatar.
7. The UI shows confirmation, clarification, completion, or error state.

## 7. Data and interface contracts

These types describe the intended contracts; they are not implemented yet.

```ts
type Note = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

type TimerStatus = 'active' | 'completed' | 'cancelled';

type ChefTimer = {
  id: string;
  label: string;
  durationSeconds: number;
  startedAt: string;
  endsAt: string;
  status: TimerStatus;
};

type Settings = {
  wakeWordEnabled: boolean;
  microphoneEnabled: boolean;
  notificationsEnabled: boolean;
  spokenRepliesEnabled: boolean;
};
```

### Supported action names

- `note.create`
- `note.edit`
- `note.delete`
- `note.list`
- `note.search`
- `timer.create`
- `timer.cancel`
- `timer.list`
- `assistant.answer`
- `command.unknown`

Each action should use a discriminated TypeScript union and runtime schema
validation. Unknown fields are ignored or rejected; they are never interpreted
as executable instructions.

### Proposed backend API

`POST /v1/assistant`

Request:

```json
{
  "input": "How long should salmon rest?",
  "locale": "en-GB",
  "context": {
    "activeTimerLabels": ["potatoes"]
  }
}
```

Response:

```json
{
  "answer": "Let it rest for about 3–5 minutes.",
  "suggestedActions": [],
  "requestId": "request-id"
}
```

`POST /v1/transcriptions` accepts command audio recorded only after activation
and returns transcript text plus a confidence value. The exact provider wire
format stays behind the backend adapter.

## 8. Permissions and security

Likely extension permissions are:

- `storage` for notes and settings.
- `alarms` and `notifications` for timers.
- `offscreen` for microphone/media processing in Manifest V3.
- `sidePanel` for the persistent main UI.
- `scripting` and host access for the on-page avatar.
- `commands` configuration for the summon shortcut.

Host access should be explained clearly during onboarding and in store
disclosures. The content script should inject only Jeff’s isolated UI and must
not collect page text. If Chrome permits an appropriate optional-host-permission
flow for the final interaction design, prefer that over granting every site at
installation.

Security requirements:

- Do not place provider secrets in the extension bundle or local storage.
- Bundle executable JavaScript, WebAssembly, and wake-word assets with the
  extension to comply with Manifest V3 restrictions.
- Use a restrictive content security policy with no inline or remotely hosted
  code.
- Validate every runtime message and backend response.
- Escape user and model text before rendering it.
- Limit backend origins through explicit host permissions.
- Redact transcripts and note content from production logs.

## 9. Privacy and accessibility

### Privacy

- Voice is disabled until the user opts in.
- A visible state must distinguish wake-word listening from active command
  capture.
- Continuous wake-word audio remains on-device and is discarded immediately.
- Command audio is retained only in memory long enough to transcribe it.
- Notes are local by default and are not silently included in AI prompts.
- Settings provide one-step mute, voice disable, local-data export, and
  local-data deletion.

### Accessibility

- All commands must have a text equivalent.
- The avatar and side panel must be keyboard navigable.
- Status changes use visible text as well as animation and colour.
- Respect reduced-motion preferences.
- Use appropriate focus management, labels, live regions, and contrast.
- Notifications and confirmations must not rely on sound alone.

## 10. Failure modes

| Failure                             | Required behaviour                                                            |
| ----------------------------------- | ----------------------------------------------------------------------------- |
| Microphone permission denied        | Continue in text mode and show how to re-enable permission                    |
| Wake-word model unavailable         | Disable wake-word mode and retain click/shortcut activation                   |
| Speech is unclear                   | Show the transcript draft and ask the user to repeat or edit it               |
| Multiple notes match                | Present choices; do not modify any note yet                                   |
| Backend is offline                  | Keep notes and explicit timers working locally                                |
| AI returns an invalid action        | Ignore it, retain the answer when safe, and record a non-sensitive diagnostic |
| Browser/service worker restarts     | Rehydrate notes, settings, and timers from extension storage and alarms       |
| Notification permission unavailable | Keep timer state visible and explain the notification limitation              |
| Unsupported or protected page       | Open the side panel without attempting an avatar overlay                      |

## 11. Delivery roadmap

### Phase 1 — Foundation

- Create the Manifest V3 TypeScript project and development scripts.
- Build the side panel and minimal avatar state machine.
- Add typed runtime messaging and storage repositories.
- Add onboarding, settings, and keyboard summon controls.

### Phase 2 — Local assistant tools

- Implement typed-command parsing for note CRUD.
- Implement multiple persistent timers and notifications.
- Add confirmation and disambiguation flows.
- Cover local features with unit and browser tests.

### Phase 3 — Voice

- Add microphone permission onboarding and the offscreen media lifecycle.
- Integrate a bundled “Chef Jeff” wake-word detector.
- Add post-activation transcription and transcript correction.
- Measure false activations, missed activations, latency, and resource use.

### Phase 4 — AI

- Create the provider-agnostic backend and adapters.
- Add concise cooking answers and timing suggestions.
- Validate structured actions locally before presenting them.
- Add rate limits, privacy-safe diagnostics, and failure handling.

### Phase 5 — Release hardening

- Complete accessibility and permission reviews.
- Test supported Chrome and Arc versions on macOS, Windows, and Linux where
  available.
- Produce store assets, privacy disclosures, and support documentation.
- Run a small opt-in beta before public submission.

## 12. Test strategy

### Unit tests

- Command classification and duration parsing.
- Note matching, creation, editing, and deletion rules.
- Timer end-time calculations and state transitions.
- Runtime message and backend response validation.
- Confirmation rules for destructive and model-suggested actions.

### Integration tests

- Service worker, storage, alarm, offscreen, and UI message flows.
- Restart/recovery of multiple active timers.
- Backend success, timeout, invalid response, and rate-limit behaviour.
- Microphone enable, mute, revoke, and fallback paths.

### Browser acceptance tests

- Summon Jeff from a normal page by wake word, click, text, and shortcut.
- Complete note create/view/edit/delete journeys.
- Resolve multiple matching notes without altering the wrong record.
- Create, list, cancel, and complete concurrent timers.
- Ask a question and distinguish an answer from a suggested action.
- Continue using notes and explicit timers while offline.
- Use all core features with keyboard navigation and reduced motion.
- Handle protected/unsupported pages without breaking the active tab.

## 13. Success criteria

The first release is ready when:

- All note CRUD operations work locally and survive browser restarts.
- Multiple labelled timers survive service-worker suspension and notify
  reliably.
- Wake-word mode is opt-in, visibly indicated, instantly mutable, and sends no
  pre-activation audio to the backend.
- Users can complete every core workflow without voice.
- Destructive and ambiguous operations cannot execute without confirmation.
- AI failures never prevent local notes or explicit timers from working.
- Provider credentials are absent from the extension package.
- Automated tests cover the core success and failure paths.
- Permission and privacy explanations accurately describe shipped behaviour.

## 14. Open risks to validate early

- Wake-word accuracy and CPU/battery usage across different microphones and
  accents.
- Browser permission and lifecycle behaviour for persistent user-media capture.
- The usability and store-review impact of broad host access for a universal
  page overlay.
- Differences between Chrome and Arc side-panel or extension UI behaviour.
- Cloud transcription cost, latency, and privacy expectations.

These are feasibility and product-quality risks, not reasons to weaken the
intended experience. Phase 1 should include small technical spikes before the
final voice and overlay architecture is locked.
