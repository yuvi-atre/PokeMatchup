/**
 * One-time transform: borrius_pokedex_data.json → pokemon.json + moves.json
 *
 * Usage:
 *   1. Download borrius_pokedex_data.json from:
 *      https://github.com/nMckenryan/Borrius-Pokedex-Scraper/raw/main/scraperData/borrius_pokedex_data.json
 *   2. Place it in scripts/borrius_pokedex_data.json
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

// All 18 valid type names (Gen 6 chart).
const VALID_TYPES = new Set([
  'Normal','Fire','Water','Electric','Grass','Ice','Fighting','Poison',
  'Ground','Flying','Psychic','Bug','Rock','Ghost','Dragon','Dark','Steel','Fairy',
]);

const VALID_CATEGORIES = new Set(['Physical', 'Special', 'Status']);

// Normalize a type string from the scraper to our TypeName format.
function normalizeType(raw: string): string | null {
  const t = raw.trim();
  // Title-case it.
  const normalized = t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
  // Handle "Sp. Atk" style misreads (shouldn't appear but guard anyway).
  return VALID_TYPES.has(normalized) ? normalized : null;
}

function normalizeCategory(raw: string): string {
  const c = raw.trim();
  if (VALID_CATEGORIES.has(c)) return c;
  // Scraper sometimes returns lowercase.
  const titled = c.charAt(0).toUpperCase() + c.slice(1).toLowerCase();
  return VALID_CATEGORIES.has(titled) ? titled : 'Status';
}

function parsePower(raw: string | number | undefined): number | null {
  if (raw === undefined || raw === null || raw === '-' || raw === '') return null;
  const n = Number(raw);
  return isNaN(n) || n <= 0 ? null : n;
}

function parseAccuracy(raw: string | number | undefined): number | null {
  if (raw === undefined || raw === null || raw === '-' || raw === '') return null;
  // Accuracy may be stored as "100" or 100.
  const s = String(raw).replace('%', '');
  const n = Number(s);
  return isNaN(n) ? null : n;
}

function normalizeMethod(raw: string): 'level-up' | 'machine' | 'tutor' {
  const r = raw.toLowerCase();
  if (r.includes('level')) return 'level-up';
  if (r.includes('machine') || r.includes('tm') || r.includes('hm')) return 'machine';
  return 'tutor';
}

function normalizeAbilitySlot(raw: string | number): 1 | 2 | 'hidden' {
  if (raw === 1 || raw === '1') return 1;
  if (raw === 2 || raw === '2') return 2;
  const s = String(raw).toLowerCase();
  if (s.includes('hidden') || s.includes('h')) return 'hidden';
  return 1;
}

// ------------------------------------------------------------------

interface RawMove {
  name: string;
  type: string;
  category: string;
  power: string | number;
  accuracy: string | number;
  level_learned_at: number;
  method: string;
}

interface RawAbility {
  ability_name: string;
  slot: string | number;
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
  id: number;
  name: string;
  types: string[];
  stats: RawStats;
  abilities: RawAbility[];
  moves: RawMove[];
}

// ------------------------------------------------------------------

const inputPath = path.join(__dirname, 'borrius_pokedex_data.json');
if (!fs.existsSync(inputPath)) {
  console.error(`Error: ${inputPath} not found.`);
  console.error('Download it from:');
  console.error('  https://github.com/nMckenryan/Borrius-Pokedex-Scraper/raw/main/scraperData/borrius_pokedex_data.json');
  process.exit(1);
}

const raw: RawPokemon[] = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
console.log(`Read ${raw.length} Pokémon from borrius_pokedex_data.json`);

// Collect all unique moves across the full dex.
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
  // Validate and map types.
  const types: string[] = [];
  for (const t of p.types ?? []) {
    const nt = normalizeType(t);
    if (nt) types.push(nt);
  }
  if (types.length === 0) {
    console.warn(`  Skipping ${p.name} — no valid types`);
    skippedPokemon++;
    continue;
  }

  // Map abilities.
  const abilities = (p.abilities ?? []).map((a) => ({
    name: a.ability_name?.trim() ?? 'Unknown',
    slot: normalizeAbilitySlot(a.slot),
  }));

  // Map learnset, building the movesMap as we go.
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

    // Deduplicate learnset entries by name (some Pokémon list a move via multiple methods).
    if (!seenMoveNames.has(key)) {
      seenMoveNames.add(key);
      const method = normalizeMethod(m.method ?? 'level-up');
      const entry: Record<string, unknown> = { moveName, method };
      if (method === 'level-up' && m.level_learned_at > 0) {
        entry.levelLearnedAt = m.level_learned_at;
      }
      learnset.push(entry);
    }
  }

  pokemonOut.push({
    id: p.id,
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
