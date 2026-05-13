/**
 * One-time transform: borrius_pokedex_data.json → pokemon.json + moves.json
 *
 * Usage:
 *   1. Download borrius_pokedex_data.json from:
 *      https://github.com/nMckenryan/Borrius-Pokedex-Scraper/raw/main/scraperData/borrius_pokedex_data.json
 *   2. Place it at scripts/borrius_pokedex_data.json
 *   3. Run: npx tsx scripts/transform-borrius.ts
 *
 * Outputs:
 *   src/data/games/unbound-2.1/pokemon.json
 *   src/data/games/unbound-2.1/moves.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const VALID_TYPES = new Set([
  'Normal','Fire','Water','Electric','Grass','Ice','Fighting','Poison',
  'Ground','Flying','Psychic','Bug','Rock','Ghost','Dragon','Dark','Steel','Fairy',
]);

const VALID_CATEGORIES = new Set(['Physical', 'Special', 'Status']);

function normalizeType(raw: string): string | null {
  if (!raw) return null;
  const t = raw.trim();
  const normalized = t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
  return VALID_TYPES.has(normalized) ? normalized : null;
}

function normalizeCategory(raw: string): string {
  const c = (raw ?? '').trim();
  if (VALID_CATEGORIES.has(c)) return c;
  const titled = c.charAt(0).toUpperCase() + c.slice(1).toLowerCase();
  return VALID_CATEGORIES.has(titled) ? titled : 'Status';
}

function parsePower(raw: string | number | undefined | null): number | null {
  if (raw === undefined || raw === null || raw === '-' || raw === '') return null;
  const n = Number(raw);
  return isNaN(n) || n <= 0 ? null : n;
}

function parseAccuracy(raw: string | number | undefined | null): number | null {
  if (raw === undefined || raw === null || raw === '-' || raw === '') return null;
  const n = Number(String(raw).replace('%', ''));
  return isNaN(n) ? null : n;
}

// The scraper uses "level-up", "machine", "level-up&machine", "tutor", etc.
function normalizeMethod(raw: string): 'level-up' | 'machine' | 'tutor' {
  const r = (raw ?? '').toLowerCase();
  if (r.includes('level')) return 'level-up';
  if (r.includes('machine') || r.includes('tm') || r.includes('hm')) return 'machine';
  return 'tutor';
}

// ------------------------------------------------------------------
// Raw types matching the actual JSON structure.

interface RawMove {
  name: string;
  type: string;
  category: string;
  power: string | number | null;
  accuracy: string | number | null;
  level_learned_at: string | number;  // stored as string in this file
  method: string;
}

interface RawAbility {
  ability_name: string;
  slot: number;
}

interface RawStats {
  hp: { base_stat: number };
  attack: { base_stat: number };
  defense: { base_stat: number };
  specialAttack: { base_stat: number };
  specialDefense: { base_stat: number };
  speed: { base_stat: number };
}

interface RawPokemon {
  id: number;          // Borrius dex number
  national_id: number; // national dex number (used for sprite URL)
  name: string;
  types: string[];
  stats: RawStats;
  abilities: RawAbility[];
  moves: RawMove[];
}

// The file is: [ { info: {...}, pokemon: RawPokemon[] } ]
interface RawFile {
  info: unknown;
  pokemon: RawPokemon[];
}

// ------------------------------------------------------------------

const inputPath = path.join(__dirname, 'borrius_pokedex_data.json');
if (!fs.existsSync(inputPath)) {
  console.error(`Error: ${inputPath} not found.`);
  console.error('Download from:');
  console.error('  https://github.com/nMckenryan/Borrius-Pokedex-Scraper/raw/main/scraperData/borrius_pokedex_data.json');
  process.exit(1);
}

// Supplement files for Pokémon/moves not in the Borrius regional dex.
const supplementPath = path.join(__dirname, 'supplement-pokemon.json');
const supplementMovesPath = path.join(__dirname, 'supplement-moves.json');

// Pre-load move supplements so we can use correct data instead of placeholders.
interface SupplementMove { name: string; type: string; category: string; power: number | null; accuracy: number | null }
const supplementMovesData: SupplementMove[] = fs.existsSync(supplementMovesPath)
  ? JSON.parse(fs.readFileSync(supplementMovesPath, 'utf-8'))
  : [];
const supplementMovesMap = new Map<string, SupplementMove>(
  supplementMovesData.map((m) => [m.name.toLowerCase(), m]),
);

const fileContents: RawFile[] = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

// The file wraps everything in a single-element array.
const raw: RawPokemon[] = fileContents[0]?.pokemon ?? [];
console.log(`Read ${raw.length} Pokémon from borrius_pokedex_data.json`);

const movesMap = new Map<string, {
  name: string;
  type: string;
  category: string;
  power: number | null;
  accuracy: number | null;
}>();

const pokemonOut: unknown[] = [];
let skippedPokemon = 0;
let skippedMoves = 0;

for (const p of raw) {
  // Validate types.
  const types: string[] = [];
  for (const t of p.types ?? []) {
    const nt = normalizeType(t);
    if (nt) types.push(nt);
  }
  if (types.length === 0) {
    console.warn(`  Skipping ${p.name ?? 'unknown'} — no valid types`);
    skippedPokemon++;
    continue;
  }

  // Map abilities. The scraper sets slot=1 for all; assign slots by position.
  const abilities = (p.abilities ?? []).slice(0, 3).map((a, idx) => ({
    name: a.ability_name?.trim() ?? 'Unknown',
    slot: idx === 0 ? 1 : idx === 1 ? 2 : 'hidden',
  }));

  // Map moves, building movesMap as we go.
  const learnset: unknown[] = [];
  const seenMoveNames = new Set<string>();

  for (const m of p.moves ?? []) {
    const moveName = m.name?.trim();
    if (!moveName) continue;

    const moveType = normalizeType(m.type);
    if (!moveType) {
      skippedMoves++;
      continue;
    }

    const key = moveName.toLowerCase();
    if (!movesMap.has(key)) {
      movesMap.set(key, {
        name: moveName,
        type: moveType,
        category: normalizeCategory(m.category),
        power: parsePower(m.power),
        accuracy: parseAccuracy(m.accuracy),
      });
    }

    // Deduplicate by name (some moves appear for multiple methods).
    if (!seenMoveNames.has(key)) {
      seenMoveNames.add(key);
      const method = normalizeMethod(m.method ?? 'level-up');
      const levelAt = Number(m.level_learned_at);
      const entry: Record<string, unknown> = { moveName, method };
      if (method === 'level-up' && !isNaN(levelAt) && levelAt > 0) {
        entry.levelLearnedAt = levelAt;
      }
      learnset.push(entry);
    }
  }

  pokemonOut.push({
    id: p.id,
    nationalId: p.national_id,  // kept for sprite URL lookup
    name: p.name,
    types: types.slice(0, 2),
    baseStats: {
      hp: p.stats.hp.base_stat,
      attack: p.stats.attack.base_stat,
      defense: p.stats.defense.base_stat,
      specialAttack: p.stats.specialAttack.base_stat,
      specialDefense: p.stats.specialDefense.base_stat,
      speed: p.stats.speed.base_stat,
    },
    abilities,
    learnset,
  });
}

// Merge supplements (Pokémon not in the Borrius regional dex).
// The supplement file is already in our internal format — just append.
if (fs.existsSync(supplementPath)) {
  const supplements: unknown[] = JSON.parse(fs.readFileSync(supplementPath, 'utf-8'));
  const existingNames = new Set(pokemonOut.map((p) => (p as { name: string }).name.toLowerCase()));
  let added = 0;
  for (const s of supplements) {
    const sp = s as { name: string; learnset?: Array<{ moveName: string }> };
    if (!existingNames.has(sp.name.toLowerCase())) {
      pokemonOut.push(s);
      existingNames.add(sp.name.toLowerCase());
      added++;
      // Register supplement moves that aren't already in the main dex.
      for (const entry of sp.learnset ?? []) {
        const key = entry.moveName.toLowerCase();
        if (!movesMap.has(key)) {
          const supp = supplementMovesMap.get(key);
          movesMap.set(key, supp
            ? { name: supp.name, type: supp.type, category: supp.category, power: supp.power, accuracy: supp.accuracy }
            : { name: entry.moveName, type: 'Normal', category: 'Status', power: null, accuracy: null }
          );
        }
      }
    }
  }
  console.log(`Merged ${added} supplement Pokémon from supplement-pokemon.json`);
}

const movesOut = Array.from(movesMap.values()).sort((a, b) =>
  a.name.localeCompare(b.name),
);

const pokemonPath = path.join(ROOT, 'src/data/games/unbound-2.1/pokemon.json');
const movesPath = path.join(ROOT, 'src/data/games/unbound-2.1/moves.json');

fs.writeFileSync(pokemonPath, JSON.stringify(pokemonOut, null, 2));
fs.writeFileSync(movesPath, JSON.stringify(movesOut, null, 2));

console.log(`\nWrote ${pokemonOut.length} Pokémon → ${pokemonPath}`);
console.log(`Wrote ${movesOut.length} moves    → ${movesPath}`);
if (skippedPokemon > 0) console.warn(`Skipped ${skippedPokemon} Pokémon with invalid types`);
if (skippedMoves > 0) console.warn(`Skipped ${skippedMoves} move entries with invalid types`);
