# Perspektivbubbla

Perspektivbubbla is a browser-based tactical procedure and decision simulator built around limited perception. The player acts as a soldier or small-unit leader on a hex map, where the central challenge is not perfect combat optimization but keeping a useful mental picture under uncertainty.

The v0.1 goal is to prove one question:

> Is it interesting and educational to act when you only see, hear, remember, and misunderstand what your role could reasonably perceive?

## Current Status

This repository has a runnable backend-authoritative prototype with a scenario chooser. The current slice includes one-soldier movement/perception basics, simple opposing observers, a two-soldier risk-zone scenario, and an 8-soldier group commander scenario with grpc, stf grpc, two tät, formation orders, `framåt`, `halt`, voice/gesture/radio propagation, true-coordinate movement, risk/effect zones, friendly blocking diagnostics, visibility memory, perceived/last-known status, heard report events, selectable training/normal/realistic difficulty, and a minimal event/AAR feed.

The former design-bible README has been split into focused planning artifacts under [docs/project](docs/project). The roadmap has been rearranged so the next phase is group-command fidelity rather than the older one-soldier/two-soldier sequence.

## Run Prototype

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

Browser clients join the same server-side game when they use the same `game` id, for example [http://127.0.0.1:5173/?game=main&intro=0](http://127.0.0.1:5173/?game=main&intro=0). Use a different `game` id to isolate a separate room.

## MCP Sidecar

The backend also exposes a local Streamable HTTP MCP endpoint at `/mcp`. During development it is available at [http://127.0.0.1:5174/mcp](http://127.0.0.1:5174/mcp) after `npm run dev` or `npm run dev:backend`.

This repository includes [.codex/config.toml](.codex/config.toml) so Codex can discover the `perspektivbubbla` MCP server when the backend is running. The server exposes tools such as `game_start_session`, `game_observe`, `game_move_to_hex`, `game_issue_formation_order`, `game_halt_group`, and `game_advance_time` for agentic play against the backend-authoritative session.

## Docker Deployment

The Docker image builds the Vite frontend and serves the compiled `dist` files from the Node backend, so one container is enough for both the browser UI and the backend service.

Build and run it locally:

```sh
docker build -t perspektivbubbla .
docker run --rm -p 5173:5173 perspektivbubbla
```

CI publishes the image to GitHub Container Registry as `ghcr.io/lbsa71/perspektivbubbla`. Pushes to `main` publish `main`, `sha-...`, and `latest` tags; version tags such as `v0.1.0` publish matching image tags. If the package is private, authenticate the host with `docker login ghcr.io` before pulling.

Deploy from GHCR:

```sh
docker run -d --name perspektivbubbla -p 5173:5173 ghcr.io/lbsa71/perspektivbubbla:main
```

## Planning Artifacts

- [Product brief](docs/project/01-product-brief.md) - concept, goals, non-goals, core loop, and success criteria.
- [Game design](docs/project/02-game-design.md) - perception bubble, hex model, movement, communication, injury abstraction, AAR, and difficulty levels.
- [Scenarios](docs/project/03-scenarios.md) - the three v0.1 scenarios and what each one validates.
- [Technical plan](docs/project/04-technical-plan.md) - current stack, architecture boundaries, modules, and TypeScript model.
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

The architecture foundation is in place: WebSocket-backed session, event-sourced command handling, headless TypeScript simulation core, dumb browser client, deterministic tests, scenario metadata/start APIs, and a minimal event/AAR projection. The active implementation focus is now making the scenario content deeper: command delay/misunderstanding, injury/buddy-aid, and a more instructive AAR.
