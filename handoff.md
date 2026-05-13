# PokeMatchup — Handoff

## Completed: Step 1 — Scaffold + Game Profile System + Unbound Data Layer

### What was built

**Config files**
- `package.json`, `tsconfig.json` (strict mode), `vite.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `vitest.config.ts`
- `.gitignore`, `.env.example`, `index.html`

**Types** (`src/types/index.ts`)
- All shared interfaces: `TypeName`, `GameMeta`, `PokemonData`, `MoveData`, `TeamMember`, `OpponentState`, `SessionOverride`, `DexCorrection`, `ResolvedOpponent`, `MatchupScore`, etc.

**Lib layer**
- `src/lib/dex.ts` — `createDex(gameId)` async factory; `Dex` interface with `getPokemon`, `getMove`, `getTypeEffectiveness` (ability immunity built in), `getSpriteUrl`
- `src/lib/storage.ts` — typed localStorage helpers with Zod validation
- `src/lib/utils.ts` — `clamp`, `formatNumber`, `fuzzyMatch`, etc.

**Game data** (`src/data/games/`)
- `index.ts` — `GAME_REGISTRY` array (one entry: Unbound 2.1); add-one-line pattern established
- `unbound-2.1/meta.json` — game metadata with mechanics flags
- `unbound-2.1/type-chart.json` — full Gen 6 18×18 effectiveness matrix (hardcoded, verified)
- `unbound-2.1/pokemon.json` + `moves.json` — currently empty arrays; filled by transform script

**Hooks**
- `src/hooks/useGameProfile.ts` — loads active game from localStorage, memoizes `Dex` instance, exposes `{ dex, isLoading, error, switchGame }`

**UI (stub)**
- `src/components/layout/Header.tsx` — game selector dropdown
- `src/components/layout/Layout.tsx` — dark theme shell
- `src/App.tsx` — shows dex load status (species count, move count)
- `src/main.tsx`, `src/index.css`

**Scripts**
- `scripts/transform-borrius.ts` — transforms `borrius_pokedex_data.json` → `pokemon.json` + `moves.json`

### Current app state

The app starts, shows the game selector, and reports "Dex loaded: unbound-2.1, 0 species · 0 moves" until the user runs the transform script.

**You (the user) need to:**
1. Download `borrius_pokedex_data.json` from:
   `https://github.com/nMckenryan/Borrius-Pokedex-Scraper/raw/main/scraperData/borrius_pokedex_data.json`
2. Place it at `scripts/borrius_pokedex_data.json`
3. Run `npm install && npx tsx scripts/transform-borrius.ts`
4. Then `npm run dev` — the app should show "503 species · N moves"

### Next step: Step 2 — Team Builder (Manual Entry)

**Goal:** Build a team of up to 6 Pokémon via manual entry. Team persists in localStorage keyed by game profile.

**Files to create:**
- `src/hooks/useTeam.ts`
- `src/components/team/TeamPanel.tsx`
- `src/components/team/TeamMemberCard.tsx`
- `src/components/team/TeamEditor.tsx` (modal)
- `src/components/team/MemberForm.tsx`
- `src/components/team/MoveSlotInput.tsx`
- `src/components/team/StatInput.tsx`
- `src/components/shared/SearchableDropdown.tsx`
- `src/components/shared/Modal.tsx`
- `src/components/shared/Spinner.tsx`
- `src/components/shared/ErrorBanner.tsx`

**Test fixture:** Serperior / Swanna / Magmortar / Garchomp / Aggron / Lunala

### Decisions made in Step 1

- `createDex` is async (dynamic imports for pokemon/moves JSON to keep bundle lean)
- `TeamMember.stats` will store actual in-game stats, not calculated base stats
- Ability immunities (Levitate → Ground, Flash Fire → Fire, etc.) are applied in `dex.getTypeEffectiveness`, not in the damage formula
- Type chart is attacker-keyed: `typeChart[attackType][defenderType]` = multiplier
