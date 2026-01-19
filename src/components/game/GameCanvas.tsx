import { useEffect, useRef, useState } from 'react';
import { GameState, Theme, THEME_COLORS, PowerUpType } from '@/types/game';

interface GameCanvasProps {
  state: GameState;
  theme: Theme;
  gridSize: number;
  cellSize: number;
}

const POWER_UP_SYMBOLS: Record<PowerUpType, string> = {
  slowdown: '⏱',
  double_points: '×2',
  invincibility: '🛡',
};

export function GameCanvas({ state, theme, gridSize, cellSize }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const colors = THEME_COLORS[theme];
  const baseCanvasSize = gridSize * cellSize;

  // Calculate scale to fit the container
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      
      const container = containerRef.current;
      const maxWidth = container.clientWidth - 32;
      const maxHeight = window.innerHeight - 200;
      
      const scaleX = maxWidth / baseCanvasSize;
      const scaleY = maxHeight / baseCanvasSize;
      const newScale = Math.min(scaleX, scaleY, 1.5);
      
      setScale(Math.max(0.5, newScale));
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [baseCanvasSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, baseCanvasSize, baseCanvasSize);

    // Draw grid
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= gridSize; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, baseCanvasSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(baseCanvasSize, i * cellSize);
      ctx.stroke();
    }

    // Draw snake
    state.snake.forEach((segment, index) => {
      const isHead = index === 0;
      ctx.fillStyle = isHead ? colors.snakeHead : colors.snake;
      
      if (theme === 'nokia') {
        ctx.fillRect(
          segment.x * cellSize + 1,
          segment.y * cellSize + 1,
          cellSize - 2,
          cellSize - 2
        );
      } else if (theme === 'arcade') {
        const x = segment.x * cellSize + 1;
        const y = segment.y * cellSize + 1;
        const w = cellSize - 2;
        const r = 4;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + w - r);
        ctx.quadraticCurveTo(x + w, y + w, x + w - r, y + w);
        ctx.lineTo(x + r, y + w);
        ctx.quadraticCurveTo(x, y + w, x, y + w - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.fill();
        
        if (isHead) {
          ctx.shadowColor = colors.snakeHead;
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      } else {
        ctx.shadowColor = colors.snake;
        ctx.shadowBlur = isHead ? 8 : 4;
        ctx.fillRect(
          segment.x * cellSize + 2,
          segment.y * cellSize + 2,
          cellSize - 4,
          cellSize - 4
        );
        ctx.shadowBlur = 0;
      }
    });

    // Draw food
    const foodX = state.food.position.x * cellSize + cellSize / 2;
    const foodY = state.food.position.y * cellSize + cellSize / 2;
    
    ctx.fillStyle = colors.food;
    if (theme === 'nokia') {
      ctx.fillRect(
        state.food.position.x * cellSize + 3,
        state.food.position.y * cellSize + 3,
        cellSize - 6,
        cellSize - 6
      );
    } else {
      ctx.beginPath();
      ctx.arc(foodX, foodY, cellSize / 2 - 3, 0, Math.PI * 2);
      ctx.fill();
      
      if (theme === 'arcade') {
        ctx.shadowColor = colors.food;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Draw power-up
    if (state.powerUp) {
      const puX = state.powerUp.position.x * cellSize + cellSize / 2;
      const puY = state.powerUp.position.y * cellSize + cellSize / 2;
      
      ctx.fillStyle = colors.powerUp;
      ctx.beginPath();
      ctx.arc(puX, puY, cellSize / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
      
      const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.8;
      ctx.globalAlpha = pulse;
      ctx.beginPath();
      ctx.arc(puX, puY, cellSize / 2, 0, Math.PI * 2);
      ctx.strokeStyle = colors.powerUp;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.fillStyle = colors.background;
      ctx.font = `bold ${cellSize / 2}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(POWER_UP_SYMBOLS[state.powerUp.type], puX, puY);
    }

  }, [state, theme, gridSize, cellSize, colors, baseCanvasSize]);

  const getCanvasClass = () => {
    switch (theme) {
      case 'nokia':
        return 'nokia-lcd';
      case 'arcade':
        return 'border-4 border-[#e94560]';
      case 'terminal':
        return 'crt-effect terminal-flicker border-2 border-[#003300]';
      default:
        return '';
    }
  };

  return (
    <div ref={containerRef} className="w-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={baseCanvasSize}
        height={baseCanvasSize}
        className={`${getCanvasClass()}`}
        style={{ 
          imageRendering: 'pixelated',
          width: baseCanvasSize * scale,
          height: baseCanvasSize * scale,
        }}
      />
    </div>
  );
}
