export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameTheme = 'retro' | 'minimal' | 'minimal-dark' | 'futuristic' | 'ocean' | 'sunset' | 'candy' | 'sepia' | 'blood' | 'matrix' | 'frost' | 'vaporwave' | 'custom';
export type GameMode = 'classic' | 'endless';
export type PowerUpType = 'slowdown' | 'double_points' | 'invincibility';

export interface Position {
  x: number;
  y: number;
}

export interface Food {
  position: Position;
  value: number;
}

export interface PowerUp {
  position: Position;
  type: PowerUpType;
  duration: number;
}

export interface ActivePowerUp {
  type: PowerUpType;
  endTime: number;
}

export interface GameState {
  snake: Position[];
  food: Food;
  powerUp: PowerUp | null;
  activePowerUps: ActivePowerUp[];
  direction: Direction;
  score: number;
  combo: number;
  comboTimer: number;
  walls: Position[];
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  startTime: number | null;
  gameTime: number;
}

export interface GameConfig {
  theme: GameTheme;
  mode: GameMode;
  gridSize: number;
  speedMultiplier: number;
  enableWalls: boolean;
  powerUpsEnabled: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
  particlesEnabled: boolean;
  player1Nickname: string;
  player1Color: string;
}

export interface ThemeColors {
  background: string;
  foreground: string;
  snake: string;
  snakeHead: string;
  food: string;
  accent: string;
  glow?: string;
  grid?: string;
}

export const THEME_PRESETS: Record<GameTheme, ThemeColors> = {
  retro: {
    background: '0 0% 5%',
    foreground: '120 100% 50%',
    snake: '120 100% 50%',
    snakeHead: '60 100% 50%',
    food: '0 100% 50%',
    accent: '300 100% 50%',
    glow: '120 100% 50%',
  },
  minimal: {
    background: '0 0% 98%',
    foreground: '0 0% 10%',
    snake: '0 0% 30%',
    snakeHead: '0 0% 10%',
    food: '0 0% 50%',
    accent: '0 0% 50%',
  },
  'minimal-dark': {
    background: '0 0% 6%',
    foreground: '0 0% 90%',
    snake: '0 0% 70%',
    snakeHead: '0 0% 90%',
    food: '0 0% 50%',
    accent: '0 0% 45%',
  },
  futuristic: {
    background: '230 30% 8%',
    foreground: '200 100% 60%',
    snake: '180 100% 50%',
    snakeHead: '200 100% 70%',
    food: '320 100% 60%',
    accent: '260 100% 70%',
    glow: '200 100% 50%',
  },
  ocean: {
    background: '210 60% 12%',
    foreground: '185 80% 65%',
    snake: '175 90% 55%',
    snakeHead: '195 80% 70%',
    food: '180 100% 80%',
    accent: '200 90% 50%',
    glow: '185 80% 50%',
  },
  sunset: {
    background: '270 30% 12%',
    foreground: '30 100% 65%',
    snake: '20 100% 60%',
    snakeHead: '45 100% 70%',
    food: '280 70% 65%',
    accent: '350 80% 60%',
    glow: '30 100% 50%',
  },
  candy: {
    background: '300 20% 95%',
    foreground: '330 80% 55%',
    snake: '330 90% 65%',
    snakeHead: '280 70% 60%',
    food: '190 80% 55%',
    accent: '50 90% 60%',
  },
  sepia: {
    background: '35 30% 15%',
    foreground: '35 40% 70%',
    snake: '35 50% 65%',
    snakeHead: '40 50% 75%',
    food: '25 35% 55%',
    accent: '30 40% 50%',
  },
  blood: {
    background: '0 0% 4%',
    foreground: '0 85% 50%',
    snake: '0 90% 55%',
    snakeHead: '0 100% 60%',
    food: '0 70% 40%',
    accent: '0 80% 45%',
    glow: '0 90% 40%',
  },
  matrix: {
    background: '0 0% 2%',
    foreground: '120 100% 45%',
    snake: '120 100% 50%',
    snakeHead: '120 100% 60%',
    food: '120 80% 35%',
    accent: '120 90% 40%',
    glow: '120 100% 45%',
  },
  frost: {
    background: '210 30% 95%',
    foreground: '200 50% 40%',
    snake: '200 60% 50%',
    snakeHead: '195 70% 45%',
    food: '210 40% 60%',
    accent: '200 50% 70%',
  },
  vaporwave: {
    background: '270 40% 10%',
    foreground: '310 100% 70%',
    snake: '180 100% 60%',
    snakeHead: '50 100% 70%',
    food: '310 100% 65%',
    accent: '280 80% 60%',
    glow: '310 100% 60%',
  },
  custom: {
    background: '220 20% 10%',
    foreground: '0 0% 95%',
    snake: '210 100% 50%',
    snakeHead: '0 0% 100%',
    food: '0 80% 60%',
    accent: '45 100% 50%',
  },
};

export const DIFFICULTY_SETTINGS: Record<Difficulty, { speed: number; powerUpChance: number }> = {
  easy: { speed: 180, powerUpChance: 0.15 },
  medium: { speed: 110, powerUpChance: 0.1 },
  hard: { speed: 55, powerUpChance: 0.08 }
};
