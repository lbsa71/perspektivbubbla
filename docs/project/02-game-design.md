# Game Design

## Modes in v0.1

### Soldier Mode: From Cover to Cover

The player controls one soldier. The focus is micro-movement, cover, concealment, exposure, and perception.

Trains:

- movement between cover
- choosing the nearest reasonable cover/concealment
- understanding exposure
- maintaining orientation
- reacting to observation/contact
- noticing shouts and signals depending on sight and hearing

### Leader Mode: Limited Situation Picture

The player is a group leader and gives orders to an 8-soldier group with grpc, stf grpc, and two tät.

Trains:

- formation and movement
- giving orders with limited reach
- understanding that orders do not always arrive
- following up on an injured soldier
- balancing mission, protection, and cohesion
- handling uncertain information

### AAR Mode

After the scenario, the player can inspect layers that were hidden or partial during play:

- actual situation
- what the leader saw
- what each soldier saw
- what was heard
- when orders were given
- who perceived each order
- when injury occurred
- when information became old
- where friendly blocking occurred
- which decisions had the biggest consequences

## Visual Philosophy

There should be no omniscient dashboard during play. The UI shows what the role can reasonably perceive.

The simulation has three layers:

- **World layer:** exact positions, health, stress, order status, sight lines, and events. Hidden during play.
- **Perceived layer:** visible units, visible terrain, heard shouts, last known positions, unconfirmed reports, uncertain sound directions, and uncertainty indicators.
- **AAR layer:** exact replay used for learning, including missed observations, failed communication, stale information, and consequences.

## Perspective Bubble

The perspective bubble is the player's active perception area. It is not a fixed radius. It depends on role, terrain, direction, light, stress, obstacles, sound, posture, and previous observations.

As group leader, the view should show:

- clear information where the leader actually sees
- weaker information where something was recently observed
- shadow icons for last known friendly positions
- sound indicators from approximate directions
- voice/gesture/radio order reach
- no full status for soldiers outside sight or report

As soldier, the view should be more local:

- shorter situation picture
- stronger focus on nearby cover
- clear own facing
- clear own risk/effect zone
- limited picture of the group
- greater chance of missing the wider mission

## Information Age

All perceived information receives an internal timestamp.

Suggested visualization:

- 0-5 seconds: normal icon
- 5-20 seconds: transparent icon
- 20-60 seconds: shadow/last-seen icon
- over 60 seconds: hidden or highly uncertain marker

Examples:

- Andersson was last seen behind the stone wall 18 seconds ago.
- Berg was heard shouting from the southwest.
- Team 2 is last known near the forest edge.

## Hex System

Scale:

- 1 hex is roughly 3 meters.
- 1 soldier occupies 1 hex.
- Simulation time is advanced by the backend clock, initially at 5-10 ticks per second.

The scale is pedagogical, not exact measurement.

Each hex stores:

- terrain type
- movement cost
- cover
- concealment
- whether it blocks sight
- height difference
- noise dampening
- exposure value

Example:

```json
{
  "q": 4,
  "r": 7,
  "terrain": "field",
  "moveCost": 1,
  "cover": 0,
  "concealment": 0,
  "blocksSight": false,
  "height": 0,
  "noiseDampening": 0,
  "exposure": 3
}
```

## Terrain Types for v0.1

| Terrain | Movement | Cover | Concealment | Sight | Note |
| --- | ---: | ---: | ---: | --- | --- |
| Open field | fast | 0 | 0 | long | high exposure |
| Tall grass/bushes | normal | 0 | 2 | medium | concealment, not cover |
| Forest | slower | 1 | 2 | shorter | mixed terrain |
| Ditch/depression | slow | 2 | 2 | limited | good for low profile |
| Stone/wall | slow around | 3 | 1 | partially blocks | directional cover |
| Road/path | fast | 0 | 0 | long | tempo with exposure risk |

## Cover and Concealment

Cover reduces effect from threats/exposure in the abstract model:

- 0: no cover
- 1: some cover
- 2: good cover
- 3: strong cover

Concealment reduces detection probability but does not necessarily protect:

- 0: no concealment
- 1: some concealment
- 2: good concealment
- 3: very good concealment

The game should clearly teach the difference between "hard to see" and "protected." AAR should be able to state when the player chose concealment without cover, stayed too long in open terrain, or passed good cover without using it.

## Soldier Model

Each unit, friendly or opposing, has:

- id/name
- side
- role
- position
- facing
- health
- stamina
- stress
- load
- posture
- current action
- current order
- order understanding
- perception
- communication ability

Example:

```json
{
  "id": "S2",
  "name": "Andersson",
  "role": "soldat",
  "q": 6,
  "r": 8,
  "facing": "NE",
  "health": 100,
  "stamina": 72,
  "stress": 35,
  "load": "normal",
  "posture": "standing",
  "status": ["moving"],
  "currentOrder": "move_to_cover",
  "understoodOrder": true
}
```

Postures for v0.1:

- standing
- crouched/low
- prone
- moving
- helping another soldier
- injured/cannot move normally

Effects:

- Standing: better sight, higher exposure.
- Crouched/low: lower exposure, slower movement.
- Prone: lowest exposure, very slow movement.
- Helping another: low mobility, bound to another soldier.
- Injured: limited or no self-movement.

## Movement Model

Movement is simulated in realtime on the backend clock. The client sends movement intent; the server advances movement over simulated time.

Initial movement rates:

- standing movement: 1 hex/second before terrain modifiers
- crouched movement: 0.6 hex/second before terrain modifiers
- prone movement: 0.25 hex/second before terrain modifiers
- tired soldier: reduce rate by 25 percent
- stressed/unclear order: risk of delay or interrupted action
- helping injured: heavily reduced movement

Terrain movement costs:

| Terrain | Cost |
| --- | ---: |
| Road/path | 0.5-1 |
| Open field | 1 |
| Bushes/tall grass | 1.5 |
| Forest | 2 |
| Ditch/depression | 2 |
| Obstacle/wall | 3 or impassable |

Movement commands are interruptible. The player can click any target hex. The backend computes a simple nearest path toward that target, and movement stops if an obstacle blocks the path. A new move, posture, or body-orientation command cancels the current movement intent and creates new domain events for the event log.

## Opposing Units

Opposing units are explicit world entities, not abstract threat zones. They use simple heuristics:

- scan their field of view
- probabilistically detect visible player units
- become alerted on detection/contact
- move to nearby cover when exposed
- orient toward perceived contact
- create abstract return-fire/contact-pressure events when alerted and oriented

Return fire is intentionally abstract in v0.1. It should affect pressure, exposure, scenario state, and AAR, but it should not become detailed weapon simulation or ballistics.

Buddy movement in v0.1 is simplified:

- One soldier can help an injured soldier very slowly.
- Two soldiers can move an injured soldier faster but bind two people.
- Helpers become more tired.
- Group tempo and cohesion are affected.

Consequences:

- movement reduced 50-75 percent
- helpers cannot fully participate in other tasks
- increased risk that the group splits
- greater need for order follow-up

## Facing, Sight, and Risk Zones

Each soldier faces one of six hex directions:

- N
- NE
- SE
- S
- SW
- NW

Facing affects field of view, risk/effect zone, reaction to sound/visual events, and how quickly a soldier can act in another direction.

The player can freely sweep/look around with mouse and keyboard controls, similar to moving the neck. Looking more than 90 degrees away from body orientation should bleed into an orientation change. Field of view updates immediately when the player looks or turns; perceived information then ages over time.

The sight field is wider than the risk/effect zone and depends on facing, terrain, posture, stress, light, movement, concealment, and obstacles.

v0.1 does not model ballistics. It models an abstract risk/effect cone to show:

- where the soldier is oriented
- where friendlies can block
- where a teammate is poorly positioned
- when a soldier cannot contribute because direction is blocked

2:1 cone example:

```text
      x
     x x
    x x x
   x x x x
      S
```

If a friendly soldier is in the risk zone:

- the effect opportunity is blocked in abstract terms
- group coverage is reduced
- the soldier receives internal `blocked` status
- AAR marks the event

The current prototype implements this as core projection data: each friendly projects an effect zone, blocker pairs are detected, and the two tät receive simple coverage checks. Training mode shows clear zone overlays and blocker markings. Normal mode should be subtle. Realistic mode should avoid explicit warnings and rely on behavior/AAR.

## Communication

Channels for v0.1:

- visual gesture
- voice/shout
- radio/communication equipment
- indirect relay through another soldier

Communication is not guaranteed. Orders can be understood correctly, partially, too late, missed, or misunderstood.

Factors:

- distance
- terrain
- sight
- noise
- stress
- direction/facing
- whether the soldier is occupied
- whether the soldier is injured or helping someone

Visual orders work only if the receiver has sight, is looking in a useful direction or can catch peripheral movement, is not too far away, and is not too stressed or occupied.

Voice orders depend on hearing distance, terrain, noise level, stress, direction, and ongoing events.

Radio can be simplified in v0.1 as working, degraded, unavailable, or occupied. It is a mechanism for information transfer, not a full communications training system.

Shouts are information events. Example: "Andersson injured, applying emergency aid." Exact words are perceived only with good audibility. Others hear fragments or only an approximate sound direction. The leader does not automatically get full status unless they hear or receive a report.

The current prototype has a first slice of this information system: short status reports are emitted for blocked effect zones and movement waits, and the player projection exposes heard events with approximate direction and clarity. Injury-specific reports are still planned for the buddy-aid slice.

## Injury and TOS Abstraction

v0.1 should not teach medical details. It should simulate that injury changes group capability, requires attention, binds personnel, affects movement, requires reporting/follow-up according to exercise purpose, and creates information problems.

Injury levels:

- uninjured
- lightly affected
- injured but mobile
- injured and limited
- cannot move independently

Actions:

- notice injury
- shout/report injury
- assign helper
- perform simplified first action
- move injured soldier
- follow up status

The simplified action can be displayed as "urgent aid in progress" without giving medical instructions.

Example event:

- Andersson is injured in open terrain.
- Berg sees it and starts helping.
- The leader has no line of sight.
- Berg shouts.
- The leader hears a fragment, notices Berg missing from movement, and must choose whether to follow up, gather, continue, or send an order.

The AAR should show when the injury occurred, who saw it, who helped, when the leader perceived anything, and how long the status remained unresolved.

## Orders

The group leader is still a soldier in the terrain. The commander view must not become a detached RTS controller. The player can set or indicate direction and issue `framåt`, but then still has to move the grpc through the terrain with normal movement clicks. The rest of the group treats that movement as the embodied lead for the formation.

Consequences:

- `framåt` means "advance in this formation and direction," not "autopilot the whole group to a far goal."
- The grpc's movement, pauses, terrain choices, posture, and hesitation affect the group.
- Soldiers stop or slow if the grpc stops, just as they should stop or slow for any other formation neighbour.
- The group should preserve formation and neighbour cohesion around the leader's actual path, not around an abstract formation center that moves independently of the player.

An order consists of:

- receiver
- action
- place/direction
- tempo/posture
- optional formation change
- communication method

Example:

```json
{
  "receiver": "all",
  "action": "move_to",
  "targetHex": [8, 12],
  "formation": "line",
  "tempo": "normal",
  "communication": "voice"
}
```

Minimum commands:

1. Move to point.
2. Halt.
3. Take cover/low profile.
4. Change formation.
5. Orient/facing.
6. Gather on leader.
7. Help injured.
8. Move injured.
9. Report/shout status.
10. Break/regroup to point.

Formations:

- column
- line/skirmish line as an abstraction
- dispersed movement
- gathering
- pair/team movement as simplified grouping

Formations affect distance, order reception, risk-zone blocking, tempo, vulnerability/exposure, and control.

## Difficulty Levels

### Training

Shows:

- clear risk zones
- cover/concealment values
- order reception
- status indicators
- exposure warning
- recommended hexes

Purpose: learn the system.

### Normal

Shows only perceived information:

- visible friendlies
- last known positions
- heard shouts
- subtle risk zones
- no exact values

Purpose: realistic but playable training.

### Realistic

Shows minimal help:

- no automatic status panel
- limited markers
- unclear sound fragments
- last-known shadows disappear faster
- no recommendations

Purpose: memory, situational awareness, and leadership.

### Instructor/AAR

Shows everything:

- actual situation
- all sight lines
- order flow
- perception per soldier
- exposure curves
- risk zones
- injuries
- missed follow-ups

Purpose: learning afterward.

## Feedback and AAR

During play, feedback should be visual and limited:

- sound wave
- gaze/facing
- icon uncertainty
- soldier hesitates
- soldier does not move
- soldier shouts
- token leaves the perspective bubble
- risk cone is graphically blocked

Avoid text that reveals the full truth during play.

AAR sections:

1. Timeline.
2. Map replay.
3. Actual state compared with perceived state.
4. Communication: orders, shouts, reception.
5. Exposure and movement.
6. Injury and follow-up.
7. Risk zone/friendly blocking.
8. Three most important learning points.

Example learning points:

- You continued movement without confirming Andersson's status.
- Berg was bound to the injured soldier but still counted mentally as available.
- The group lost cohesion when orders were given with low audibility.
- Two soldiers blocked each other's risk zones for 14 seconds.
- You chose concealment but not cover when detected.
