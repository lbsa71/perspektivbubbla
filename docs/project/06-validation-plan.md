# Validation Plan

## Test Participants

Use at least three participant types:

1. Someone without military background.
2. A soldier with basic experience.
3. A group leader/instructor or equivalent experienced person.

## Post-Play Questions

Ask after each scenario:

1. What did you think happened?
2. What did the AAR show that you missed?
3. Was the limited information understandable?
4. Did it feel relevant or only frustrating?
5. Did you want to replay?
6. Which mechanic taught you the most?
7. What felt too game-like?
8. What was unclear?

## Observations

Watch specifically for:

- Does the player understand last known position?
- Does the player understand cover versus concealment?
- Does the player understand why orders are missed?
- Does the player understand that an injured soldier binds resources?
- Does the player understand risk zone/blocking?
- Does the AAR create an "aha" moment?

## Risks and Mitigations

### Risk: The Game Becomes Too Difficult

Mitigations:

- training mode with overlays
- short scenarios
- clear AAR
- gradual introduction
- pause/instructor mode

### Risk: The Game Becomes Too Much Like RTS

Mitigations:

- no perfect status panel
- limited perception
- orders must reach receivers
- information ages
- AAR instead of real-time omniscience

### Risk: The Game Becomes Tactically Sensitive or Incorrect

Mitigations:

- keep v0.1 at procedure and perception level
- avoid detailed weapon technique
- avoid authoritative tactical verdicts
- make scenario content reviewable
- use instructor mode for locally approved routines

### Risk: AAR Feels Too Judgmental

Mitigations:

- write feedback as observations and consequences
- avoid "you did wrong" where context matters
- show alternatives as discussion material
- focus on situation picture, follow-up, and consequence

## v0.1 Done Definition

v0.1 is done when the following exist:

1. A soldier scenario where the player moves from cover to cover.
2. A two-soldier scenario with facing and risk zone.
3. A group-leader scenario where a soldier is injured and information does not automatically reach the leader.
4. Three information levels: training, normal, realistic.
5. AAR that shows actual situation, perceived situation, and three learning points.
6. Scenario content stored in JSON.
7. The game runs in a browser client backed by an authoritative backend state store.
8. Session history is stored as an event log that can rebuild state and AAR projections.
