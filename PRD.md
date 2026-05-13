# PRD: PokeMatchup (Unbound-first, extensible)

## Overview

A standalone web app that helps me make optimal battle decisions in Pokémon games. I input my team once, then during battles I select the opponent's Pokémon (or upload a screenshot) and the app recommends which of my Pokémon to send out and which move to use, accounting for type matchups, my Pokémon's actual movesets, and stat differences.

The app is built Unbound-first but is architected so I can plug in additional games/romhacks later (vanilla FireRed, Radical Red, Emerald Kaizo, mainline games, etc.) without rewriting core logic.

## Target User

Single user (me). Currently mid-playthrough in Pokémon Unbound on a Mac emulator. Current team: Serperior, Swanna, Magmortar, Garchomp, Aggron, Lunala. May switch to other games/romhacks in the future.

## Core User Flows

### Flow 1: Game Selection

- On first load and via a settings menu, user picks the active "game profile" (e.g., "Unbound 2.1", "FireRed vanilla", "Radical Red")
- Each profile defines its own dex, movepool, type chart generation, and any custom mechanics flags
- Switching profiles swaps the data layer but keeps the same UI; teams are saved per-profile so I don't lose my Unbound team if I add a FireRed profile
- Adding a new game = dropping a new data pack into `/src/data/games/<game-id>/` plus a one-line registry entry; no other code changes required

### Flow 2: Team Setup (one-time per game, editable)

- Build a team of up to 6 Pokémon
- Three input methods:
  - **Manual**: search/dropdown for each Pokémon, pick 4 moves, enter level and stats, optionally pick ability and held item
  - **Screenshot upload**: upload an in-game summary screen; vision model extracts species, level, stats, moves, ability, item; pre-fills form for confirmation
  - **Quick add**: pick a species and let the app auto-fill level-appropriate stats and a default moveset for quick testing
- Team saved to localStorage, keyed by game profile

### Flow 3: Battle Advisor (the main loop)

- Two ways to identify the opponent:
  - **Manual**: searchable dropdown of all species in the current game profile
  - **Screenshot upload**: upload a screenshot of the battle screen; vision model identifies the opponent's species, level, and any visible HP info
- After identification, the app shows the opponent's inferred typing, stats, and likely moves
- **Inline correction**: every auto-detected field (typing, species, level, moves) has an edit button. If the vision model misreads the opponent's type or species, I can fix it in one click and recommendations recompute immediately. Corrections persist for that battle session.
- App shows:
  - **Recommended switch-in**: best matchup from my team, with a short reason
  - **Recommended move**: best move from that Pokémon, with expected damage range
  - **Ranked alternatives**: other 5 team members sorted by matchup score, each with their best move
  - **Threat warnings**: opponent's likely strong moves against each of my Pokémon

## Correction & Override System

The app must treat all vision-extracted data as a *suggestion*, not a fact. Every battle screen field is editable:

- Opponent species (dropdown, in case OCR picks the wrong species)
- Opponent type 1 / type 2 (dropdowns of all 18 types, including "none" for type 2)
- Opponent level (number input)
- Opponent moves (4 editable slots, each a searchable move dropdown)
- Opponent ability (dropdown if known, "unknown" by default)

A single "Reset to detected" button reverts overrides for the current opponent. A "This species is wrong in the dex" button lets me file the correction to a local `corrections.json` so it persists across sessions — useful for romhack edge cases.

## Scoring Logic

For each (my_pokemon, opponent) pairing, compute a matchup score:

- **Offensive score**: for each of my 4 moves, calculate type effectiveness against opponent, weight by move power and STAB, factor in my Atk/SpA vs opponent's Def/SpD. Best move's expected damage = offensive score.
- **Defensive score**: estimate incoming damage based on opponent's typing (worst-case STAB if exact moves unknown) and my HP/Def/SpD.
- **Speed factor**: flag if my Pokémon is slower.
- **Final score**: weighted combination of `offensive - defensive`, with a bonus for outspeeding and a penalty for being one-shot.

Score breakdown is always visible/expandable so I can sanity-check the recommendation.

## Data Architecture (Game Profile System)

Each game profile lives in `/src/data/games/<game-id>/` and contains:

- `meta.json` — game name, version, generation, mechanics flags (has_fairy, has_phys_spec_split, type_chart_gen)
- `pokemon.json` — species list with types, base stats, abilities, learnable moves
- `moves.json` — moves with type, category, power, accuracy, PP, effects
- `sprites/` — optional local sprite assets for species not on PokéAPI
- `corrections.json` — user-edited overrides (created at runtime)

A registry file `/src/data/games/index.ts` exports the list of available profiles. Adding a new game is purely additive.

All data access in the rest of the app goes through `src/lib/dex.ts`, which takes a game profile ID and returns a unified API: `getPokemon(name)`, `getMove(name)`, `getTypeChart()`, etc. Components never import data files directly.

## Screenshot OCR

Two screenshot flows, same underlying vision call:

- **Team summary screenshot**: extracts one Pokémon's full info (species, level, stats, moves, ability, item)
- **Battle screen screenshot**: extracts opponent's species, level, visible HP %, and any visible move names from the last-used-move text

Implementation:

- POST image to Anthropic API with a JSON-schema'd prompt
- Use Claude Sonnet 4.5 or newer
- Return structured JSON; validate against schema; populate form with confidence flags per field (low-confidence fields are highlighted yellow for me to double-check)
- API key from `.env`, never committed
- All extracted data flows through the correction system above — nothing is locked in

## Tech Stack

- React + Vite + TypeScript
- Tailwind CSS
- localStorage for persistence (teams, corrections, active game profile)
- Anthropic API for vision (Claude Sonnet 4.5)
- Static JSON data packs per game

## UI Requirements

- Single-page layout: game profile selector top-right, team across the top, opponent identifier in the middle, recommendations below
- Searchable dropdowns with sprite previews
- All auto-detected fields show a small "edit" pencil; clicking opens an inline editor
- Score breakdowns expand inline
- Fast keyboard navigation (Tab through fields, Enter to confirm)
- Mobile-responsive nice-to-have, not required

## Out of Scope (v1)

- Reading emulator memory or screen directly
- Multi-team management within one profile
- Accounts, auth, cloud sync
- Smogon-calc-precision damage
- Predicting opponent's exact moveset (worst-case typing is fine)
- Auto-importing dex data from new ROMs (game profiles are added manually for now)

## Success Criteria

- Team setup for 6 Pokémon: under 5 minutes manually, under 2 minutes with screenshots
- Opponent identification + recommendation in under 1 second after screenshot upload, under 200ms after manual dropdown selection
- Correcting a misread field updates recommendations instantly
- Adding a second game profile takes under 30 minutes of data prep and zero code changes outside `/src/data/games/`

## Build Order

1. Scaffold app + game profile system + load Unbound static data
2. Team builder (manual entry only)
3. Opponent selector + matchup scoring + recommendation UI + correction/override controls
4. Screenshot upload + vision API for team entry
5. Screenshot upload for battle screen / opponent identification
6. Polish: sprites, keyboard shortcuts, score breakdown UI, "add a new game" docs