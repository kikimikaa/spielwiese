# 🌱 Roadmap

What already works, what's coming next, and a few ideas that are on the radar.
Nothing here is a fixed schedule. Suggestions and PRs are welcome.

## Already here

**QR-code joining.** The Invite page shows a QR that sends guests straight to
`/join`, using the machine's LAN IP so it works from any phone on the Wi-Fi.

**Undo & scoring history.** Every awarded point can be taken back.

**Awards / honorable mentions.** A reveal-at-your-own-pace ceremony with a few
playful guest awards before the winner is crowned.

**Per-game win celebration.** A small toast pops up on the board each time a team
wins a game, so a scored point is felt right away — smaller than the finale.

**Quiz game type.** Games can be a quiz: enter question/answer pairs, and the
board shows the question to everyone and reveals the answer on the host's cue.

**Estimate game type.** A single estimate question with a solution and an
optional unit; the board shows the question and reveals the solution on cue.
Closest guess wins — the host still taps the winner.

**Multiple-choice game type.** A question with several answer options, one
correct; the board shows the lettered options and highlights the right one on
the host's cue while fading the rest.

**Ordering game type.** Several items the teams put in the right order; the board
shows them in a neutral order and reveals the correct sequence, numbered, on the
host's cue.

**Config export & import.** Share a games setup as a versioned file so a
tournament can be reused or handed to another host (no guest names or scores).

**Friendly error page.** A branded 404 and a clear message for other errors,
instead of Nuxt's raw error screen.

**Bulk library selection.** Tick or untick every game for the tournament at once.

**Library as its own page.** The game library moved out of a cramped modal onto
its own page with room to breathe, with search and filters by type and location.
Only adding a game stays a popup.

**End tournament.** A one-tap reset that clears the run and the entered names and
takes every game out of the lineup, while keeping the game library for next time.

**Save / resume tournaments.** Snapshot a running tournament under a name and
reload it later, so an event can be paused across sessions (beyond the automatic
`data/state.json` recovery that already survives a crash or restart). Snapshots
are host-only and never leave the machine.

**Reconnect handling.** When the live connection drops mid-event, every view
shows a clear reconnect banner with a manual retry, on top of the automatic
backoff reconnect — so guests and the board recover cleanly after a Wi-Fi or
server blip.

**Bilingual game presets.** Ready-made themed game packs (quiz night, party,
sports, classics) in both German and English, loaded into the library in the
current language. Non-destructive: a preset tops up the games it's missing (by
id) and never swaps the library or clears play data. The library filter has a
preset-pack facet alongside game type and location.

## Planned

**More game types.** Further tailored types beyond quiz, estimate, multiple
choice and ordering, each with its own add mask and board behaviour.

## Ideas

Further out, not committed yet.

**Spectator mode.** A read-only view for people who aren't playing.

**Deeper analytics.** Highest-scoring round, team performance over time, and a
richer end-of-event recap.

## Want to help?

Open an issue or a PR for anything above.
