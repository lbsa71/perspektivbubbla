# Product Brief

## Working Title

Primary name: **Perspektivbubbla**

Alternative names considered:

- Lägesbild
- Gruppchef
- Stridsrutin
- Från skydd till skydd
- TOS & Terräng

## Short Description

Perspektivbubbla is a web-based tactical procedure and decision simulator in a hex environment. The player leads or acts as a soldier through terrain with limited perception, uncertain information, stress, injury, and communication problems.

The game should train how a player perceives the situation, chooses the next reasonable action, communicates, remembers, follows up, and reflects. It should not train "how to win a fight" as a weapons simulator.

## Core Validation Question

v0.1 exists to answer:

> Is it interesting and educational to lead or act as a soldier when the player only sees, hears, and remembers what that role could reasonably perceive?

## Design Goals for v0.1

1. Create a playable loop where the player moves from cover/concealment to cover/concealment.
2. Visualize limited perception through the perspective bubble.
3. Make the gap between actual state and perceived state central.
4. Show how soldiers can block each other's risk/effect zones.
5. Make injury and buddy aid affect tempo, cohesion, and situational awareness.
6. Provide a simple but meaningful after-action review after every scenario.
7. Keep the first version small enough to implement quickly as a browser app.

## Non-Goals for v0.1

v0.1 should not attempt to be a full combat simulator.

Out of scope:

- detailed weapons simulation
- exact ballistics
- exact medical/TOS instruction
- advanced AI
- multiplayer
- realistic audio engine
- complete Swedish military doctrine
- detailed enemy tactics
- inventory or equipment simulator
- long campaigns

The product trains procedure, situational awareness, and decision-making. It does not replace instructors, regulations, or unit training.

## Core Experience

The player should repeatedly feel:

- "I cannot see everything."
- "I heard something, but I am not sure exactly what."
- "I think I know where Andersson is, but that information is old."
- "I gave an order, but I do not know whether everyone understood it."
- "I have to choose between tempo, protection, cohesion, and mission progress."
- "I should have followed up earlier."

## Core Loop

1. The player receives a mission and a role.
2. The game shows only that role's perspective bubble.
3. The player gives an order or performs an action.
4. Units act based on orders, terrain, stress, audibility, and sight.
5. Events occur: observation, contact, injury, shout, lost visibility, or a new terrain option.
6. The player reacts with incomplete information.
7. The scenario ends.
8. The AAR shows what happened, what the player knew, what the player missed, and what consequences followed.

## v0.1 Success Criteria

v0.1 is successful if test players say:

- "I understood why I lost the situation picture."
- "I wanted to replay it to do better."
- "The AAR showed something I did not notice during play."
- "It felt relevant for training, not only like a game."
- "I had to think about cover, concealment, orders, and follow-up at the same time."

Measurable criteria:

- A player can understand the basics in under 10 minutes.
- A scenario takes 3-8 minutes.
- AAR takes 2-5 minutes to review.
- At least 3 clear learning points emerge in each scenario.
- Test players want to replay the same scenario.

## Summary

v0.1 should prove three things:

1. **The perspective bubble works:** players accept and learn from limited information.
2. **The hex scale works:** 3-5 meters per hex makes movement, cover, concealment, and risk zones understandable.
3. **AAR creates learning:** players gain insight into what actually happened compared with what they believed happened.

