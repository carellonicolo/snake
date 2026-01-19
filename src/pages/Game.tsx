import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGameEngine } from '@/hooks/useGameEngine';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { supabase } from '@/integrations/supabase/client';
import { GameCanvas } from '@/components/game/GameCanvas';
import { GameUI } from '@/components/game/GameUI';
import { Leaderboard } from '@/components/game/Leaderboard';
import { UserStats } from '@/components/game/UserStats';
import { Difficulty, Theme, GameConfig } from '@/types/game';
import { LogOut, User, Trophy, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Game() {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [theme, setTheme] = useState<Theme>('nokia');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<'game' | 'leaderboard' | 'stats'>('game');
  const [username, setUsername] = useState<string>('');

  const config: GameConfig = {
    gridSize: 20,
    cellSize: 20,
    baseSpeed: 100,
    difficulty,
    theme,
  };

  const { state, startGame, pauseGame, resetGame, gridSize, cellSize } = useGameEngine(config);
  const { playSound } = useSoundEffects(soundEnabled, theme);

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
        powerups_collected: 0, // Could track this in state
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
        title: 'Punteggio salvato!',
        description: `Hai ottenuto ${state.score} punti`,
      });
    } catch (error) {
      console.error('Error saving score:', error);
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="font-pixel text-xl text-primary">🐍 SNAKE</h1>
          
          <div className="flex items-center gap-4">
            <span className="font-terminal text-sm text-muted-foreground flex items-center gap-2">
              <User size={16} />
              {username}
            </span>
            <button
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-destructive transition-colors"
              aria-label="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex gap-2 mb-6">
          {[
            { id: 'game', label: 'Gioca', icon: '🎮' },
            { id: 'leaderboard', label: 'Classifica', icon: '🏆' },
            { id: 'stats', label: 'Statistiche', icon: '📊' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 py-2 px-4 font-terminal text-sm rounded transition-all flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'game' && (
          <div className="grid md:grid-cols-[1fr_320px] gap-6">
            {/* Game Area */}
            <div className="space-y-4">
              <div className="flex justify-center">
                <GameCanvas
                  state={state}
                  theme={theme}
                  gridSize={gridSize}
                  cellSize={cellSize}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="bg-card p-4 rounded-lg border border-border">
              <GameUI
                state={state}
                theme={theme}
                difficulty={difficulty}
                soundEnabled={soundEnabled}
                onStart={startGame}
                onPause={pauseGame}
                onReset={resetGame}
                onToggleSound={() => setSoundEnabled(!soundEnabled)}
                onThemeChange={setTheme}
                onDifficultyChange={setDifficulty}
              />
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="bg-card p-6 rounded-lg border border-border max-w-lg mx-auto">
            <Leaderboard limit={20} />
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="bg-card p-6 rounded-lg border border-border max-w-lg mx-auto">
            <UserStats />
          </div>
        )}
      </div>
    </div>
  );
}
