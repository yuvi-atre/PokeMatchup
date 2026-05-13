# PokeMatchup — Handoff

_Last updated: 2026-05-13. Overwrite this file each session._

---

## What got done this session

**Step 1 fully complete and committed (2 commits):**

1. **Scaffold + data layer** (`61f6c2c`):
   - All config files: `package.json`, `tsconfig.json` (strict), `vite.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `vitest.config.ts`, `.gitignore`, `.env.example`, `index.html`
   - `src/types/index.ts` — all shared interfaces (TypeName, GameMeta, PokemonData, MoveData, TeamMember, OpponentState, SessionOverride, DexCorrection, ResolvedOpponent, MatchupScore, ConfidenceField, etc.)
   - `src/lib/dex.ts` — async `createDex(gameId)` factory; ability immunity map; `getSpriteUrl` using `nationalId`
   - `src/lib/storage.ts` — typed localStorage with Zod validation
   - `src/lib/utils.ts` — clamp, formatNumber, fuzzyMatch, capitalize
   - `src/data/games/index.ts` — GAME_REGISTRY with one-line-per-game pattern
   - `src/data/games/unbound-2.1/meta.json` + `type-chart.json` (Gen 6 18×18, hardcoded)
   - `src/hooks/useGameProfile.ts` — async dex load, switchGame, localStorage persistence
   - `src/components/layout/Header.tsx` + `Layout.tsx`
   - `src/App.tsx` stub — shows "N species · N moves" on dex load
   - `scripts/transform-borrius.ts` — one-time data transform

2. **Transform script fix + supplement system** (`e4fc44f`):
   - Fixed: raw JSON is `[{ info, pokemon: [...] }]` not a flat array (script was reading 1 entry and skipping it)
   - Fixed: `level_learned_at` is stored as strings in the raw JSON
   - Added `scripts/supplement-pokemon.json` — Serperior, Swanna, Lunala (not in Borrius regional dex)
   - Added `scripts/supplement-moves.json` — Moongeist Beam (Ghost/Special/100) and other Gen 7+ moves
   - Added `PokemonData.nationalId?: number` for PokeAPI sprite URL fallback
   - Final output: **506 Pokémon, 585 moves**

---

## Current build state

**Step 1 ✅ complete.** `npm run dev` shows:
- Header with "Pokémon Unbound 2.1" game selector
- Body: "✓ Dex loaded: unbound-2.1 · 506 species · 585 moves"
- `npx tsc --noEmit` passes clean
- Vite build succeeds (pokemon.json + moves.json split as lazy chunks)

**Steps 2–6: not started.**

All 6 team members are in the dex with correct types:
| Pokémon | Types | Source |
|---------|-------|--------|
| Serperior | Grass | supplement |
| Swanna | Water/Flying | supplement |
| Magmortar | Fire | Borrius dex |
| Garchomp | Dragon/Ground | Borrius dex |
| Aggron | Steel/Rock | Borrius dex |
| Lunala | Psychic/Ghost | supplement |

---

## Files with uncommitted changes

None. Working tree is clean as of `e4fc44f`.

---

## Open questions (ask the user before assuming)

_None pending from this session. All key design decisions were settled upfront:_
- Stats: manual actual in-game stats (no EVs/IVs)
- Abilities: type-nullifying only (Levitate, Flash Fire, Water Absorb, etc.)
- Opponent unknown moveset: best STAB per type from learnset
- Data source: Borrius scraper + supplement files for non-regional Pokémon

---

## Known issues / sketchy code

- **`scripts/supplement-pokemon.json` uses stub move lists** — the learnsets for Serperior, Swanna, and Lunala are hand-written approximations. They're fine for opponent estimation (the scoring only cares about "best STAB move per type"), but won't show every move in the team builder's move selector. If the user wants complete learnsets for these Pokémon, they'll need to edit the supplement file.

- **Supplement moves without dex data get `Normal/Status/null/null` placeholders** — only affects moves referenced in supplement Pokémon learnsets that aren't in any Borrius Pokémon's learnset AND aren't in `supplement-moves.json`. Currently only Moongeist Beam was affected (now fixed). If the user adds more supplement Pokémon with exotic signature moves, they'll need to add those moves to `supplement-moves.json` too.

- **`getSpriteUrl` in `dex.ts` falls back to pokemondb.net** for Pokémon without a `nationalId`. Non-vanilla Unbound-specific species won't have working sprites until Step 6 adds local sprite files.

- **Dynamic import pattern in `dex.ts`** (lines 44-47): Vite handles `import('../data/games/${gameId}/pokemon.json')` correctly only because gameId values are known at build time. If someone passes a completely novel gameId at runtime that wasn't in the registry, the import will throw. The `getRegisteredGame` check above it prevents this, but it's worth knowing.

---

## Next 3 tasks (in order)

### 1. `src/hooks/useTeam.ts`
```typescript
// Storage key: `team:${gameId}`
// Team is always 6 slots; empty slots are null.
interface UseTeam {
  team: (TeamMember | null)[];
  setMember(index: number, member: TeamMember | null): void;
  clearTeam(): void;
  isComplete: boolean;
}
// Use crypto.randomUUID() for TeamMember.id at creation time.
// Validate with Zod on localStorage read (schema for TeamMember array).
```

### 2. Shared components needed by team builder
- `src/components/shared/SearchableDropdown.tsx` — fuzzy-search dropdown; props: `options`, `getLabel`, `getValue`, `value`, `onChange`, `placeholder`; keyboard nav (arrows, Enter, Escape)
- `src/components/shared/Modal.tsx` — portal-based overlay with backdrop click to close
- `src/components/shared/Spinner.tsx`
- `src/components/shared/ErrorBanner.tsx`

### 3. Team builder components
```
src/components/team/
  TeamPanel.tsx       — 6-slot grid in App.tsx, "Edit Team" button
  TeamMemberCard.tsx  — compact slot: species name, types, move names
  TeamEditor.tsx      — Modal wrapper, tab/list of 6 MemberForms
  MemberForm.tsx      — one Pokémon: species SearchableDropdown (autocompletes dex)
                        → auto-fills dex baseStats as defaults (editable)
                        → 4× MoveSlotInput, ability dropdown, level, heldItem free-text
  MoveSlotInput.tsx   — SearchableDropdown filtered to species learnset first, then all moves
  StatInput.tsx       — labeled number input for a single stat
```

**Verify Step 2 works:** Build a team with Serperior/Swanna/Magmortar/Garchomp/Aggron/Lunala. Stats auto-fill from dex. Refresh → team persists. Switch game profile → team clears (different localStorage key).

---

## Things said in chat not yet in code

- User hasn't specified a visual preference for the team panel layout (row of 6 cards vs grid). Default to a horizontal row of compact cards in `TeamPanel.tsx` — easy to change.
- Keyboard shortcuts (Ctrl+K for opponent search, Tab through fields, Enter to confirm) are planned for Step 6 — don't add them to Step 2 components.
- User mentioned the app needs to be "fast" — no debouncing needed on the searchable dropdown filter (it's filtering in-memory over 506 names, which is instant).
