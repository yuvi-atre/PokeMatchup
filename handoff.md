# PokeMatchup — Handoff

_Last updated: 2026-05-14. Overwrite this file each session._

---

## What got done this session

**Step 2 fully complete (team builder):**

### New files
| File | Purpose |
|------|---------|
| `src/hooks/useTeam.ts` | 6-slot team state, Zod-validated localStorage, `team:<gameId>` key |
| `src/components/shared/Spinner.tsx` | Loading spinner (sm/md/lg) |
| `src/components/shared/ErrorBanner.tsx` | Red error banner with optional dismiss |
| `src/components/shared/Modal.tsx` | Portal-based modal, Escape closes, backdrop click closes |
| `src/components/shared/SearchableDropdown.tsx` | Fuzzy-search dropdown, full keyboard nav (↑↓ Enter Esc) |
| `src/components/team/StatInput.tsx` | Labeled number input for a single stat (1–999) |
| `src/components/team/MoveSlotInput.tsx` | Move dropdown, species learnset moves listed first |
| `src/components/team/MemberForm.tsx` | Full single-Pokémon form (species, level, stats, ability, item, 4 moves) |
| `src/components/team/TeamMemberCard.tsx` | Compact card showing species, types, level, top 2 moves |
| `src/components/team/TeamEditor.tsx` | Modal with 6 tab buttons at top, one MemberForm at a time, Prev/Next nav |
| `src/components/team/TeamPanel.tsx` | 6-slot card grid + "Edit Team" button + "Clear all" |

### Modified files
- `src/App.tsx` — swapped dex-loaded stub for `<TeamPanel>` + opponent placeholder
- `CLAUDE.md` — marked Step 2 complete

### Key decisions locked in this session
- **TeamEditor is one-at-a-time**: slot tabs at top, one MemberForm visible at a time, Prev/Next arrows at bottom.
- **Move auto-fill trigger = species selection**: when you pick a species, moves auto-fill to the last 4 level-up moves learned at or below the current level. Changing level after that does NOT reset moves (user has already customized them).
- **`tsconfig.json` change**: removed `baseUrl: "."` and `scripts` from `include` (intentional, avoids TS error). Flag if `@/*` path alias starts misbehaving — Vite resolves it independently so it's fine at runtime.

---

## Current build state

**Steps 1 + 2 ✅ complete.**

- `npx tsc --noEmit` passes clean
- `npm run build` succeeds
- `npm run dev` serves at `localhost:5173`

**UI smoke test to do manually:**
1. Open `localhost:5173`
2. Click any empty slot card → TeamEditor opens on that slot
3. Search for "Serperior" in Species dropdown → stats fill from dex, moves auto-fill at level
4. Switch to Slot 2 via tab → fill in Swanna
5. Continue for all 6 (Serperior, Swanna, Magmortar, Garchomp, Aggron, Lunala)
6. Refresh → team persists
7. Switch game (if another profile exists) → team clears

---

## Files with uncommitted changes

All new/modified files are uncommitted. `git status` will show them all dirty.

---

## Open questions (ask before assuming)

None from this session. All design decisions above were confirmed by user.

---

## Known issues / sketchy code

- **`tsconfig.json` missing `baseUrl`**: `paths` entry `@/*` without `baseUrl` is technically non-standard. Works at runtime because Vite handles it, but `tsc --noEmit` in standalone mode may not resolve `@/*` imports correctly in the future. Watch for any TS import errors on `@/` paths.
- **`TeamEditor` doesn't reset `activeSlot` when re-opened on a new slot.** `initialSlot` prop only sets the initial state; if the user opens slot 3, closes, then clicks slot 5 from `TeamPanel`, the editor will correctly open on slot 5 because `TeamPanel` passes `editingSlot` as `initialSlot`. But since `useState` ignores prop changes after mount, the editor only picks up the new `initialSlot` if it was unmounted (which it is, since the Modal is conditionally rendered). This is correct behavior — verify it still works.
- **Supplement Pokémon learnsets are stubs** (Serperior, Swanna, Lunala) — only approximations in `scripts/supplement-pokemon.json`. Move auto-fill will give roughly-correct results but won't match every exact level-up move.

---

## Next task: Step 3 — Opponent selector + scoring + recommendations

### Files to build (in order):

#### 1. `src/lib/damage.ts`
```typescript
// Pure scoring, no React, no localStorage.
// ScoringConfig with weights: W_OFF, W_DEF, SPEED_BONUS, ONESHOT_PENALTY
// computeMatchup(team, resolved, dex, config?) -> MatchupScore[]
// getDefaultMoves(species: PokemonData, dex: Dex) -> MoveData[]
//   — best STAB move per type from learnset (used when opponent moves are unknown)
```

#### 2. `src/hooks/useOpponent.ts`
```typescript
// Session state: OpponentState + SessionOverride (cleared when opponent changes)
// setOpponentByName(name: string, dex: Dex) — auto-fills types from dex
// applyOverride(override: Partial<SessionOverride>) — merges into override state
// resetOverrides() — clears session overrides
// resolvedOpponent: ResolvedOpponent | null
```

#### 3. `src/hooks/useDexCorrections.ts`
```typescript
// localStorage key: `dexCorrections:<gameId>`
// addCorrection(c: DexCorrection) / removeCorrection(species: string)
// getCorrection(species: string): DexCorrection | undefined
```

#### 4. `src/hooks/useMatchup.ts`
```typescript
// useMemo over team + resolvedOpponent + dex -> MatchupScore[]
// Calls damage.computeMatchup
```

#### 5. Opponent components
```
src/components/opponent/
  OpponentPanel.tsx       — species SearchableDropdown, shows resolved types/level
  OverrideField.tsx       — pencil icon to edit any field inline
src/components/recommendation/
  RecommendationPanel.tsx — ranked list of MatchupScore[]
  ScoreBreakdown.tsx      — expandable calc detail per member
```

### Verify Step 3 works:
- Select Garchomp as opponent → see Serperior at bottom, Aggron/Magmortar near top
- Override opponent type → recommendations recompute instantly
- Refresh → opponent state is gone (session only), but team persists

---

## Things said in chat not yet in code

- **OCR alternatives**: user is thinking ahead. For Step 4, keep Anthropic as primary. Tesseract.js (free, in-browser) worth considering as fallback for plain-text fields. Google Cloud Vision and Gemini Vision are also viable alternatives.
- **Keyboard shortcuts** (Ctrl+K opponent search, Tab/Enter nav) — deferred to Step 6.
