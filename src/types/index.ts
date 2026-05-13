export type TypeName =
  | 'Normal' | 'Fire' | 'Water' | 'Electric' | 'Grass' | 'Ice'
  | 'Fighting' | 'Poison' | 'Ground' | 'Flying' | 'Psychic' | 'Bug'
  | 'Rock' | 'Ghost' | 'Dragon' | 'Dark' | 'Steel' | 'Fairy';

export const ALL_TYPES: TypeName[] = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy',
];

export type Confidence = 'high' | 'medium' | 'low';

export interface ConfidenceField<T> {
  value: T;
  confidence: Confidence;
}

export interface BaseStats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface GameMeta {
  id: string;
  name: string;
  generation: number;
  mechanics: {
    hasPhysSpecSplit: boolean;
    hasFairy: boolean;
    typeChartGen: number;
  };
}

export interface AbilityEntry {
  name: string;
  slot: 1 | 2 | 'hidden';
}

export interface LearnsetEntry {
  moveName: string;
  method: 'level-up' | 'machine' | 'tutor';
  levelLearnedAt?: number;
}

export interface PokemonData {
  id: number;
  name: string;
  types: [TypeName, TypeName?];
  baseStats: BaseStats;
  abilities: AbilityEntry[];
  learnset: LearnsetEntry[];
}

export interface MoveData {
  name: string;
  type: TypeName;
  category: 'Physical' | 'Special' | 'Status';
  power: number | null;
  accuracy: number | null;
}

export interface TeamMember {
  id: string;
  species: string;
  nickname?: string;
  level: number;
  stats: BaseStats;
  ability: string | null;
  heldItem: string | null;
  moves: [string | null, string | null, string | null, string | null];
}

export interface OCRBattleResult {
  species: ConfidenceField<string>;
  level: ConfidenceField<number | null>;
  hpPercent: ConfidenceField<number | null>;
  lastMove: ConfidenceField<string | null>;
}

export interface OCRSummaryResult {
  species: ConfidenceField<string>;
  level: ConfidenceField<number>;
  stats: {
    hp: ConfidenceField<number>;
    attack: ConfidenceField<number>;
    defense: ConfidenceField<number>;
    specialAttack: ConfidenceField<number>;
    specialDefense: ConfidenceField<number>;
    speed: ConfidenceField<number>;
  };
  moves: [
    ConfidenceField<string | null>,
    ConfidenceField<string | null>,
    ConfidenceField<string | null>,
    ConfidenceField<string | null>,
  ];
  ability: ConfidenceField<string | null>;
  heldItem: ConfidenceField<string | null>;
}

export interface OpponentState {
  species: string | null;
  level: number | null;
  type1: TypeName | null;
  type2: TypeName | null;
  ability: string | null;
  moves: [string | null, string | null, string | null, string | null];
  detectedBy: 'manual' | 'ocr' | null;
  ocrResult?: OCRBattleResult;
}

export interface SessionOverride {
  species?: string;
  level?: number;
  type1?: TypeName | null;
  type2?: TypeName | null;
  ability?: string | null;
  moves?: [string | null, string | null, string | null, string | null];
}

export interface DexCorrection {
  species: string;
  gameId: string;
  overrides: Partial<{
    types: [TypeName, TypeName?];
    abilities: string[];
  }>;
}

export interface ResolvedOpponent {
  species: string;
  level: number | null;
  types: [TypeName, TypeName?];
  ability: string | null;
  moves: [string | null, string | null, string | null, string | null];
  source: 'manual' | 'ocr';
}

export interface MoveScore {
  moveName: string;
  expectedDamage: number;
  effectiveness: number;
  isSTAB: boolean;
}

export interface ThreatEntry {
  moveType: TypeName;
  effectiveness: number;
}

export interface ScoreBreakdown {
  offCalc: string;
  defCalc: string;
  speedNote: string;
}

export interface MatchupScore {
  teamMember: TeamMember;
  offensiveScore: number;
  defensiveScore: number;
  speedFactor: 'faster' | 'slower' | 'unknown';
  finalScore: number;
  bestMove: MoveScore | null;
  allMoveScores: MoveScore[];
  threats: ThreatEntry[];
  breakdown: ScoreBreakdown;
}

export type TypeChart = Record<TypeName, Record<TypeName, number>>;
