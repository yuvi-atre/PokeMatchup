# PokeMatchup — Handoff

_Last updated: 2026-05-24. Overwrite this file each session._

---

## What got done this session

**Step 3 fully complete (opponent selector + scoring + recommendations):**

### New files
| File | Purpose |
|------|---------|
| `src/lib/damage.ts` | Pure scoring engine: `computeMatchup`, `getDefaultOpponentMoves`, `ScoringConfig`, `DEFAULT_SCORING_CONFIG` |
| `src/hooks/useDexCorrections.ts` | Persistent dex corrections in localStorage (`dexCorrections:<gameId>`) |
| `src/hooks/useOpponent.ts` | Session opponent state + override management; computes `resolved` via 3-layer pipeline |
| `src/hooks/useMatchup.ts` | `useMemo` wrapper over `computeMatchup` |
| `src/components/opponent/OpponentPanel.tsx` | Opponent species/level/type/move UI with override indicators |
| `src/components/recommendation/ScoreBreakdown.tsx` | Expandable calc detail (off/def/speed/score formula) |
| `src/components/recommendation/RecommendationPanel.tsx` | Ranked matchup list; top pick highlighted in blue |

### Modified files
- `src/App.tsx` — wires all Step 3 hooks; two-column layout (opponent | recommendations)
- `CLAUDE.md` — marked Step 3 complete

---

## Current build state

**Steps 1, 2, 3 ✅ complete.**

- `npx tsc --noEmit` passes clean
- `npm run build` succeeds
- `npm run dev` serves at `localhost:5173`

**Manual smoke test to do:**
1. Build team (Serperior/Swanna/Magmortar/Garchomp/Aggron/Lunala with real levels + stats)
2. Search "Garchomp" as opponent → types fill as Dragon/Ground
3. Recommendations panel shows ranked matchup: Aggron/Serperior near top, Magmortar near bottom (Fire weak to Ground)
4. Set opponent level → scores recalculate (opponent stat estimates update)
5. Override type 2 from Ground to Water → rankings shift
6. "Reset to dex defaults" → types snap back to Dragon/Ground
7. Clear opponent → panel returns to "Select an opponent" state
8. Refresh → opponent is gone, team persists

---

## Files with uncommitted changes

All Step 3 files are uncommitted. Run git add + commit to push.

---

## Scoring model (locked in `damage.ts`)

```typescript
DEFAULT_SCORING_CONFIG = { W_OFF: 1.0, W_DEF: 0.8, SPEED_BONUS: 20, ONESHOT_PENALTY: 60 }

offensiveScore = best(estimateDamage(level, power, myAtk/SpA, oppDef/SpD, eff, stab))
defensiveScore = worst(estimateDamage(oppLevel, power, oppAtk/SpA, myDef/SpD, eff, stab))
finalScore = W_OFF*off - W_DEF*def + (faster ? SPEED_BONUS : 0) - (oneShot ? ONESHOT_PENALTY : 0)

// estimateDamage: ((2*level/5+2) * power * (atk/def) / 50 + 2) * eff * stab
// Opponent stats: simplified formula ((2*base*level)/100 + 5), no EVs/IVs/nature
```

Tweak weights by editing `DEFAULT_SCORING_CONFIG` in `damage.ts`.

---

## Correction / override pipeline (locked in)

```
base dex types → DexCorrection (localStorage) → SessionOverride (React state) → ResolvedOpponent
```

- `useDexCorrections(gameId)` — persistent, survives refresh
- `useOpponent(getCorrection)` — session only, cleared on opponent change
- Resolution lives in `useOpponent`'s `useMemo`

---

## Open questions

None. All design decisions are locked per HANDOFF + PRD.

---

## Known issues / sketchy code

- **Opponent move display in OpponentPanel**: estimated moves show as italic hint text below the dropdown. If the user sets an explicit move, the hint disappears. This is slightly awkward — consider showing estimated moves as a greyed-out value inside the dropdown placeholder in a future polish pass.
- **No "Save dex correction" button yet**: `useDexCorrections` is wired but the OpponentPanel only shows session overrides. A "This species has wrong types in the dex → save permanently" button needs a small UI addition (a link/button below the types row that calls `addCorrection`). Defer to Step 6 polish.
- **Supplement Pokémon learnset stubs** (Serperior, Swanna, Lunala) — scoring uses approximated learnsets. Opponent estimation will be slightly off for these species.

---

## Next task: Step 4 — Screenshot OCR for team entry

### Files to build:

#### 1. `src/lib/ocr.ts`
```typescript
// POST image (base64) to Anthropic API with structured JSON prompt
// Returns OCRSummaryResult (species, level, stats×6, moves×4, ability, heldItem)
// Each field is ConfidenceField<T> — low confidence → yellow highlight
// API key from import.meta.env.VITE_ANTHROPIC_API_KEY
// Model: claude-sonnet-4-5 or newer per CLAUDE.md
```

#### 2. `src/hooks/useScreenshot.ts`
```typescript
// FileReader → base64
// Calls ocr.ts
// Returns { uploadScreenshot, ocrResult, isProcessing, ocrError }
```

#### 3. Team entry integration
- Add "Upload screenshot" button to `MemberForm` (or a new `ScreenshotUploadButton` component)
- On OCR complete: pre-fill all fields with `ConfidenceField` values
- Low-confidence fields get yellow border highlight (so user knows to double-check)
- Editing any pre-filled field promotes it to `'high'` confidence

### Verify Step 4 works:
- Upload a real Pokémon summary screenshot
- Fields auto-fill; low-confidence ones are highlighted yellow
- Edit a field → yellow goes away
- Confirm → member saved as normal

---

## Things said in chat not yet in code

- **OCR alternatives for Step 4**: Anthropic primary. Tesseract.js (in-browser, free) for plain-text fallback. Google Cloud Vision / Gemini Vision as alternatives.
- **Keyboard shortcuts** (Ctrl+K for opponent search, Tab/Enter nav) — Step 6.
- **Sprites** — Step 6 (getSpriteUrl is implemented but not used in UI yet).
