import { forwardRef, useEffect, useRef, useState, useImperativeHandle } from 'react';
import { GameState, Theme, THEME_COLORS, PowerUpType } from '@/types/game';

interface GameCanvasProps {
  state: GameState;
  theme: Theme;
  gridSize: number;
  renderFraction: number;
}

const POWER_UP_SYMBOLS: Record<PowerUpType, string> = {
  slowdown: '⏱',
  double_points: '×2',
  invincibility: '🛡',
};

export const GameCanvas = forwardRef<HTMLCanvasElement, GameCanvasProps>(
  ({ state, theme, gridSize, renderFraction }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 600, height: 600 });
    const colors = THEME_COLORS[theme];

    useImperativeHandle(ref, () => canvasRef.current!);

    // Calculate canvas dimensions to fill the screen
    useEffect(() => {
      const updateDimensions = () => {
        // Get available space (full viewport minus some padding for header)
        const availableWidth = window.innerWidth - 32;
        const availableHeight = window.innerHeight - 80;

        // Calculate cell size based on available space
        const cellSizeByWidth = Math.floor(availableWidth / gridSize);
        const cellSizeByHeight = Math.floor(availableHeight / gridSize);

        // Use the smaller cell size to maintain square cells
        const optimalCellSize = Math.max(12, Math.min(cellSizeByWidth, cellSizeByHeight));

        const canvasSize = optimalCellSize * gridSize;

        setDimensions({
          width: canvasSize,
          height: canvasSize,
        });
      };

      updateDimensions();
      window.addEventListener('resize', updateDimensions);
      return () => window.removeEventListener('resize', updateDimensions);
    }, [gridSize]);

    const actualCellSize = dimensions.width / gridSize;

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.fillStyle = colors.background;
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      // Draw grid
      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= gridSize; i++) {
        ctx.beginPath();
        ctx.moveTo(i * actualCellSize, 0);
        ctx.lineTo(i * actualCellSize, dimensions.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * actualCellSize);
        ctx.lineTo(dimensions.width, i * actualCellSize);
        ctx.stroke();
      }

      // Draw snake
      state.snake.forEach((segment, index) => {
        const isHead = index === 0;

        // Calculate trail effect (opacity fades towards tail)
        const progress = state.snake.length > 2 ? index / (state.snake.length - 1) : 0;
        // The head is fully opaque. The tail drops to 40% opacity in arcade/terminal.
        const opacity = isHead ? 1 : Math.max(0.4, 1 - (progress * 0.6));

        ctx.globalAlpha = opacity;
        ctx.fillStyle = isHead ? colors.snakeHead : colors.snake;

        if (theme === 'nokia') {
          // Nokia doesn't use opacity to retain the retro look
          ctx.globalAlpha = 1;
          ctx.fillRect(
            segment.x * actualCellSize + 1,
            segment.y * actualCellSize + 1,
            actualCellSize - 2,
            actualCellSize - 2
          );
        } else if (theme === 'arcade') {
          const x = segment.x * actualCellSize + 1;
          const y = segment.y * actualCellSize + 1;
          // Slightly shrink tail segments for better trail effect
          const shrinkOffset = isHead ? 0 : (progress * 2);
          const w = actualCellSize - 2 - (shrinkOffset * 2);
          const r = Math.max(2, 4 - shrinkOffset);

          ctx.beginPath();
          ctx.moveTo(x + shrinkOffset + r, y + shrinkOffset);
          ctx.lineTo(x + shrinkOffset + w - r, y + shrinkOffset);
          ctx.quadraticCurveTo(x + shrinkOffset + w, y + shrinkOffset, x + shrinkOffset + w, y + shrinkOffset + r);
          ctx.lineTo(x + shrinkOffset + w, y + shrinkOffset + w - r);
          ctx.quadraticCurveTo(x + shrinkOffset + w, y + shrinkOffset + w, x + shrinkOffset + w - r, y + shrinkOffset + w);
          ctx.lineTo(x + shrinkOffset + r, y + shrinkOffset + w);
          ctx.quadraticCurveTo(x + shrinkOffset, y + shrinkOffset + w, x + shrinkOffset, y + shrinkOffset + w - r);
          ctx.lineTo(x + shrinkOffset, y + shrinkOffset + r);
          ctx.quadraticCurveTo(x + shrinkOffset, y + shrinkOffset, x + shrinkOffset + r, y + shrinkOffset);
          ctx.fill();

          if (isHead) {
            ctx.shadowColor = colors.snakeHead;
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        } else {
          // Terminal
          const shrinkOffset = isHead ? 0 : (progress * 1.5);
          ctx.shadowColor = colors.snake;
          ctx.shadowBlur = isHead ? 8 : 4;
          ctx.fillRect(
            segment.x * actualCellSize + 2 + shrinkOffset,
            segment.y * actualCellSize + 2 + shrinkOffset,
            actualCellSize - 4 - (shrinkOffset * 2),
            actualCellSize - 4 - (shrinkOffset * 2)
          );
          ctx.shadowBlur = 0;
        }
      });
      ctx.globalAlpha = 1; // reset alpha for other drawing operations

      // Draw food
      const foodX = state.food.position.x * actualCellSize + actualCellSize / 2;
      const foodY = state.food.position.y * actualCellSize + actualCellSize / 2;

      ctx.fillStyle = colors.food;
      if (theme === 'nokia') {
        ctx.fillRect(
          state.food.position.x * actualCellSize + 3,
          state.food.position.y * actualCellSize + 3,
          actualCellSize - 6,
          actualCellSize - 6
        );
      } else {
        ctx.beginPath();
        ctx.arc(foodX, foodY, actualCellSize / 2 - 3, 0, Math.PI * 2);
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
        const puX = state.powerUp.position.x * actualCellSize + actualCellSize / 2;
        const puY = state.powerUp.position.y * actualCellSize + actualCellSize / 2;

        ctx.fillStyle = colors.powerUp;
        ctx.beginPath();
        ctx.arc(puX, puY, actualCellSize / 2 - 2, 0, Math.PI * 2);
        ctx.fill();

        const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.8;
        ctx.globalAlpha = pulse;
        ctx.beginPath();
        ctx.arc(puX, puY, actualCellSize / 2, 0, Math.PI * 2);
        ctx.strokeStyle = colors.powerUp;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 1;

        ctx.fillStyle = colors.background;
        ctx.font = `bold ${actualCellSize / 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(POWER_UP_SYMBOLS[state.powerUp.type], puX, puY);
      }

      // Draw Walls
      if (state.walls && state.walls.length > 0) {
        ctx.fillStyle = theme === 'arcade' ? '#888' : theme === 'nokia' ? '#0f380f' : '#222';
        state.walls.forEach(wall => {
          ctx.fillRect(
            wall.x * actualCellSize + 1,
            wall.y * actualCellSize + 1,
            actualCellSize - 2,
            actualCellSize - 2
          );
          // Optional: simple brick pattern
          if (theme === 'arcade') {
            ctx.fillStyle = '#666';
            ctx.fillRect(wall.x * actualCellSize + 1, wall.y * actualCellSize + 1 + (actualCellSize / 2), actualCellSize - 2, 1);
            ctx.fillRect(wall.x * actualCellSize + 1 + (actualCellSize / 2), wall.y * actualCellSize + 1, 1, actualCellSize / 2);
            ctx.fillStyle = '#888';
          }
        });
      }

      // Draw Combo Indicator if active
      if (state.combo > 1) {
        ctx.fillStyle = theme === 'arcade' ? '#f5d300' : colors.text;
        const fontSize = Math.max(16, dimensions.width * 0.05);
        ctx.font = `bold ${fontSize}px "Courier New", monospace`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';

        const pulse = Math.sin(Date.now() / 150) * 0.2 + 0.8;
        ctx.globalAlpha = pulse;

        // Draw standard "x{Combo}" text
        ctx.fillText(`${state.combo}x COMBO!`, dimensions.width - 10, 10);

        // Timer bar
        if (state.comboTimer > 0) {
          const barMaxWidth = dimensions.width * 0.2;
          const barWidth = barMaxWidth * (state.comboTimer / 4000); // normalized against 4000ms max duration
          ctx.fillRect(dimensions.width - 10 - barMaxWidth, 15 + fontSize, barWidth, 4);
        }

        ctx.globalAlpha = 1;
      }

    }, [state, theme, gridSize, colors, dimensions, actualCellSize, renderFraction]);

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
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center"
      >
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className={`${getCanvasClass()}`}
          style={{
            imageRendering: 'pixelated',
          }}
        />
      </div>
    );
  }
);

GameCanvas.displayName = 'GameCanvas';
