# Bill per play, with a scan bonus on top

A physical screen cannot report viewability. There is no viewport, no user
agent, and no session, so the browser definition of a verified impression does
not survive. We bill a **play**: one listing shown in one placement for its full
dwell, reported by CapyTV. A **scan** of the code on that listing pays a bonus
on top.

We rejected billing on scans alone. Ambient screens scan at 0.1-1%, so a typical
venue would earn a few dollars a month and the supply side would collapse. Scan
only billing also inverts the fraud model: the distributor holds both the screen
and the phone, and each faked event is worth about a hundred plays.

We rejected paying per play alone, because the advertiser then has no evidence
that anything worked.

## Consequences

- The floor rate is capped per device per day, so the cash value of a faked
  screen has a ceiling we choose.
- The scan-to-play ratio is the drawer-tablet detector. A device with thousands
  of plays and no scans over weeks is not facing a room.
- A play is not proof that a human looked. Do not describe a play as an
  impression in member-facing text.
