import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  GameState, 
  GameConfig, 
  Direction, 
  Position, 
  Food, 
  PowerUp, 
  PowerUpType,
  ActivePowerUp,
  DIFFICULTY_SETTINGS 
} from '@/types/game';

const GRID_SIZE = 20;
const CELL_SIZE = 20;

const getInitialState = (): GameState => ({
  snake: [{ x: 10, y: 10 }],
  food: { position: { x: 15, y: 15 }, value: 10 },
  powerUp: null,
  activePowerUps: [],
  direction: 'RIGHT',
  score: 0,
  isPlaying: false,
  isPaused: false,
  isGameOver: false,
  startTime: null,
  gameTime: 0,
});

const getRandomPosition = (snake: Position[]): Position => {
  let position: Position;
  do {
    position = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some(seg => seg.x === position.x && seg.y === position.y));
  return position;
};

const generateFood = (snake: Position[]): Food => ({
  position: getRandomPosition(snake),
  value: 10,
});

const generatePowerUp = (snake: Position[], food: Food): PowerUp | null => {
  const types: PowerUpType[] = ['slowdown', 'double_points', 'invincibility'];
  const type = types[Math.floor(Math.random() * types.length)];
  let position: Position;
  do {
    position = getRandomPosition(snake);
  } while (position.x === food.position.x && position.y === food.position.y);
  
  return {
    position,
    type,
    duration: type === 'slowdown' ? 5000 : type === 'double_points' ? 8000 : 3000,
  };
};

export function useGameEngine(config: GameConfig) {
  const [state, setState] = useState<GameState>(getInitialState());
  const directionRef = useRef<Direction>('RIGHT');
  const gameLoopRef = useRef<number | null>(null);
  const powerUpTimerRef = useRef<number | null>(null);

  const getSpeed = useCallback(() => {
    const baseSpeed = DIFFICULTY_SETTINGS[config.difficulty].speed;
    const hasSlowdown = state.activePowerUps.some(p => p.type === 'slowdown');
    return hasSlowdown ? baseSpeed * 1.5 : baseSpeed;
  }, [config.difficulty, state.activePowerUps]);

  const hasDoublePoints = useCallback(() => {
    return state.activePowerUps.some(p => p.type === 'double_points');
  }, [state.activePowerUps]);

  const hasInvincibility = useCallback(() => {
    return state.activePowerUps.some(p => p.type === 'invincibility');
  }, [state.activePowerUps]);

  const checkCollision = useCallback((head: Position, snake: Position[]): boolean => {
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true;
    }
    if (hasInvincibility()) return false;
    return snake.slice(1).some(seg => seg.x === head.x && seg.y === head.y);
  }, [hasInvincibility]);

  const moveSnake = useCallback(() => {
    setState(prev => {
      if (!prev.isPlaying || prev.isPaused || prev.isGameOver) return prev;

      const head = { ...prev.snake[0] };
      const direction = directionRef.current;

      switch (direction) {
        case 'UP': head.y -= 1; break;
        case 'DOWN': head.y += 1; break;
        case 'LEFT': head.x -= 1; break;
        case 'RIGHT': head.x += 1; break;
      }

      if (checkCollision(head, prev.snake)) {
        return { ...prev, isGameOver: true, isPlaying: false };
      }

      const newSnake = [head, ...prev.snake];
      let newScore = prev.score;
      let newFood = prev.food;
      let newPowerUp = prev.powerUp;
      let newActivePowerUps = [...prev.activePowerUps];
      let powerUpsCollected = 0;

      // Check food collision
      if (head.x === prev.food.position.x && head.y === prev.food.position.y) {
        const points = hasDoublePoints() ? prev.food.value * 2 : prev.food.value;
        newScore += points;
        newFood = generateFood(newSnake);
        
        // Chance to spawn power-up
        if (!prev.powerUp && Math.random() < DIFFICULTY_SETTINGS[config.difficulty].powerUpChance) {
          newPowerUp = generatePowerUp(newSnake, newFood);
        }
      } else {
        newSnake.pop();
      }

      // Check power-up collision
      if (prev.powerUp && head.x === prev.powerUp.position.x && head.y === prev.powerUp.position.y) {
        const activePowerUp: ActivePowerUp = {
          type: prev.powerUp.type,
          endTime: Date.now() + prev.powerUp.duration,
        };
        newActivePowerUps.push(activePowerUp);
        newPowerUp = null;
        powerUpsCollected = 1;
      }

      // Clean expired power-ups
      newActivePowerUps = newActivePowerUps.filter(p => p.endTime > Date.now());

      return {
        ...prev,
        snake: newSnake,
        food: newFood,
        powerUp: newPowerUp,
        activePowerUps: newActivePowerUps,
        score: newScore,
        direction,
        gameTime: prev.startTime ? Math.floor((Date.now() - prev.startTime) / 1000) : 0,
      };
    });
  }, [checkCollision, config.difficulty, hasDoublePoints]);

  const startGame = useCallback(() => {
    const initial = getInitialState();
    initial.isPlaying = true;
    initial.startTime = Date.now();
    initial.food = generateFood(initial.snake);
    directionRef.current = 'RIGHT';
    setState(initial);
  }, []);

  const pauseGame = useCallback(() => {
    setState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  }, []);

  const resetGame = useCallback(() => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
    setState(getInitialState());
    directionRef.current = 'RIGHT';
  }, []);

  const changeDirection = useCallback((newDirection: Direction) => {
    const opposites: Record<Direction, Direction> = {
      UP: 'DOWN',
      DOWN: 'UP',
      LEFT: 'RIGHT',
      RIGHT: 'LEFT',
    };
    
    if (opposites[newDirection] !== directionRef.current) {
      directionRef.current = newDirection;
    }
  }, []);

  // Game loop
  useEffect(() => {
    if (!state.isPlaying || state.isPaused || state.isGameOver) {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }

    const speed = getSpeed();
    gameLoopRef.current = window.setInterval(moveSnake, speed);

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [state.isPlaying, state.isPaused, state.isGameOver, moveSnake, getSpeed]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!state.isPlaying) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          changeDirection('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          changeDirection('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          changeDirection('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          changeDirection('RIGHT');
          break;
        case ' ':
        case 'Escape':
          e.preventDefault();
          pauseGame();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isPlaying, changeDirection, pauseGame]);

  return {
    state,
    startGame,
    pauseGame,
    resetGame,
    changeDirection,
    gridSize: GRID_SIZE,
    cellSize: CELL_SIZE,
  };
}
