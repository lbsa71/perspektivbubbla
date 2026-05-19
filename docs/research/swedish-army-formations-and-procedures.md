# Swedish Army Formations, Signs, and Procedures

Research notes for translating Swedish small-unit movement vocabulary into game mechanics. This is a simulation and design reference, not a tactical training manual.

## Scope

The terms below are treated as observable behaviors for `Perspektivbubbla`: formation shape, order propagation, cohesion, exposure, perception, and AAR explanation. Distances and exact drills should be tuned for gameplay rather than copied literally.

The user's `stristridskolonn` is assumed to mean `stridskolonn`.

## Source Confidence

High-confidence source anchors:

- `Handbok markstrid - grupp : MSH grp 2016`, Försvarsmakten, Stockholm 2016, catalogued by Försvarsmaktens biblioteksportal. It replaces `MSR 3 grupp fu 2013`.
- `Soldaten i fält = SoldF`, Försvarsmakten, Stockholm 2001, catalogued by Försvarsmaktens biblioteksportal.
- `MSR 3 Grupp - FU 2013`, a public transcription. It was later replaced by MSH Grp 2016, but the available 2016 snippets show the same core structure for these terms.
- Försvarsmakten news pages confirm `igelkottsförsvar` as ordinary basic field-training vocabulary.
- Rustad Soldat gives a practical public index of hand signs. Use it as a secondary source for sign descriptions, not as the doctrinal authority.

Local reference copies are stored under [`reference/`](reference/). See [`reference/README.md`](reference/README.md) for source URLs, checksums, and retrieval notes.

## Quick Glossary

| Term | Literal / close English | Level | Core idea | Game use |
| --- | --- | --- | --- | --- |
| `igelkott`, `runtomkringförsvar` | hedgehog, all-round defense | group | Temporary 360-degree security at halt | Stop, spread outward, restore observation and local command |
| `samling runt chefen`, `samling` | gather around the leader | group/platoon | Pull people toward sign-giver or leader for order/reorientation | Improves communication, costs time and increases clustering |
| `stridskolonn` | combat column | platoon | Groups in depth behind one another | Good cohesion and flank readiness, poorer broad front effect |
| `stridslinje` | combat line | platoon | Groups abreast | Strong front readiness, slower and harder to lead in rough terrain |
| `blixtlås` | zipper | group | Serial peel-off / sidestep to break contact or shift sideways | Stressful disengagement drill with high coordination demand |
| `växelvis framåt/bakåt` | alternating forward/backward | group | One element moves while another covers | Slow, protected bounding movement |

## Igelkott / Runtomkringförsvar

`Igelkott` is a short command-name for `runtomkringförsvar`: the group halts and forms outward-facing all-round security. MSR 3 Grupp describes it as used during short orientation and order-giving halts. The group spreads out on a circle toward each soldier's main observation direction, keeps observation and readiness outward, checks contact with neighbors, assigns one or more posts if needed, and can gather inward on the group leader's signal.

For the game:

- Order id: `all_round_security`.
- Trigger: halt, uncertainty, need to issue order, short pause, poor visibility, possible threat in several directions.
- Formation behavior: soldiers move to nearby outward sectors around the leader or halt point, facing out.
- Perception effect: improves all-around observation and reduces surprise from flank/rear.
- Cost: stops mission progress, takes time, can expose or cluster soldiers if terrain lacks cover.
- AAR checks: "halted but did not cover rear", "leader regained order reach", "soldier outside visual contact missed the command".

Hand sign:

- `Runtomkringförsvar - Igelkottsförsvar`: public sign summaries describe a clenched fist held on top of the head.

## Samling Runt Chefen

There are two related but distinct ideas:

- `Samling`: gather personnel to the sign-giver.
- `Cheferna till mig`: gather subordinate leaders to the sign-giver.

SoldF lists `Samling`, `Cheferna till mig`, and `Runtomkringförsvar - Igelkottsförsvar` among standard signs. Public sign references describe `Samling` as both arms rotating over the head, and `Cheferna till mig` as clenched hands on both sides of the head. MSR 3 Grupp also describes a leader signal that brings the group inward after an igelkott.

For the game:

- Order id: `gather_on_leader`.
- Trigger: leader needs face-to-face order, regroup after lost contact, after `igelkott`, before route change.
- Behavior: soldiers in visual/hearing/order range move toward leader or center point; if already in all-round security, they close in from outward sectors.
- Benefit: improves order comprehension and lets the player repair the situation picture.
- Cost: reduces dispersion, slows movement, can reduce outward observation if no one is explicitly kept watching.
- AAR checks: "gather restored command reach", "clustered too long in exposed terrain", "one soldier was out of signal range".

## Stridskolonn

`Stridskolonn` is a platoon combat formation, not the same as a single-file marching line. MSR 3 Grupp and the 2016 MSH Grp snippets describe platoon groups arranged behind one another, with each group retaining its own group-level formation area. It is used when terrain provides protection, movement is constrained to a narrow area, obstacles/mines restrict width, or information about the enemy is uncertain. The source notes emphasize high readiness toward the flanks and good freedom of action for rear groups.

For the game:

- Formation id: `platoon_combat_column`.
- Shape: groups in depth, each group keeps internal formation.
- Best terrain: forest tracks, ditches, constrained routes, uncertain enemy direction.
- Perception effect: good flank/rear sector management if soldiers maintain assigned observation arcs.
- Cost: lower immediate front mass than `stridslinje`, risk of units blocking one another, rear groups have stale situation picture.
- AAR checks: "column preserved cohesion through narrow terrain", "front group fixed while rear group had room to maneuver", "rear group had old information".

Implementation note: at the group level the closer Swedish term is often `skyttekolonn`. In UI, reserve `stridskolonn` for platoon-level formation and `skyttekolonn` for group-level column if we add it later.

## Stridslinje

`Stridslinje` is a platoon formation with groups side by side. MSR 3 Grupp describes it as giving high readiness to the front, but notes that it can be hard to lead and slow in terrain with short sightlines or poor going.

For the game:

- Formation id: `platoon_combat_line`.
- Shape: groups abreast across the likely direction of contact.
- Best terrain: open or semi-open terrain where front observation matters.
- Perception effect: broader front view and easier front-facing effect.
- Cost: slower, harder order propagation across width, more risk of losing lateral contact in forest or broken terrain.
- AAR checks: "line improved front observation", "left group lost visual contact", "formation was too wide for the terrain".

Implementation note: at the group level the closer Swedish term is often `skyttelinje`. The related one-file/single-file formation is labeled `skytteled` in the public hand-sign reference.

## Skytteled

`Skytteled` is the group-level one-file formation: soldiers form one led in depth behind the lead element. It is useful when terrain, obstacles, vegetation, roads, ditches, or visibility make width undesirable, but it gives less immediate width to the front than `skyttelinje`.

For the game:

- Formation id: `file`.
- Shape: one file in depth behind the leader, aligned to the ordered direction.
- Best terrain: narrow routes, ditches, forest tracks, constrained passages, or low-visibility movement.
- Perception effect: good control and route following, but narrower front observation.
- Cost: vulnerable to fire along the file, slower to deploy into a broad front.
- AAR checks: "file preserved cohesion through constrained terrain", "formation had narrow observation frontage", "rear soldiers had delayed contact information".

## Blixtlås

`Blixtlåsförfarande` is a group procedure mainly for breaking contact after contact from the side, or for side movement under pressure. SoldF and MSR 3 Grupp describe the group turning toward the threat, establishing control, then peeling elements across behind the group until the leader stops the procedure or orders a new position. The sources also warn that it is ammunition- and coordination-intensive.

For the game:

- Procedure id: `zipper_break_contact`.
- Trigger: side contact, need to disengage, need to sidestep out of a bad position.
- Preconditions: group has identified a threat direction, at least part of the group can cover while others move, leader command reaches enough soldiers.
- Behavior abstraction: one edge element moves behind the group to the opposite side, then the next element follows, creating a zipper-like lateral withdrawal or shift.
- Cost: high stress, high communication demand, high risk if everyone moves at once or if casualty handling is ignored.
- AAR checks: "procedure started before threat direction was understood", "cover lapsed during movement", "injured soldier was left outside the moving chain".

Do not model this as magic teleport or an instant retreat button. It should feel like a fragile, order-dependent recovery action.

## Växelvis Framåt / Bakåt

`Växelvis` means alternating. In group movement it means one element moves while another supports or covers, then they swap. It differs from `ansatsvis`, where the whole unit moves by stages. Public hand-sign references describe `växelvis framåt/bakåt` as one part of the unit moving while the other protects.

For the game:

- Procedure ids: `alternating_bounds_forward`, `alternating_bounds_back`.
- Trigger: risk of contact, need to cross exposed ground, withdrawal under pressure, cautious advance.
- Preconditions: at least two elements, a reachable command chain, enough spacing to avoid blocking.
- Behavior: element A stays oriented and covering while element B moves to a new covered position; then B covers while A moves.
- Benefit: lower exposure per moving element and better continuity of observation.
- Cost: slower, requires clear orders and spacing, fails if one element does not understand its role.
- AAR checks: "both elements moved at once", "support element lacked line of sight", "bound length was too long for the terrain".

## Suggested Data Model

```ts
type TacticalPattern = {
  id: string;
  swedishName: string;
  category: "formation" | "procedure" | "signal";
  level: "soldier" | "pair" | "group" | "platoon";
  triggerContexts: string[];
  requiredPerception: string[];
  expectedShape?: string;
  commandReach: "visual" | "voice" | "radio" | "mixed";
  benefits: string[];
  costs: string[];
  aarChecks: string[];
};
```

Initial ids:

- `all_round_security`
- `gather_on_leader`
- `platoon_combat_column`
- `platoon_combat_line`
- `zipper_break_contact`
- `alternating_bounds_forward`
- `alternating_bounds_back`

## Design Principles

- Treat formations as negotiated behavior, not perfect geometry. Soldiers should drift, miss signals, seek cover, and lose sight.
- Separate `command intended`, `command perceived`, and `command executed`.
- Every formation should alter perception: who sees front, flank, rear, leader, and neighbors.
- AAR should explain failures in human terms: missed sign, stale leader picture, blocked movement, no one watching rear, too much clustering.
- Avoid exact doctrine simulation. The learning target is perspective, coordination, and consequences.

## Sources

- Försvarsmaktens biblioteksportal, [`Handbok markstrid - grupp : MSH grp 2016`](https://forsvarsmakten-sverige.mikromarc.se/mikromarc3/detail.aspx?Browse=1&DG=0&Id=81836&LB=FT&MT=0&P=1&SC=FT&ST=Normal&SU=13428&SW=handbok+markstrid&Unit=13424&db=forsvarsmakten-sverige). Confirms title, publisher, year, length, VIDAR id, and that it replaces MSR 3 Grupp FU 2013.
- Försvarsmaktens biblioteksportal, [`Soldaten i fält = SoldF`](https://forsvarsmakten-sverige.mikromarc.se/mikromarc3/detail.aspx?Id=16385&Unit=6477&db=forsvarsmakten-sverige). Confirms Försvarsmakten 2001, publication series `M7742-100002`.
- Public transcription, [`Soldatreglemente Soldaten i fält, SoldF`](https://doczz.net/doc/161902/soldatreglemente-soldaten-i-f%C3%A4lt--soldf). Used for public text references on signs, `stridskolonn`, `stridslinje`, `växelvis`, and `blixtlåsförfarande`.
- Public transcription, [`MSR Grupp`](https://doczz.net/doc/877033/msr-grupp). Used for public text references on `runtomkringförsvar`, `stridskolonn`, `stridslinje`, `växelvis`, and `blixtlåsförfarande`.
- Försvarsmakten, [`Nyutbildade hemvärnssoldater`](https://www.forsvarsmakten.se/sv/aktuellt/2010/11/nyutbildade-hemvarnssoldater/). Confirms `igelkottsförsvar` as a trained field behavior.
- Försvarsmakten, [`Lärorikt och roligt ute i fält`](https://www.forsvarsmakten.se/sv/aktuellt/2011/05/larorikt-och-roligt-ute-i-falt/). Confirms recruits learned to set up `igelkottsförsvar` during field training and short march pauses.
- Rustad Soldat, [`65 militära handtecken`](https://rustadsoldat.se/artiklar/handtecken). Secondary source for public sign descriptions.
