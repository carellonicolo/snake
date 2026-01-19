import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGameEngine } from '@/hooks/useGameEngine';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { supabase } from '@/integrations/supabase/client';
import { GameCanvas } from '@/components/game/GameCanvas';
import { GameUI } from '@/components/game/GameUI';
import { Leaderboard } from '@/components/game/Leaderboard';
import { UserStats } from '@/components/game/UserStats';
import { Difficulty, Theme, GameConfig, GameMode } from '@/types/game';
import { LogOut, User, Trophy, BarChart3, ChevronDown, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Game() {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [theme, setTheme] = useState<Theme>('nokia');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [username, setUsername] = useState<string>('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showModal, setShowModal] = useState<'leaderboard' | 'stats' | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const config: GameConfig = {
    gridSize: 30,
    cellSize: 20,
    baseSpeed: 100,
    difficulty,
    theme,
    mode: gameMode,
  };

  const { state, startGame, pauseGame, resetGame, gridSize, cellSize } = useGameEngine(config);
  const { playSound } = useSoundEffects(soundEnabled, theme);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Load user preferences
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('username, preferred_theme, preferred_difficulty, sound_enabled')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setUsername(data.username);
        if (data.preferred_theme) setTheme(data.preferred_theme as Theme);
        if (data.preferred_difficulty) setDifficulty(data.preferred_difficulty as Difficulty);
        if (data.sound_enabled !== null) setSoundEnabled(data.sound_enabled);
      }
    };

    loadProfile();
  }, [user]);

  // Play sounds on game events
  const prevScore = useState(0);
  useEffect(() => {
    if (state.score > prevScore[0]) {
      playSound('eat');
    }
    prevScore[0] = state.score;
  }, [state.score, playSound]);

  useEffect(() => {
    if (state.isGameOver) {
      playSound('gameover');
    }
  }, [state.isGameOver, playSound]);

  // Save score on game over
  const saveScore = useCallback(async () => {
    if (!user || !state.isGameOver || state.score === 0) return;

    try {
      // Save game score
      await supabase.from('game_scores').insert({
        user_id: user.id,
        score: state.score,
        snake_length: state.snake.length,
        difficulty,
        theme,
        game_duration_seconds: state.gameTime,
        powerups_collected: 0,
      });

      // Update user stats
      const { data: currentStats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (currentStats) {
        const gamesByDifficulty = currentStats.games_by_difficulty as Record<string, number>;
        gamesByDifficulty[difficulty] = (gamesByDifficulty[difficulty] || 0) + 1;

        await supabase
          .from('user_stats')
          .update({
            total_games: currentStats.total_games + 1,
            total_score: currentStats.total_score + state.score,
            best_score: Math.max(currentStats.best_score, state.score),
            max_snake_length: Math.max(currentStats.max_snake_length, state.snake.length),
            total_play_time_seconds: currentStats.total_play_time_seconds + state.gameTime,
            games_by_difficulty: gamesByDifficulty,
          })
          .eq('user_id', user.id);
      }

      toast({
        title: '🎮 Partita terminata!',
        description: (
          <div className="flex flex-col gap-1">
            <span className="text-lg font-bold">{state.score} punti</span>
            <span className="text-sm opacity-80">Lunghezza serpente: {state.snake.length}</span>
          </div>
        ),
      });
    } catch (error) {
      console.error('Error saving score:', error);
      toast({
        title: '❌ Errore',
        description: 'Impossibile salvare il punteggio',
        variant: 'destructive',
      });
    }
  }, [user, state.isGameOver, state.score, state.snake.length, state.gameTime, difficulty, theme, toast]);

  useEffect(() => {
    if (state.isGameOver && state.score > 0) {
      saveScore();
    }
  }, [state.isGameOver, saveScore]);

  // Save preferences on change
  const savePreferences = useCallback(async () => {
    if (!user) return;

    await supabase
      .from('profiles')
      .update({
        preferred_theme: theme,
        preferred_difficulty: difficulty,
        sound_enabled: soundEnabled,
      })
      .eq('user_id', user.id);
  }, [user, theme, difficulty, soundEnabled]);

  useEffect(() => {
    savePreferences();
  }, [theme, difficulty, soundEnabled, savePreferences]);

  const handleSignOut = async () => {
    setShowUserMenu(false);
    toast({
      title: '👋 Arrivederci!',
      description: 'Sei stato disconnesso',
    });
    await signOut();
    navigate('/auth');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="font-pixel text-primary animate-pulse">Caricamento...</div>
      </div>
    );
  }

  const isGameActive = state.isPlaying && !state.isPaused && !state.isGameOver;

  return (
    <div className="h-screen w-screen bg-background flex flex-col overflow-hidden">
      {/* Header - Hidden during active gameplay */}
      <header className={`border-b border-border p-3 transition-all duration-300 shrink-0 ${isGameActive ? 'opacity-0 pointer-events-none h-0 p-0 overflow-hidden' : ''}`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="font-pixel text-lg text-primary">🐍 SNAKE</h1>
          
          {/* User Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors font-terminal text-sm"
            >
              <User size={16} className="text-primary" />
              <span className="text-foreground">{username}</span>
              <ChevronDown size={14} className={`text-muted-foreground transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden animate-fade-in">
                <div className="p-3 border-b border-border bg-muted/30">
                  <div className="font-terminal text-xs text-muted-foreground">Connesso come</div>
                  <div className="font-terminal text-sm text-primary truncate">{username}</div>
                </div>
                
                <div className="p-1">
                  <button
                    onClick={() => { setShowModal('leaderboard'); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-muted transition-colors text-left"
                  >
                    <Trophy size={18} className="text-yellow-500" />
                    <span className="font-terminal">Classifica Globale</span>
                  </button>
                  
                  <button
                    onClick={() => { setShowModal('stats'); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-muted transition-colors text-left"
                  >
                    <BarChart3 size={18} className="text-blue-500" />
                    <span className="font-terminal">Le Tue Statistiche</span>
                  </button>
                </div>
                
                <div className="p-1 border-t border-border">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-destructive/10 transition-colors text-left text-destructive"
                  >
                    <LogOut size={18} />
                    <span className="font-terminal">Esci</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Game Area - Full Screen */}
      <div className="flex-1 flex items-center justify-center relative min-h-0">
        {/* HUD during gameplay */}
        {isGameActive && (
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20 pointer-events-none">
            <div className="bg-background/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-border">
              <div className="font-pixel text-xs text-muted-foreground">SCORE</div>
              <div className="font-pixel text-2xl text-primary">{state.score}</div>
            </div>
            <div className="bg-background/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-border">
              <div className="font-pixel text-xs text-muted-foreground">LENGTH</div>
              <div className="font-pixel text-2xl text-primary">{state.snake.length}</div>
            </div>
          </div>
        )}

        {/* Active Power-ups HUD */}
        {isGameActive && state.activePowerUps.length > 0 && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {state.activePowerUps.map((pu, idx) => {
              const remaining = Math.max(0, Math.ceil((pu.endTime - Date.now()) / 1000));
              const icons: Record<string, string> = {
                slowdown: '⏱️',
                double_points: '×2',
                invincibility: '🛡️',
              };
              return (
                <div
                  key={idx}
                  className="flex items-center gap-1 px-3 py-1 bg-accent/90 backdrop-blur-sm rounded-full text-sm font-terminal powerup-pulse"
                >
                  <span>{icons[pu.type]}</span>
                  <span>{remaining}s</span>
                </div>
              );
            })}
          </div>
        )}

        <GameCanvas
          state={state}
          theme={theme}
          gridSize={gridSize}
          cellSize={cellSize}
        />

        {/* Overlay Menu - Shows when not actively playing */}
        {!isGameActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm z-10">
            <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl animate-fade-in">
              <GameUI
                state={state}
                theme={theme}
                difficulty={difficulty}
                gameMode={gameMode}
                soundEnabled={soundEnabled}
                onStart={startGame}
                onPause={pauseGame}
                onReset={resetGame}
                onToggleSound={() => setSoundEnabled(!soundEnabled)}
                onThemeChange={setTheme}
                onDifficultyChange={setDifficulty}
                onModeChange={setGameMode}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modal for Leaderboard/Stats */}
      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-auto shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-pixel text-sm text-primary">
                {showModal === 'leaderboard' ? '🏆 CLASSIFICA GLOBALE' : '📊 LE TUE STATISTICHE'}
              </h2>
              <button
                onClick={() => setShowModal(null)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {showModal === 'leaderboard' ? (
              <Leaderboard limit={20} />
            ) : (
              <UserStats />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
