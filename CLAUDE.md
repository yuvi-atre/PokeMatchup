# PokeMatchup — Claude Context

## What this is

A local, single-user battle advisor for Pokémon Unbound (and future game profiles).
During gameplay: pick the opponent → get ranked team recommendations with visible damage math.
No auth, no server, no cloud. Runs on `localhost` next to the emulator.

## Tech stack

- React 18 + Vite + TypeScript (strict mode)
- Tailwind CSS
- Zod (schema validation for localStorage + OCR responses)
- Vitest (unit tests for damage.ts and dex.ts only)
- Anthropic API — `claude-sonnet-4-5`, key in `.env` as `VITE_ANTHROPIC_API_KEY`
- localStorage for all persistence (teams, corrections, active game)

## Critical conventions

### Data access — always through dex.ts
```
src/lib/dex.ts  ← ONLY place that imports from src/data/games/
```
Components and hooks never import JSON data files directly.
Call `useDex()` (via `useGameProfile`) to get a `Dex` instance.

### Damage/scoring formulas — always in damage.ts
```
src/lib/damage.ts  ← ALL scoring logic lives here, pure functions, no React
```
Tweak weights by editing `DEFAULT_SCORING_CONFIG`. Don't hunt through components.

### Corrections are first-class
- **Session overrides**: React state in `useOpponent`, cleared when new opponent is selected
- **Dex corrections**: localStorage, keyed `dexCorrections:<gameId>`, persist forever
- Pipeline: `base dex → DexCorrections → SessionOverride → ResolvedOpponent`
- Defined in `src/lib/corrections.ts`

### OCR is a suggestion, never source of truth
Every OCR field has a `confidence: 'high'|'medium'|'low'`. Low = yellow highlight.
User can edit any field. Editing promotes confidence to `'high'`.

## Running the app

```bash
npm install
cp .env.example .env          # add your Anthropic API key
npm run dev                   # http://localhost:5173
```

## Running tests

```bash
npm run test                  # vitest run (damage.ts + dex.ts tests only)
```

## Adding a new game profile (purely additive)

1. Create `src/data/games/<game-id>/`:
   - `meta.json` — id, name, generation, mechanics flags
   - `pokemon.json` — array of PokemonData
   - `moves.json` — array of MoveData
   - `type-chart.json` — 18×18 effectiveness matrix
2. Add one import + one array entry in `src/data/games/index.ts`
3. Zero other code changes required

## Data setup for Unbound

Download the raw Borrius Pokédex JSON:
```
https://github.com/nMckenryan/Borrius-Pokedex-Scraper/raw/main/scraperData/borrius_pokedex_data.json
```
Place it at `scripts/borrius_pokedex_data.json`, then run:
```bash
npx tsx scripts/transform-borrius.ts
```
This generates `pokemon.json` (503 species) and `moves.json` for the Unbound profile.

## Build step status

- [x] Step 1: Scaffold + game profile system + Unbound data layer
- [ ] Step 2: Team builder (manual entry)
- [ ] Step 3: Opponent selector + scoring + recommendations + corrections
- [ ] Step 4: Screenshot OCR for team entry
- [ ] Step 5: Screenshot OCR for battle screen
- [ ] Step 6: Polish (sprites, keyboard nav, score UI, docs)
