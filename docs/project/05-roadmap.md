# Product Roadmap

This roadmap is now split by work type:

- **Product feature fix**: code/design work we can implement in the app today.
- **Product validation/marketing activity**: user, buyer, content, and positioning work that should not be faked in code.

## Current Slice

The prototype already has a backend-held group commander simulation, selectable scenarios, training/normal/realistic difficulty, formation orders, `framåt`, `halt`, voice/gesture/radio propagation, true-coordinate movement, hex pathing, no-shared-hex movement, visibility memory, effect zones, perceived status, reports, and a tested WebSocket loop.

The product gap is not "more mechanics"; it is a clearer playable training experience: onboarding, guided first run, visible learning objectives, debrief, scenario progression, and language that explains why this is useful.

## Phase 1: Playable Training Shell

**Type:** Product feature fix.

Goal: make the app feel like a game/training tool instead of a debug sandbox.

Included:

- Intro screen with the promise, the current mission, and the basic command grammar.
- Help screen with controls, order flow, difficulty behavior, and gesture training notes.
- Scenario chooser that previews troop, goal, difficulty, and recommended first order.
- Orientation mode that coaches the player through set direction, choose mode, choose formation, `framåt`, move the grpc, and `halt`.
- Minimal always-visible left panel; deeper details remain in hovers and overlays.
- Normal difficulty keeps gesture labels hidden; only training shows gesture text hints.

Exit criteria:

- A new player can start a scenario without developer narration.
- The player knows that mode buttons only choose propagation mode.
- The player knows that `framåt` starts the movement intent.

## Phase 2: Debrief and Learning Loop

**Type:** Product feature fix.

Goal: make each run teach something.

Included:

- A debrief panel with a simple score.
- Metrics for time, distance to goal, order delivery, cohesion waits, blocked effect zones, coverage gaps, and contact pressure.
- Learning points generated from the actual event stream.
- A concise event log that still supports debugging.
- Restart/change-scenario path from the debrief.

Exit criteria:

- The player can name what went well and what to improve.
- A second run has an obvious reason to exist.

## Phase 3: Scenario Progression and Content

**Type:** Product feature fix.

Goal: turn three scenario seeds into a coherent training ladder.

Included:

- Scenario cards grouped by lesson: movement, spacing/risk, group command/perception.
- Recommended starting command and lesson focus per scenario.
- Difficulty-specific help text and scenario expectations.
- Scenario completion/attempt state stored locally for the browser session.
- Content moved toward data-backed definitions when the current TypeScript metadata becomes limiting.

Exit criteria:

- The scenario chooser reads like a curriculum, not a list of test fixtures.
- Training, normal, and realistic feel deliberately different.

## Phase 4: Fidelity Hardening

**Type:** Product feature fix.

Goal: make the group-command model robust enough for repeated play.

Included:

- Stronger command delay, stale-order, and misunderstood-order states.
- More terrain-aware formation movement.
- More tests for 90-degree and 180-degree turns while moving.
- Better waiting/stop explanations without revealing hidden truth outside training mode.
- Injury and buddy-aid loop for the lost-picture scenario.

Exit criteria:

- Long sessions do not produce surprising formation drift.
- AAR can explain missed orders, stale orders, injury discovery, and recovery.

## Phase 5: Expert Review

**Type:** Product validation/marketing activity.

Goal: find out whether the tactical model is credible enough.

Activities:

- Put the prototype in front of infantry instructors, cadets, or people who have trained group command.
- Ask them to critique terminology, formation behavior, order flow, and debrief relevance.
- Capture the top five realism breaks and top five useful training moments.
- Decide which realism complaints improve training value and which are distractions.

Exit criteria:

- At least two credible reviewers say the core training loop is worth refining.
- The next code backlog is driven by observed training value, not developer guesswork.

## Phase 6: Buyer and Positioning Discovery

**Type:** Product validation/marketing activity.

Goal: find the million-dollar path, if one exists.

Activities:

- Interview potential buyers: defense education, cadet organizations, serious-game studios, tactical trainers, and adjacent civilian training markets.
- Test positioning: "command under incomplete perception", "formation and spacing trainer", "after-action tactical decision game", and "low-cost field-drill rehearsal".
- Identify procurement barriers, content requirements, security expectations, and price anchors.
- Build a short demo script and one-page product brief.

Exit criteria:

- A specific buyer segment can name a budget, buyer, use case, and pilot path.
- The product promise is sharper than "a cool tactical sim".

## Phase 7: Pilot Package

**Type:** Mixed.

Product feature fixes:

- Package 5-7 polished scenarios.
- Add stable scenario results and exportable AAR summaries.
- Add instructor-facing observer mode.
- Add deterministic replay links or files.

Product validation/marketing activities:

- Run a structured pilot with 5-10 users.
- Measure replay intent, learning recall, confusion points, and instructor usefulness.
- Convert pilot findings into a commercial roadmap.

Exit criteria:

- At least 3 of 5 test players want another run.
- At least 3 of 5 can name one concrete learning point.
- An instructor or buyer asks what a pilot would cost.
