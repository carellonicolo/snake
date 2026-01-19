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
  DIFFICULTY_SETTINGS,
  GameMode
} from '@/types/game';

const GRID_SIZE = 30;
const CELL_SIZE = 20;

const getInitialState = (): GameState => ({
  snake: [{ x: 15, y: 15 }],
  food: { position: { x: 20, y: 20 }, value: 10 },
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
  
  // Use refs to avoid stale closures in game loop
  const stateRef = useRef<GameState>(state);
  const configRef = useRef<GameConfig>(config);
  const directionQueueRef = useRef<Direction[]>([]);
  const currentDirectionRef = useRef<Direction>('RIGHT');
  const lastMoveTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Keep refs in sync
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const getSpeed = useCallback((activePowerUps: ActivePowerUp[]) => {
    const baseSpeed = DIFFICULTY_SETTINGS[configRef.current.difficulty].speed;
    const hasSlowdown = activePowerUps.some(p => p.type === 'slowdown');
    return hasSlowdown ? baseSpeed * 1.5 : baseSpeed;
  }, []);

  const hasDoublePoints = useCallback((activePowerUps: ActivePowerUp[]) => {
    return activePowerUps.some(p => p.type === 'double_points');
  }, []);

  const hasInvincibility = useCallback((activePowerUps: ActivePowerUp[]) => {
    return activePowerUps.some(p => p.type === 'invincibility');
  }, []);

  const checkCollision = useCallback((head: Position, snake: Position[], mode: GameMode, invincible: boolean): boolean => {
    // In classic mode, hitting walls is game over
    if (mode === 'classic') {
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        return true;
      }
    }
    if (invincible) return false;
    return snake.slice(1).some(seg => seg.x === head.x && seg.y === head.y);
  }, []);

  const getOppositeDirection = (dir: Direction): Direction => {
    const opposites: Record<Direction, Direction> = {
      UP: 'DOWN',
      DOWN: 'UP',
      LEFT: 'RIGHT',
      RIGHT: 'LEFT',
    };
    return opposites[dir];
  };

  const processNextDirection = useCallback((): Direction => {
    const queue = directionQueueRef.current;
    const currentDir = currentDirectionRef.current;
    
    // Process queue to find first valid direction
    while (queue.length > 0) {
      const nextDir = queue.shift()!;
      if (getOppositeDirection(nextDir) !== currentDir) {
        currentDirectionRef.current = nextDir;
        return nextDir;
      }
    }
    return currentDir;
  }, []);

  const moveSnake = useCallback(() => {
    setState(prev => {
      if (!prev.isPlaying || prev.isPaused || prev.isGameOver) return prev;

      const direction = processNextDirection();
      const head = { ...prev.snake[0] };

      switch (direction) {
        case 'UP': head.y -= 1; break;
        case 'DOWN': head.y += 1; break;
        case 'LEFT': head.x -= 1; break;
        case 'RIGHT': head.x += 1; break;
      }

      // In endless mode, wrap around the edges
      if (configRef.current.mode === 'endless') {
        if (head.x < 0) head.x = GRID_SIZE - 1;
        if (head.x >= GRID_SIZE) head.x = 0;
        if (head.y < 0) head.y = GRID_SIZE - 1;
        if (head.y >= GRID_SIZE) head.y = 0;
      }

      const invincible = hasInvincibility(prev.activePowerUps);
      if (checkCollision(head, prev.snake, configRef.current.mode, invincible)) {
        return { ...prev, isGameOver: true, isPlaying: false };
      }

      const newSnake = [head, ...prev.snake];
      let newScore = prev.score;
      let newFood = prev.food;
      let newPowerUp = prev.powerUp;
      let newActivePowerUps = [...prev.activePowerUps];

      // Check food collision
      if (head.x === prev.food.position.x && head.y === prev.food.position.y) {
        const doublePoints = hasDoublePoints(prev.activePowerUps);
        const points = doublePoints ? prev.food.value * 2 : prev.food.value;
        newScore += points;
        newFood = generateFood(newSnake);
        
        // Chance to spawn power-up
        if (!prev.powerUp && Math.random() < DIFFICULTY_SETTINGS[configRef.current.difficulty].powerUpChance) {
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
  }, [checkCollision, hasDoublePoints, hasInvincibility, processNextDirection]);

  // Game loop using requestAnimationFrame for smoother performance
  const gameLoop = useCallback((timestamp: number) => {
    const currentState = stateRef.current;
    
    if (!currentState.isPlaying || currentState.isPaused || currentState.isGameOver) {
      animationFrameRef.current = null;
      return;
    }

    const speed = getSpeed(currentState.activePowerUps);
    const elapsed = timestamp - lastMoveTimeRef.current;

    if (elapsed >= speed) {
      lastMoveTimeRef.current = timestamp;
      moveSnake();
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [getSpeed, moveSnake]);

  // Start/stop game loop based on state
  useEffect(() => {
    if (state.isPlaying && !state.isPaused && !state.isGameOver) {
      if (!animationFrameRef.current) {
        lastMoveTimeRef.current = performance.now();
        animationFrameRef.current = requestAnimationFrame(gameLoop);
      }
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [state.isPlaying, state.isPaused, state.isGameOver, gameLoop]);

  const startGame = useCallback(() => {
    const initial = getInitialState();
    initial.isPlaying = true;
    initial.startTime = Date.now();
    initial.food = generateFood(initial.snake);
    currentDirectionRef.current = 'RIGHT';
    directionQueueRef.current = [];
    lastMoveTimeRef.current = performance.now();
    setState(initial);
  }, []);

  const pauseGame = useCallback(() => {
    setState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  }, []);

  const resetGame = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setState(getInitialState());
    currentDirectionRef.current = 'RIGHT';
    directionQueueRef.current = [];
  }, []);

  const changeDirection = useCallback((newDirection: Direction) => {
    // Add to queue instead of immediately changing
    // This prevents rapid key presses from causing issues
    const queue = directionQueueRef.current;
    
    // Limit queue size to prevent input flooding
    if (queue.length >= 2) return;
    
    // Check against last queued direction or current direction
    const lastDirection = queue.length > 0 ? queue[queue.length - 1] : currentDirectionRef.current;
    
    // Don't add if it's the opposite of the last direction or same direction
    if (getOppositeDirection(newDirection) !== lastDirection && newDirection !== lastDirection) {
      queue.push(newDirection);
    }
  }, []);

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
