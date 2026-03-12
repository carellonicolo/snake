import React, { useEffect, useCallback, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useGameEngine } from '@/hooks/useGameEngine';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { supabase } from '@/integrations/supabase/client';
import { GameCanvas } from '@/components/game/GameCanvas';
import { GameConfig, THEME_PRESETS } from '@/types/game';
import { Home, Play, Pause, RotateCcw, Volume2, VolumeX, Maximize, Minimize, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SnakeGameProps {
    config: GameConfig;
    onBackToMenu: () => void;
    onGameOver?: (winner: number, score: number) => void;
}

export const SnakeGame: React.FC<SnakeGameProps> = ({ config, onBackToMenu, onGameOver }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const containerRef = useRef<HTMLDivElement>(null);

    const [soundEnabled, setSoundEnabled] = useState(config.soundEnabled);
    const [musicEnabled, setMusicEnabled] = useState(config.musicEnabled);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isShaking, setIsShaking] = useState(false);

    // Initialize engine with empty config, wait for startGame
    const { state, startGame, pauseGame, resetGame, renderFraction } = useGameEngine(config);
    const { playSound } = useSoundEffects(soundEnabled, 'arcade'); // Mapping to arcade for sounds for now

    // Auto start
    useEffect(() => {
        startGame();
    }, [startGame]);

    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => { });
        } else {
            document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => { });
        }
    }, []);

    useEffect(() => {
        const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFsChange);
        return () => document.removeEventListener('fullscreenchange', onFsChange);
    }, []);

    const triggerShake = useCallback(() => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 400);
    }, []);

    const prevScore = useRef(0);
    useEffect(() => {
        if (state.score > prevScore.current) {
            playSound('eat');
            triggerShake();
        }
        prevScore.current = state.score;
    }, [state.score, playSound, triggerShake]);

    useEffect(() => {
        if (state.isGameOver) {
            playSound('gameover');
            triggerShake();
            if (onGameOver) {
                onGameOver(0, state.score);
            }
        }
    }, [state.isGameOver, playSound, triggerShake, onGameOver, state.score]);

    // Save score logic removed from here and moved to Index to match Pongcarello (or let's keep it here for simplicity)
    const saveScore = useCallback(async () => {
        if (!user || !state.isGameOver || state.score === 0) return;

        try {
            await supabase.from('game_scores').insert({
                user_id: user.id,
                score: state.score,
                snake_length: state.snake.length,
                difficulty: 'medium', // Sticking to medium for DB compat for now
                theme: 'arcade', // Using arcade for DB compat
                game_duration_seconds: state.gameTime,
                powerups_collected: 0,
            });

            let { data: currentStats } = await supabase
                .from('user_stats')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (!currentStats) {
                const { data: newStats } = await supabase
                    .from('user_stats')
                    .insert({ user_id: user.id })
                    .select()
                    .single();
                currentStats = newStats;
            }

            if (currentStats) {
                const gamesByDifficulty = currentStats.games_by_difficulty as Record<string, number>;
                gamesByDifficulty['medium'] = (gamesByDifficulty['medium'] || 0) + 1;

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
        }
    }, [user, state.isGameOver, state.score, state.snake.length, state.gameTime, toast]);

    useEffect(() => {
        if (state.isGameOver && state.score > 0) {
            saveScore();
        }
    }, [state.isGameOver, saveScore]);

    const togglePause = () => {
        if (state.isPaused) {
            // Resume logic if needed, game engine handles it
            pauseGame();
        } else {
            pauseGame();
        }
    };

    const themeColors = THEME_PRESETS[config.theme];

    return (
        <div
            ref={containerRef}
            className={`flex flex-col items-center p-2 md:p-4 ${isFullscreen ? 'h-screen w-screen overflow-hidden' : 'min-h-[100dvh]'} ${isShaking ? 'animate-shake' : ''}`}
            style={{ backgroundColor: `hsl(${themeColors.background})` }}
        >
            {/* HUD Header */}
            <div className="flex items-center justify-between w-full max-w-4xl mb-4 p-4 rounded-xl border" style={{ backgroundColor: `hsl(${themeColors.background} / 0.8)`, borderColor: `hsl(${themeColors.accent} / 0.2)` }}>
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            if (state.isPlaying && !state.isGameOver) {
                                setShowExitConfirm(true);
                            } else {
                                onBackToMenu();
                            }
                        }}
                        style={{ color: `hsl(${themeColors.foreground})` }}
                    >
                        <Home className="w-4 h-4 mr-2" />
                        <span className="hidden md:inline">Menu</span>
                    </Button>

                    <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-wider font-bold opacity-60" style={{ color: `hsl(${themeColors.foreground})` }}>Score</span>
                        <span className="text-2xl font-black leading-none" style={{ color: `hsl(${themeColors.foreground})` }}>{state.score}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-wider font-bold opacity-60" style={{ color: `hsl(${themeColors.foreground})` }}>Length</span>
                        <span className="text-2xl font-black leading-none" style={{ color: `hsl(${themeColors.foreground})` }}>{state.snake.length}</span>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setSoundEnabled(!soundEnabled)} style={{ color: `hsl(${themeColors.foreground})` }}>
                        {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </Button>

                    <Button variant="ghost" size="icon" onClick={() => setMusicEnabled(!musicEnabled)} style={{ color: `hsl(${themeColors.foreground})` }}>
                        <div className="relative">
                            <Music className="w-4 h-4" />
                            {!musicEnabled && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-[120%] h-[2px] -rotate-45" style={{ backgroundColor: `hsl(${themeColors.foreground})` }} />
                                </div>
                            )}
                        </div>
                    </Button>

                    <Button variant="ghost" size="icon" onClick={toggleFullscreen} style={{ color: `hsl(${themeColors.foreground})` }}>
                        {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    </Button>

                    {!state.isGameOver && (
                        <>
                            <Button variant="ghost" size="icon" onClick={togglePause} style={{ color: `hsl(${themeColors.foreground})` }}>
                                {state.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => { resetGame(); startGame(); }} style={{ color: `hsl(${themeColors.foreground})` }}>
                                <RotateCcw className="w-4 h-4" />
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Game Area */}
            <div className="flex-1 w-full max-w-4xl flex items-center justify-center relative min-h-0">

                {/* Active Power-ups HUD */}
                {state.isPlaying && state.activePowerUps.length > 0 && (
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-2 z-20 pointer-events-none">
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
                                    className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold shadow-lg"
                                    style={{ backgroundColor: `hsl(${themeColors.accent})`, color: `hsl(${themeColors.background})` }}
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
                    theme={config.theme}  // Modified to use the new exact theme mapping
                    gridSize={config.gridSize}
                    renderFraction={renderFraction}
                />

                {/* Overlays */}
                {state.isGameOver && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10 rounded-xl">
                        <div className="text-center p-8 rounded-xl" style={{ backgroundColor: `hsl(${themeColors.background})`, border: `2px solid hsl(${themeColors.foreground})` }}>
                            <h2 className="text-4xl font-black mb-2" style={{ color: `hsl(${themeColors.accent})` }}>GAME OVER</h2>
                            <p className="text-xl mb-6" style={{ color: `hsl(${themeColors.foreground})` }}>Punteggio: {state.score}</p>
                            <div className="flex gap-4">
                                <Button size="lg" onClick={() => { resetGame(); startGame(); }}>Gioca ancora</Button>
                                <Button variant="outline" size="lg" onClick={onBackToMenu}>Menu</Button>
                            </div>
                        </div>
                    </div>
                )}

                {state.isPaused && !state.isGameOver && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10 rounded-xl">
                        <div className="text-center">
                            <h2 className="text-3xl font-black tracking-widest" style={{ color: `hsl(${themeColors.foreground})` }}>PAUSA</h2>
                            <p className="opacity-70 mt-2" style={{ color: `hsl(${themeColors.foreground})` }}>Premi SPAZIO per continuare</p>
                        </div>
                    </div>
                )}
            </div>

            <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Uscire dalla partita?</AlertDialogTitle>
                        <AlertDialogDescription>
                            La partita è in corso. Se esci, i tuoi progressi andranno persi!
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Continua a giocare</AlertDialogCancel>
                        <AlertDialogAction onClick={onBackToMenu}>Esci</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
