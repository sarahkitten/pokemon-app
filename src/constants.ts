export const MAX_MATCH_DISTANCE = 2;

export const POKEMON_TYPES = [
  "All Types", "Normal", "Fire", "Water", "Electric", "Grass", "Ice", 
  "Fighting", "Poison", "Ground", "Flying", "Psychic", "Bug", 
  "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy"
];

export interface Generation {
  name: string;
  startId: number;
  endId: number;
  total: number;
}

export const GENERATIONS: Generation[] = [
  { name: "All Generations", startId: 1, endId: 1008, total: 1008 },
  { name: "Gen 1 (Kanto)", startId: 1, endId: 151, total: 151 },
  { name: "Gen 2 (Johto)", startId: 152, endId: 251, total: 100 },
  { name: "Gen 3 (Hoenn)", startId: 252, endId: 386, total: 135 },
  { name: "Gen 4 (Sinnoh)", startId: 387, endId: 493, total: 107 },
  { name: "Gen 5 (Unova)", startId: 494, endId: 649, total: 156 },
  { name: "Gen 6 (Kalos)", startId: 650, endId: 721, total: 72 },
  { name: "Gen 7 (Alola)", startId: 722, endId: 809, total: 88 },
  { name: "Gen 8 (Galar)", startId: 810, endId: 905, total: 96 },
  { name: "Gen 9 (Paldea)", startId: 906, endId: 1008, total: 103 },
];

export const UI_CONSTANTS = {
    SMALL_SCREEN_BREAKPOINT: 700,
    CONFETTI_ANIMATION_DURATION: 1500,
    INPUT_FOCUS_DELAY: 10,
    MAX_FILTER_ATTEMPTS: 50,
} as const;

export const TIME_TRIAL = {
  DIFFICULTY: {
    EASY: { initialTime: 120, timePerCatch: 15, name: 'Easy' },
    MEDIUM: { initialTime: 90, timePerCatch: 10, name: 'Medium' },
    HARD: { initialTime: 5, timePerCatch: 5, name: 'Hard' }
  },
  POKEMON_COUNT_CATEGORIES: {
    VERY_FEW: { name: '1-5', min: 1, max: 5 },
    FEW: { name: '6-20', min: 6, max: 20 },
    SOME: { name: '21-50', min: 21, max: 50 },
    MANY: { name: '50+', min: 50, max: Number.MAX_SAFE_INTEGER },
    ALL: { name: 'All', min: 1, max: Number.MAX_SAFE_INTEGER }
  },
  COUNTDOWN_SECONDS: 3,
  MIN_TIME_REMAINING: 0
} as const;