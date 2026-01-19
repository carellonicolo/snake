import { GameState, Theme, Difficulty, GameMode } from '@/types/game';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface GameUIProps {
  state: GameState;
  theme: Theme;
  difficulty: Difficulty;
  gameMode: GameMode;
  soundEnabled: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onToggleSound: () => void;
  onThemeChange: (theme: Theme) => void;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onModeChange: (mode: GameMode) => void;
}

const THEME_LABELS: Record<Theme, string> = {
  nokia: '📱 Nokia 3310',
  arcade: '🕹️ Arcade',
  terminal: '💻 Terminal',
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Facile',
  medium: 'Medio',
  hard: 'Difficile',
};

const MODE_LABELS: Record<GameMode, { label: string; icon: string; description: string }> = {
  classic: { label: 'Classic', icon: '🧱', description: 'Muri letali' },
  endless: { label: 'Endless', icon: '♾️', description: 'Wrap-around' },
};

const POWERUP_INFO: Record<string, { icon: string; label: string }> = {
  slowdown: { icon: '⏱️', label: 'Rallentamento' },
  double_points: { icon: '×2', label: 'Punti Doppi' },
  invincibility: { icon: '🛡️', label: 'Invincibilità' },
};

export function GameUI({
  state,
  theme,
  difficulty,
  gameMode,
  soundEnabled,
  onStart,
  onPause,
  onReset,
  onToggleSound,
  onThemeChange,
  onDifficultyChange,
  onModeChange,
}: GameUIProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Score and Stats */}
      <div className="flex justify-between items-center font-pixel text-xs">
        <div className="space-y-1">
          <div className="text-primary">SCORE: {state.score}</div>
          <div className="text-muted-foreground">LENGTH: {state.snake.length}</div>
        </div>
        <div className="text-right space-y-1">
          <div className="text-primary">{formatTime(state.gameTime)}</div>
          <div className="text-muted-foreground">
            {DIFFICULTY_LABELS[difficulty]} • {MODE_LABELS[gameMode].icon}
          </div>
        </div>
      </div>

      {/* Active Power-ups */}
      {state.activePowerUps.length > 0 && (
        <div className="flex gap-2 justify-center">
          {state.activePowerUps.map((pu, idx) => {
            const remaining = Math.max(0, Math.ceil((pu.endTime - Date.now()) / 1000));
            const info = POWERUP_INFO[pu.type];
            return (
              <div
                key={idx}
                className="flex items-center gap-1 px-2 py-1 bg-accent/20 rounded text-xs font-terminal powerup-pulse"
              >
                <span>{info.icon}</span>
                <span>{remaining}s</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-center gap-2">
        {!state.isPlaying && !state.isGameOver ? (
          <button onClick={onStart} className="retro-btn flex items-center gap-2">
            <Play size={16} />
            <span>START</span>
          </button>
        ) : state.isGameOver ? (
          <button onClick={onReset} className="retro-btn flex items-center gap-2">
            <RotateCcw size={16} />
            <span>RETRY</span>
          </button>
        ) : (
          <button onClick={onPause} className="retro-btn flex items-center gap-2">
            {state.isPaused ? <Play size={16} /> : <Pause size={16} />}
            <span>{state.isPaused ? 'RESUME' : 'PAUSE'}</span>
          </button>
        )}
        
        <button
          onClick={onToggleSound}
          className="retro-btn !px-3"
          aria-label={soundEnabled ? 'Mute' : 'Unmute'}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>

      {/* Settings (only when not playing) */}
      {!state.isPlaying && (
        <div className="space-y-3 pt-4 border-t border-border">
          <div>
            <label className="block text-xs font-pixel text-muted-foreground mb-2">TEMA</label>
            <div className="flex gap-2">
              {(['nokia', 'arcade', 'terminal'] as Theme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => onThemeChange(t)}
                  className={`flex-1 py-2 px-3 text-xs font-terminal rounded transition-all ${
                    theme === t
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {THEME_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-pixel text-muted-foreground mb-2">DIFFICOLTÀ</label>
            <div className="flex gap-2">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => onDifficultyChange(d)}
                  className={`flex-1 py-2 px-3 text-xs font-terminal rounded transition-all ${
                    difficulty === d
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {DIFFICULTY_LABELS[d]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-pixel text-muted-foreground mb-2">MODALITÀ</label>
            <div className="flex gap-2">
              {(['classic', 'endless'] as GameMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => onModeChange(m)}
                  className={`flex-1 py-2 px-3 text-xs font-terminal rounded transition-all ${
                    gameMode === m
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{MODE_LABELS[m].icon}</span>
                    <span>{MODE_LABELS[m].label}</span>
                  </div>
                  <div className="text-[10px] opacity-70 mt-1">
                    {MODE_LABELS[m].description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {state.isGameOver && (
        <div className="text-center py-4 space-y-2 animate-fade-in">
          <h2 className="font-pixel text-destructive text-lg">GAME OVER</h2>
          <p className="font-terminal text-xl text-primary">
            Punteggio finale: {state.score}
          </p>
        </div>
      )}

      {/* Pause Overlay */}
      {state.isPaused && !state.isGameOver && (
        <div className="text-center py-4 animate-fade-in">
          <h2 className="font-pixel text-primary text-lg">⏸ PAUSA</h2>
          <p className="font-terminal text-muted-foreground mt-2">
            Premi SPAZIO per continuare
          </p>
        </div>
      )}

      {/* Instructions */}
      {!state.isPlaying && !state.isGameOver && (
        <div className="text-center text-xs font-terminal text-muted-foreground pt-4">
          <p>Usa le frecce direzionali o WASD per muoverti</p>
          <p>SPAZIO o ESC per mettere in pausa</p>
        </div>
      )}
    </div>
  );
}
