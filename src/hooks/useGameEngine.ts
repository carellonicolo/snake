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
  GameMode,
  Difficulty
} from '@/types/game';

const COMBO_DURATION_MS = 4000; // 4 seconds to keep combo active
const COMBO_MAX_MULTIPLIER = 5;

const getInitialState = (gridSize: number, enableWalls: boolean): GameState => {
  const center = Math.floor(gridSize / 2);
  const snake = [{ x: center, y: center }];
  const walls = enableWalls ? generateWalls(gridSize, snake) : [];

  return {
    snake,
    food: generateFood(snake, gridSize, walls),
    powerUp: null,
    activePowerUps: [],
    direction: 'RIGHT',
    score: 0,
    combo: 1,
    comboTimer: 0,
    walls,
    isPlaying: false,
    isPaused: false,
    isGameOver: false,
    startTime: null,
    gameTime: 0,
  };
};

const getRandomPosition = (gridSize: number, excludePositions: Position[]): Position => {
  let position: Position;
  let isOccupied: boolean;
  do {
    position = {
      x: Math.floor(Math.random() * gridSize),
      y: Math.floor(Math.random() * gridSize),
    };
    isOccupied = excludePositions.some(pos => pos.x === position.x && pos.y === position.y);
  } while (isOccupied);
  return position;
};

const generateWalls = (gridSize: number, snake: Position[]): Position[] => {
  const walls: Position[] = [];
  // Number of walls based on grid size
  const numWalls = Math.floor((gridSize * gridSize) * 0.03);

  // Keep center clear for snake
  const safeZone = 3;
  const center = Math.floor(gridSize / 2);

  for (let i = 0; i < numWalls; i++) {
    let pos: Position;
    let isValid = false;
    let attempts = 0;
    while (!isValid && attempts < 50) {
      pos = {
        x: Math.floor(Math.random() * gridSize),
        y: Math.floor(Math.random() * gridSize)
      };

      const inSafeZone = Math.abs(pos.x - center) < safeZone && Math.abs(pos.y - center) < safeZone;
      const onSnake = snake.some(s => s.x === pos.x && s.y === pos.y);
      const onExistingWall = walls.some(w => w.x === pos.x && w.y === pos.y);

      if (!inSafeZone && !onSnake && !onExistingWall) {
        walls.push(pos);
        isValid = true;
      }
      attempts++;
    }
  }
  return walls;
};

const generateFood = (snake: Position[], gridSize: number, walls: Position[] = []): Food => ({
  position: getRandomPosition(gridSize, [...snake, ...walls]),
  value: 10,
});

const generatePowerUp = (snake: Position[], food: Food, gridSize: number, walls: Position[] = []): PowerUp | null => {
  const types: PowerUpType[] = ['slowdown', 'double_points', 'invincibility'];
  const type = types[Math.floor(Math.random() * types.length)];
  let position: Position;
  do {
    position = getRandomPosition(gridSize, [...snake, ...walls]);
  } while (position.x === food.position.x && position.y === food.position.y);

  return {
    position,
    type,
    duration: type === 'slowdown' ? 5000 : type === 'double_points' ? 8000 : 4000,
  };
};

export function useGameEngine(config: GameConfig) {
  const [state, setState] = useState<GameState>(() => getInitialState(config.gridSize, config.enableWalls));

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
    // Reset state if config changes while not playing
    if (!stateRef.current.isPlaying) {
      setState(getInitialState(config.gridSize, config.enableWalls));
    }
  }, [config.gridSize, config.enableWalls]); // intentionally excluding other config props to avoid unnecessary resets

  const getSpeed = useCallback((activePowerUps: ActivePowerUp[], config: GameConfig) => {
    const baseSpeed = 150;
    // Apply user speed multiplier (lower multiplier = faster game, so we divide)
    // Map speedMultiplier (1 to 10) to a reasonable range
    const multipliedSpeed = baseSpeed / (config.speedMultiplier / 3);

    const hasSlowdown = activePowerUps.some(p => p.type === 'slowdown');
    return hasSlowdown ? multipliedSpeed * 1.5 : multipliedSpeed;
  }, []);

  const hasDoublePoints = useCallback((activePowerUps: ActivePowerUp[]) => {
    return activePowerUps.some(p => p.type === 'double_points');
  }, []);

  const hasInvincibility = useCallback((activePowerUps: ActivePowerUp[]) => {
    return activePowerUps.some(p => p.type === 'invincibility');
  }, []);

  const checkCollision = useCallback((head: Position, snake: Position[], mode: GameMode, invincible: boolean, gridSize: number, walls: Position[]): boolean => {
    // In classic mode, hitting walls is game over
    if (mode === 'classic') {
      if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) {
        return true;
      }
    }

    // Check inner walls
    if (!invincible && walls.some(w => w.x === head.x && w.y === head.y)) {
      return true;
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
    const now = Date.now();

    setState(prev => {
      if (!prev.isPlaying || prev.isPaused || prev.isGameOver) return prev;

      const direction = processNextDirection();
      const head = { ...prev.snake[0] };
      const gridSize = configRef.current.gridSize;

      switch (direction) {
        case 'UP': head.y -= 1; break;
        case 'DOWN': head.y += 1; break;
        case 'LEFT': head.x -= 1; break;
        case 'RIGHT': head.x += 1; break;
      }

      // In endless mode, wrap around the edges
      if (configRef.current.mode === 'endless') {
        if (head.x < 0) head.x = gridSize - 1;
        if (head.x >= gridSize) head.x = 0;
        if (head.y < 0) head.y = gridSize - 1;
        if (head.y >= gridSize) head.y = 0;
      }

      const invincible = hasInvincibility(prev.activePowerUps);
      if (checkCollision(head, prev.snake, configRef.current.mode, invincible, gridSize, prev.walls)) {
        return { ...prev, isGameOver: true, isPlaying: false };
      }

      const newSnake = [head, ...prev.snake];
      let newScore = prev.score;
      let newFood = prev.food;
      let newPowerUp = prev.powerUp;
      let newActivePowerUps = [...prev.activePowerUps];

      // Update Combo Timer
      let newCombo = prev.combo;
      let newComboTimer = prev.comboTimer;

      if (newCombo > 1) {
        newComboTimer = Math.max(0, newComboTimer - (now - lastMoveTimeRef.current));
        if (newComboTimer <= 0) {
          newCombo = 1; // reset combo
        }
      }

      // Check food collision
      if (head.x === prev.food.position.x && head.y === prev.food.position.y) {
        const doublePoints = hasDoublePoints(prev.activePowerUps);
        const basePoints = doublePoints ? prev.food.value * 2 : prev.food.value;

        // Apply combo multiplier
        const pointsWithCombo = basePoints * newCombo;
        newScore += pointsWithCombo;

        // Increase combo for next food
        newCombo = Math.min(COMBO_MAX_MULTIPLIER, newCombo + 1);
        newComboTimer = COMBO_DURATION_MS; // reset timer

        newFood = generateFood(newSnake, gridSize, prev.walls);

        // Chance to spawn power-up
        if (!prev.powerUp && configRef.current.powerUpsEnabled && Math.random() < 0.1) {
          newPowerUp = generatePowerUp(newSnake, newFood, gridSize, prev.walls);
        }
      } else {
        newSnake.pop();
      }

      // Check power-up collision
      if (prev.powerUp && head.x === prev.powerUp.position.x && head.y === prev.powerUp.position.y) {
        const activePowerUp: ActivePowerUp = {
          type: prev.powerUp.type,
          endTime: now + prev.powerUp.duration,
        };
        newActivePowerUps.push(activePowerUp);
        newPowerUp = null;

        // Eating power-up also sustains combo
        newComboTimer = COMBO_DURATION_MS;
      }

      // Clean expired power-ups
      newActivePowerUps = newActivePowerUps.filter(p => p.endTime > now);

      return {
        ...prev,
        snake: newSnake,
        food: newFood,
        powerUp: newPowerUp,
        activePowerUps: newActivePowerUps,
        score: newScore,
        combo: newCombo,
        comboTimer: newComboTimer,
        direction,
        gameTime: prev.startTime ? Math.floor((now - prev.startTime) / 1000) : 0,
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

    const speed = getSpeed(currentState.activePowerUps, configRef.current);
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
    const initial = getInitialState(configRef.current.gridSize, configRef.current.enableWalls);
    initial.isPlaying = true;
    initial.startTime = Date.now();
    // food + walls already generated by getInitialState
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
    setState(getInitialState(configRef.current.gridSize, configRef.current.enableWalls));
    currentDirectionRef.current = 'RIGHT';
    directionQueueRef.current = [];
  }, []);

  const changeDirection = useCallback((newDirection: Direction) => {
    const queue = directionQueueRef.current;
    if (queue.length >= 2) return;
    const lastDirection = queue.length > 0 ? queue[queue.length - 1] : currentDirectionRef.current;
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

  // Compute smooth interpolation state for rendering (fraction of move completed)
  // This will be useful for Canvas rendering smooth movement
  const renderFraction = Math.min(1, (performance.now() - lastMoveTimeRef.current) / getSpeed(state.activePowerUps, configRef.current));

  return {
    state,
    startGame,
    pauseGame,
    resetGame,
    changeDirection,
    gridSize: configRef.current.gridSize,
    renderFraction, // can be used by GameCanvas to draw snake between cells
  };
}
