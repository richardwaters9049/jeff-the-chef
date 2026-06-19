<!-- Summarises the intended experience, system boundaries, AI privacy flow, and timer lifecycle. -->

# Jeff The Chef diagrams

These diagrams describe the intended first-release behaviour. They should be
updated whenever implementation changes make them inaccurate.

## User experience

```mermaid
flowchart TD
    A["User is browsing or cooking"] --> B{"How is Jeff summoned?"}
    B -->|"Chef Jeff"| C["Local wake-word detector activates"]
    B -->|"Extension button"| D["Open Jeff and the side panel"]
    B -->|"Keyboard shortcut"| D
    B -->|"Typed command"| E["Submit text from the side panel"]
    C --> F["Capture command audio with a visible indicator"]
    F --> G["Transcribe post-activation audio"]
    G --> H["Classify validated command"]
    D --> H
    E --> H
    H -->|"Note"| I["Run local note operation"]
    H -->|"Explicit timer"| J["Run local timer operation"]
    H -->|"Cooking question"| K["Ask the protected backend"]
    H -->|"Ambiguous or destructive"| L["Ask for clarification or confirmation"]
    I --> M["Show a clear result"]
    J --> M
    K --> M
    L --> H
```

## System architecture

```mermaid
flowchart LR
    subgraph Browser["Chrome or Arc extension"]
        SP["React side panel"]
        CS["Isolated avatar overlay"]
        SW["Manifest V3 service worker"]
        OD["Offscreen media document"]
        ST[("chrome.storage.local")]
        AL["chrome.alarms and notifications"]

        SP <-->|"Validated messages"| SW
        CS <-->|"Status messages"| SW
        OD <-->|"Media lifecycle messages"| SW
        SW <--> ST
        SW <--> AL
    end

    SW -->|"Minimum required text or post-activation audio"| API["Jeff backend"]
    API --> RL["Authentication and rate limits"]
    RL --> PA["Replaceable AI provider adapter"]
    PA --> API
    API -->|"Schema-validated response"| SW
```

## AI personalisation and training boundary

Jeff does not train a model on user notes, transcripts, or questions. A future
personalisation feature may use explicitly selected preferences as request
context, but only after separate consent.

```mermaid
flowchart TD
    U["User command or question"] --> M["Send only the minimum required data"]
    N[("Local notes")] -. "Not included by default" .-> X["Blocked privacy boundary"]
    T["Wake-word audio"] -. "Never leaves the device" .-> X
    M --> B["Backend with redacted logs"]
    B --> P["AI provider request"]
    P --> R["Answer or suggested action"]
    R --> V["Local schema validation"]
    V --> C{"Action needs confirmation?"}
    C -->|"Yes"| U2["User confirms or rejects"]
    C -->|"No"| O["Display or execute safe local action"]
    U2 --> O
    P -. "No project-controlled training pipeline" .-> NT["User data is not training data"]
```

## Persistent timer lifecycle

```mermaid
stateDiagram-v2
    [*] --> Active: Create record and browser alarm
    Active --> Active: Reconcile from stored endsAt
    Active --> Completed: Alarm fires or overdue timer is discovered
    Active --> Cancelled: User confirms cancellation
    Completed --> [*]: Retention window expires
    Cancelled --> [*]: Retention window expires

    note right of Active
      Remaining time comes from endsAt.
      It does not rely on a running JavaScript counter.
    end note
```

## Note action safety

```mermaid
sequenceDiagram
    actor User
    participant UI as Side panel or voice UI
    participant Worker as Service worker
    participant Store as Local note store

    User->>UI: Edit or delete a named note
    UI->>Worker: Send validated action
    Worker->>Store: Search title and body
    Store-->>Worker: Zero, one, or several matches
    alt One safe edit match
        Worker-->>UI: Preview proposed edit
    else Delete or ambiguous match
        Worker-->>UI: Require confirmation or selection
    end
    User->>UI: Confirm or cancel
    UI->>Worker: Confirm with stable note ID
    Worker->>Store: Apply atomic update
    Store-->>UI: Updated note or typed failure
```
