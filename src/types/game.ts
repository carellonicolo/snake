export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Theme = 'nokia' | 'arcade' | 'terminal';
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
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  startTime: number | null;
  gameTime: number;
}

export interface GameConfig {
  gridSize: number;
  cellSize: number;
  baseSpeed: number;
  difficulty: Difficulty;
  theme: Theme;
}

export interface ThemeColors {
  background: string;
  snake: string;
  snakeHead: string;
  food: string;
  powerUp: string;
  grid: string;
  text: string;
  border: string;
}

export const THEME_COLORS: Record<Theme, ThemeColors> = {
  nokia: {
    background: '#9bbc0f',
    snake: '#0f380f',
    snakeHead: '#306230',
    food: '#0f380f',
    powerUp: '#8bac0f',
    grid: '#8bac0f',
    text: '#0f380f',
    border: '#0f380f'
  },
  arcade: {
    background: '#1a1a2e',
    snake: '#00ff41',
    snakeHead: '#39ff14',
    food: '#ff073a',
    powerUp: '#f5d300',
    grid: '#16213e',
    text: '#eee',
    border: '#e94560'
  },
  terminal: {
    background: '#0d0d0d',
    snake: '#00ff00',
    snakeHead: '#33ff33',
    food: '#00ff00',
    powerUp: '#00cc00',
    grid: '#0a0a0a',
    text: '#00ff00',
    border: '#003300'
  }
};

export const DIFFICULTY_SETTINGS: Record<Difficulty, { speed: number; powerUpChance: number }> = {
  easy: { speed: 150, powerUpChance: 0.15 },
  medium: { speed: 100, powerUpChance: 0.1 },
  hard: { speed: 70, powerUpChance: 0.08 }
};
