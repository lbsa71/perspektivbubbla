# Perspektivbubbla

Perspektivbubbla is a browser-based tactical procedure and decision simulator built around limited perception. The player acts as a soldier or small-unit leader on a hex map, where the central challenge is not perfect combat optimization but keeping a useful mental picture under uncertainty.

The v0.1 goal is to prove one question:

> Is it interesting and educational to act when you only see, hear, remember, and misunderstand what your role could reasonably perceive?

## Current Status

This repository has a runnable Phase 1 implementation slice. The former design-bible README has been split into focused planning artifacts under [docs/project](docs/project).

## Run Phase 1

Requirements:

- Node.js 24+

Commands:

```sh
npm test
npm start
```

Then open [http://127.0.0.1:5173](http://127.0.0.1:5173).

For active development, run the watched backend plus Vite client:

```sh
npm install
npm run dev
```

Vite serves the client at [http://127.0.0.1:5173](http://127.0.0.1:5173) and proxies `/api` and `/ws` to the Node backend on port `5174`.

## Planning Artifacts

- [Product brief](docs/project/01-product-brief.md) - concept, goals, non-goals, core loop, and success criteria.
- [Game design](docs/project/02-game-design.md) - perception bubble, hex model, movement, communication, injury abstraction, AAR, and difficulty levels.
- [Scenarios](docs/project/03-scenarios.md) - the three v0.1 scenarios and what each one validates.
- [Technical plan](docs/project/04-technical-plan.md) - recommended stack, architecture boundaries, modules, and starter TypeScript model.
- [Roadmap](docs/project/05-roadmap.md) - incremental implementation phases and backlog priorities.
- [Validation plan](docs/project/06-validation-plan.md) - playtest plan, risks, mitigations, and v0.1 done definition.

## Research Notes

- [Swedish army formations, signs, and procedures](docs/research/swedish-army-formations-and-procedures.md) - source-backed notes for igelkott, samling runt chefen, stridskolonn, stridslinje, blixtlås, and växelvis framåt/bakåt.

Agent-facing development rules live in [.agents/rules.md](.agents/rules.md).

## v0.1 Scope

The first version should stay deliberately small:

- One soldier scenario for moving from cover/concealment to cover/concealment.
- One two-soldier scenario for facing, risk zones, and friendly blocking.
- One small leader scenario where an injured soldier creates a degraded picture of the situation.
- Three information modes: training, normal, and realistic.
- A short after-action review that compares world state, perceived state, and key learning points.
- JSON-backed scenario content.
- A backend-authoritative proof of concept with a dumb browser client.

v0.1 is not a full combat simulator. It should avoid detailed weapons simulation, exact ballistics, exact medical instruction, multiplayer, advanced AI, inventory systems, and long campaigns.

## Development Principles

- Build in thin, testable slices.
- Keep game state and game rules out of the rendering layer.
- Keep strict separation between actual world state and perceived state.
- Treat AAR recording as a first-class output of the simulation, not an afterthought.
- Keep core simulation logic deterministic, pure where practical, and independent of UI framework code.
- Follow strict TDD for production implementation. See [.agents/rules.md](.agents/rules.md).
- Follow the architecture decisions in [ADR 0001](docs/adr/0001-backend-state-store-and-headless-core.md), [ADR 0002](docs/adr/0002-realtime-websocket-and-event-sourced-sessions.md), and [ADR 0003](docs/adr/0003-explicit-opposing-observer-units.md).

## Repository Layout

```text
.
+-- .agents/
|   +-- rules.md
+-- docs/
|   +-- adr/
|   |   +-- 0001-backend-state-store-and-headless-core.md
|   |   +-- 0002-realtime-websocket-and-event-sourced-sessions.md
|   |   +-- 0003-explicit-opposing-observer-units.md
|   +-- project/
|       +-- 01-product-brief.md
|       +-- 02-game-design.md
|       +-- 03-scenarios.md
|       +-- 04-technical-plan.md
|       +-- 05-roadmap.md
|       +-- 06-validation-plan.md
|   +-- research/
|       +-- reference/
|       +-- swedish-army-formations-and-procedures.md
+-- packages/
|   +-- client/
|   +-- core/
|   +-- server/
+-- README.md
```

## Implementation Starting Point

Phase 1 currently includes a WebSocket-backed, event-sourced backend session with a headless TypeScript simulation core, one player soldier, simple opposing observer units, a scrollable/zoomable hex map, click-issued movement/orientation commands, exposure/contact logging, and a minimal event/AAR feed. Only add broader group-leader mechanics after that loop is playable and tested.
