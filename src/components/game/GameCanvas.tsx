import React, { forwardRef, useEffect, useRef, useState, useImperativeHandle } from 'react';
import { GameState, GameTheme, THEME_PRESETS, PowerUpType } from '@/types/game';
import { useParticles } from '@/hooks/useParticles';

interface GameCanvasProps {
  state: GameState;
  theme: GameTheme;
  gridSize: number;
  renderFraction: number;
  particlesEnabled?: boolean;
}

const POWER_UP_SYMBOLS: Record<PowerUpType, string> = {
  slowdown: '⏱',
  double_points: '×2',
  invincibility: '🛡',
};

export const GameCanvas = forwardRef<HTMLCanvasElement, GameCanvasProps>(
  ({ state, theme, gridSize, renderFraction, particlesEnabled = true }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 600, height: 600 });
    const colors = THEME_PRESETS[theme];
    const { emitBurst, emitTrail, update: updateParticles, draw: drawParticles } = useParticles();
    const prevScore = useRef(state.score);

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
      ctx.fillStyle = `hsl(${colors.background})`;
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      // Draw grid
      ctx.strokeStyle = colors.grid ? `hsl(${colors.grid})` : `hsl(${colors.foreground} / 0.1)`;
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
        ctx.fillStyle = isHead ? `hsl(${colors.snakeHead})` : `hsl(${colors.snake})`;

        if (theme === 'retro') {
          // Nokia doesn't use opacity to retain the retro look
          ctx.globalAlpha = 1;
          ctx.fillRect(
            segment.x * actualCellSize + 1,
            segment.y * actualCellSize + 1,
            actualCellSize - 2,
            actualCellSize - 2
          );
        } else if (theme === 'matrix' || theme === 'vaporwave') {
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
            ctx.shadowColor = `hsl(${colors.snakeHead})`;
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        } else {
          // Default styling for other themes
          const shrinkOffset = isHead ? 0 : (progress * 1.5);
          ctx.shadowColor = `hsl(${colors.snake})`;
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

      ctx.fillStyle = `hsl(${colors.food})`;
      if (theme === 'retro') {
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

        if (theme === 'matrix' || theme === 'vaporwave') {
          ctx.shadowColor = `hsl(${colors.food})`;
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // Draw power-up
      if (state.powerUp) {
        const puX = state.powerUp.position.x * actualCellSize + actualCellSize / 2;
        const puY = state.powerUp.position.y * actualCellSize + actualCellSize / 2;

        ctx.fillStyle = `hsl(${colors.accent})`;
        ctx.beginPath();
        ctx.arc(puX, puY, actualCellSize / 2 - 2, 0, Math.PI * 2);
        ctx.fill();

        const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.8;
        ctx.globalAlpha = pulse;
        ctx.beginPath();
        ctx.arc(puX, puY, actualCellSize / 2, 0, Math.PI * 2);
        ctx.strokeStyle = `hsl(${colors.accent})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 1;

        ctx.fillStyle = `hsl(${colors.background})`;
        ctx.font = `bold ${actualCellSize / 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(POWER_UP_SYMBOLS[state.powerUp.type], puX, puY);
      }

      // Particles
      if (particlesEnabled) {
        if (state.score > prevScore.current) {
          // Emitted an eating burst
          // We approximate the previous head position for the burst
          const x = state.snake[0].x * actualCellSize + actualCellSize / 2;
          const y = state.snake[0].y * actualCellSize + actualCellSize / 2;
          emitBurst(x, y, `hsl(${colors.accent || colors.food})`);
          prevScore.current = state.score;
        }

        // Emit trail from tail
        if (state.snake.length > 0 && !state.isPaused && !state.isGameOver) {
          const tail = state.snake[state.snake.length - 1];
          if (Math.random() > 0.6) {
            emitTrail(tail.x * actualCellSize + actualCellSize / 2, tail.y * actualCellSize + actualCellSize / 2, `hsl(${colors.snake})`, 0.5);
          }
        }

        updateParticles();
        drawParticles(ctx);
      }

      // Draw Walls
      if (state.walls && state.walls.length > 0) {
        ctx.fillStyle = `hsl(${colors.foreground} / 0.5)`;
        state.walls.forEach(wall => {
          ctx.fillRect(
            wall.x * actualCellSize + 1,
            wall.y * actualCellSize + 1,
            actualCellSize - 2,
            actualCellSize - 2
          );
          // Optional: simple brick pattern
          if (theme === 'matrix' || theme === 'vaporwave') {
            ctx.fillStyle = `hsl(${colors.foreground} / 0.3)`;
            ctx.fillRect(wall.x * actualCellSize + 1, wall.y * actualCellSize + 1 + (actualCellSize / 2), actualCellSize - 2, 1);
            ctx.fillRect(wall.x * actualCellSize + 1 + (actualCellSize / 2), wall.y * actualCellSize + 1, 1, actualCellSize / 2);
            ctx.fillStyle = `hsl(${colors.foreground} / 0.5)`;
          }
        });
      }

      // Draw Combo Indicator if active
      if (state.combo > 1) {
        ctx.fillStyle = `hsl(${colors.accent})`;
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
        case 'retro':
          return 'border-4 border-primary/50 shadow-[0_0_30px_rgba(0,255,0,0.2)]';
        case 'vaporwave':
        case 'matrix':
          return 'crt-effect terminal-flicker border-2 border-primary/40 shadow-[0_0_50px_rgba(255,0,255,0.15)]';
        default:
          return 'rounded-xl shadow-2xl border border-white/5';
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
