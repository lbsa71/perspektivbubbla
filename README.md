# Perspektivbubbla

Perspektivbubbla is a browser-based tactical procedure and decision simulator built around limited perception. The player acts as a soldier or small-unit leader on a hex map, where the central challenge is not perfect combat optimization but keeping a useful mental picture under uncertainty.

The v0.1 goal is to prove one question:

> Is it interesting and educational to act when you only see, hear, remember, and misunderstand what your role could reasonably perceive?

## Current Status

This repository is in project planning/bootstrap state. There is no runnable application yet. The former design-bible README has been split into focused planning artifacts under [docs/project](/Users/stefan/Documents/Source/lbsa71/perspektivbubbla/docs/project).

## Planning Artifacts

- [Product brief](/Users/stefan/Documents/Source/lbsa71/perspektivbubbla/docs/project/01-product-brief.md) - concept, goals, non-goals, core loop, and success criteria.
- [Game design](/Users/stefan/Documents/Source/lbsa71/perspektivbubbla/docs/project/02-game-design.md) - perception bubble, hex model, movement, communication, injury abstraction, AAR, and difficulty levels.
- [Scenarios](/Users/stefan/Documents/Source/lbsa71/perspektivbubbla/docs/project/03-scenarios.md) - the three v0.1 scenarios and what each one validates.
- [Technical plan](/Users/stefan/Documents/Source/lbsa71/perspektivbubbla/docs/project/04-technical-plan.md) - recommended stack, architecture boundaries, modules, and starter TypeScript model.
- [Roadmap](/Users/stefan/Documents/Source/lbsa71/perspektivbubbla/docs/project/05-roadmap.md) - incremental implementation phases and backlog priorities.
- [Validation plan](/Users/stefan/Documents/Source/lbsa71/perspektivbubbla/docs/project/06-validation-plan.md) - playtest plan, risks, mitigations, and v0.1 done definition.

Agent-facing development rules live in [.agents/rules.md](/Users/stefan/Documents/Source/lbsa71/perspektivbubbla/.agents/rules.md).

## v0.1 Scope

The first version should stay deliberately small:

- One soldier scenario for moving from cover/concealment to cover/concealment.
- One two-soldier scenario for facing, risk zones, and friendly blocking.
- One small leader scenario where an injured soldier creates a degraded picture of the situation.
- Three information modes: training, normal, and realistic.
- A short after-action review that compares world state, perceived state, and key learning points.
- JSON-backed scenario content.
- A browser-only proof of concept with no backend requirement.

v0.1 is not a full combat simulator. It should avoid detailed weapons simulation, exact ballistics, exact medical instruction, multiplayer, advanced AI, inventory systems, and long campaigns.

## Development Principles

- Build in thin, testable slices.
- Keep strict separation between actual world state and perceived state.
- Treat AAR recording as a first-class output of the simulation, not an afterthought.
- Keep core simulation logic deterministic, pure where practical, and independent of UI framework code.
- Follow strict TDD for production implementation. See [.agents/rules.md](/Users/stefan/Documents/Source/lbsa71/perspektivbubbla/.agents/rules.md).

## Repository Layout

```text
.
├── .agents/
│   └── rules.md
├── docs/
│   └── project/
│       ├── 01-product-brief.md
│       ├── 02-game-design.md
│       ├── 03-scenarios.md
│       ├── 04-technical-plan.md
│       ├── 05-roadmap.md
│       └── 06-validation-plan.md
└── README.md
```

## Implementation Starting Point

Start with the smallest useful vertical slice: render a hex map, place one soldier, move from cover to cover, log exposure, and produce a tiny AAR. Only add broader group-leader mechanics after that loop is playable and tested.
