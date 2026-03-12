import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
    Gamepad2,
    Settings,
    Volume2,
    Music,
    RotateCcw,
    Palette,
    Sparkles,
    Zap,
    Grid,
    Square,
    Trophy,
    Github,
    Play,
    Home
} from 'lucide-react';
import { GameConfig, GameMode, GameTheme, THEME_PRESETS } from '@/types/game';
import { cn } from '@/lib/utils';
import { SlitheringSnake } from './SlitheringSnake';

interface MainMenuProps {
    onStartGame: (config: GameConfig) => void;
    onViewLeaderboard?: () => void;
}

const THEME_OPTIONS: { value: GameTheme; label: string; icon: string; description: string }[] = [
    { value: 'retro', label: 'Retro Arcade', icon: '🕹️', description: 'Neon glow, pixel vibes' },
    { value: 'minimal', label: 'Minimal', icon: '⚪', description: 'Chiaro, bianco e nero' },
    { value: 'minimal-dark', label: 'Minimal Dark', icon: '⚫', description: 'Scuro, bianco e nero' },
    { value: 'futuristic', label: 'Futuristico', icon: '🚀', description: 'Glow & particelle' },
    { value: 'ocean', label: 'Ocean', icon: '🌊', description: 'Blu profondo, acquamarina' },
    { value: 'sunset', label: 'Sunset', icon: '🌅', description: 'Arancio e viola caldo' },
    { value: 'candy', label: 'Candy', icon: '🍬', description: 'Rosa pastello, giocoso' },
    { value: 'sepia', label: 'Sepia', icon: '🏜️', description: 'Vintage fotografico' },
    { value: 'blood', label: 'Blood', icon: '🩸', description: 'Rosso intenso su nero' },
    { value: 'matrix', label: 'Matrix', icon: '🌿', description: 'Verde terminale hacker' },
    { value: 'frost', label: 'Frost', icon: '❄️', description: 'Azzurro ghiaccio, pulito' },
    { value: 'vaporwave', label: 'Vaporwave', icon: '👾', description: 'Rosa/ciano anni 80' },
    { value: 'custom', label: 'Personalizzato', icon: '🌈', description: 'Scegli i tuoi colori' },
];

const MODE_OPTIONS: { value: GameMode; label: string; icon: React.ReactNode; description: string }[] = [
    { value: 'classic', label: 'Classico', icon: <Square className="w-6 h-6" />, description: 'Muri letali' },
    { value: 'endless', label: 'Infinito', icon: <Grid className="w-6 h-6" />, description: 'Muri passabili' },
];

const COLOR_PRESETS = [
    '210 100% 50%', // Blue
    '0 80% 50%',    // Red
    '120 70% 45%',  // Green
    '45 100% 50%',  // Yellow
    '280 80% 55%',  // Purple
    '180 70% 45%',  // Cyan
    '320 80% 55%',  // Pink
    '30 90% 50%',   // Orange
];

export const MainMenu: React.FC<MainMenuProps> = ({ onStartGame, onViewLeaderboard }) => {
    const [showConfig, setShowConfig] = useState(false);
    const getDefaultConfig = (mode: GameMode): GameConfig => ({
        theme: 'retro',
        mode,
        gridSize: 30,
        speedMultiplier: 5,
        enableWalls: false,
        powerUpsEnabled: true,
        soundEnabled: true,
        musicEnabled: true,
        particlesEnabled: true,
        player1Nickname: 'Player 1',
        player1Color: THEME_PRESETS.retro.snake,
    });

    const [config, setConfig] = useState<GameConfig>(getDefaultConfig('classic'));

    const handleResetDefaults = () => {
        setConfig(getDefaultConfig(config.mode));
    };

    const handleThemeChange = (theme: GameTheme) => {
        const themeColors = THEME_PRESETS[theme];
        setConfig(prev => ({
            ...prev,
            theme,
            player1Color: themeColors.snake,
        }));
    };

    const handleStartGame = () => {
        onStartGame(config);
    };

    if (!showConfig) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background relative overflow-hidden">
                {/* Abstract background */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[10%] left-[5%] w-64 h-64 rounded-full bg-primary/5 blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
                    <div className="absolute bottom-[15%] right-[10%] w-80 h-80 rounded-full bg-accent/5 blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
                    <div className="absolute top-[40%] right-[25%] w-48 h-48 rounded-full bg-primary/3 blur-2xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '4s' }} />
                    <div className="absolute bottom-[40%] left-[20%] w-56 h-56 rounded-full bg-accent/3 blur-2xl animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />
                    <div
                        className="absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
                            backgroundSize: '60px 60px',
                        }}
                    />
                    <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="diag" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                                <line x1="0" y1="0" x2="0" y2="40" stroke="hsl(var(--foreground))" strokeWidth="0.5" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#diag)" />
                    </svg>
                    <SlitheringSnake />
                </div>
                <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h1 className="game-title text-7xl md:text-9xl font-black mb-2 bg-gradient-to-b from-primary via-primary/80 to-accent bg-clip-text text-transparent leading-none">
                        SNAKE
                    </h1>
                    <div className="flex items-center justify-center gap-3 mt-4">
                        <span className="h-px w-12 bg-gradient-to-r from-transparent to-primary/50" />
                        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground font-medium">Ultimate Edition</p>
                        <span className="h-px w-12 bg-gradient-to-l from-transparent to-primary/50" />
                    </div>
                </div>

                <div className="grid gap-4 w-full max-w-md animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
                    {MODE_OPTIONS.map((option) => (
                        <Button
                            key={option.value}
                            variant="outline"
                            size="lg"
                            className="h-20 justify-start gap-4 text-left hover:scale-[1.02] transition-transform bg-background/90 backdrop-blur-sm"
                            onClick={() => {
                                setConfig(getDefaultConfig(option.value));
                                setShowConfig(true);
                            }}
                        >
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                {option.icon}
                            </div>
                            <div>
                                <div className="font-semibold">{option.label}</div>
                                <div className="text-sm text-muted-foreground">{option.description}</div>
                            </div>
                        </Button>
                    ))}

                    <div className="flex gap-2 mt-4">
                        {onViewLeaderboard && (
                            <Button
                                variant="ghost"
                                size="lg"
                                className="h-16 flex-1"
                                onClick={onViewLeaderboard}
                            >
                                <Trophy className="w-5 h-5 mr-2" />
                                Classifica
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="lg"
                            className="h-16 flex-1"
                            asChild
                        >
                            <a href="#" target="_blank" rel="noopener noreferrer">
                                <Github className="w-5 h-5 mr-2" />
                                GitHub
                            </a>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background relative overflow-hidden">
            {/* Abstract background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[10%] left-[5%] w-64 h-64 rounded-full bg-primary/5 blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
                <div className="absolute bottom-[15%] right-[10%] w-80 h-80 rounded-full bg-accent/5 blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
                <div className="absolute top-[40%] right-[25%] w-48 h-48 rounded-full bg-primary/3 blur-2xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '4s' }} />
                <div className="absolute bottom-[40%] left-[20%] w-56 h-56 rounded-full bg-accent/3 blur-2xl animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
                        backgroundSize: '60px 60px',
                    }}
                />
                <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="diag2" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                            <line x1="0" y1="0" x2="0" y2="40" stroke="hsl(var(--foreground))" strokeWidth="0.5" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#diag2)" />
                </svg>
            </div>
            <h1 className="game-title text-5xl md:text-6xl font-black mb-4 bg-gradient-to-b from-primary via-primary/80 to-accent bg-clip-text text-transparent relative z-10 text-center leading-none">
                SNAKE
            </h1>
            <Card className="w-full max-w-2xl relative z-10 bg-background/95 backdrop-blur-sm overflow-hidden">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Settings className="w-4 h-4" />
                                Configura Partita
                            </CardTitle>
                            <CardDescription className="text-xs">
                                {MODE_OPTIONS.find(m => m.value === config.mode)?.label} — {MODE_OPTIONS.find(m => m.value === config.mode)?.description}
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={handleResetDefaults} title="Ripristina valori predefiniti">
                                <RotateCcw className="w-3 h-3 mr-1" />
                                Default
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => setShowConfig(false)} title="Torna alla home">
                                <Home className="w-3 h-3 mr-1" />
                                Home
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                    {/* Main grid: Themes left, Settings right */}
                    <div className="grid md:grid-cols-2 gap-3">
                        {/* Left: Theme */}
                        <div className="space-y-1.5">
                            <Label className="flex items-center gap-1.5 text-xs">
                                <Palette className="w-3 h-3" />
                                Tema
                            </Label>
                            <div className="grid grid-cols-2 gap-1 max-h-[320px] overflow-y-auto pr-1">
                                {THEME_OPTIONS.map((theme) => (
                                    <button
                                        key={theme.value}
                                        onClick={() => handleThemeChange(theme.value)}
                                        className={cn(
                                            "p-1.5 rounded-md border-2 text-left transition-colors",
                                            config.theme === theme.value
                                                ? "border-primary bg-primary/10"
                                                : "border-border hover:border-primary/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-base">{theme.icon}</span>
                                            <span className="text-xs font-medium">{theme.label}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Right: Names + Sliders stacked */}
                        <div className="space-y-3">
                            {/* Names */}
                            <div className="space-y-1.5">
                                <Label className="text-xs">Nome</Label>
                                <Input
                                    value={config.player1Nickname}
                                    onChange={(e) => setConfig(prev => ({ ...prev, player1Nickname: e.target.value }))}
                                    maxLength={15}
                                    placeholder="Giocatore 1"
                                    className="h-8 text-sm"
                                />
                            </div>

                            {/* Sliders stacked */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between">
                                    <Label className="text-xs">Velocità Serpente</Label>
                                    <span className="text-xs font-medium">
                                        {config.speedMultiplier <= 3 ? 'Lento' : config.speedMultiplier <= 6 ? 'Normale' : config.speedMultiplier <= 8 ? 'Veloce' : 'Pazzo'}
                                    </span>
                                </div>
                                <Slider
                                    value={[config.speedMultiplier]}
                                    onValueChange={([value]) => setConfig(prev => ({ ...prev, speedMultiplier: value }))}
                                    min={1}
                                    max={10}
                                    step={1}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between">
                                    <Label className="text-xs">Misura Mappa</Label>
                                    <span className="text-xs font-medium">
                                        {config.gridSize}x{config.gridSize}
                                    </span>
                                </div>
                                <Slider
                                    value={[config.gridSize]}
                                    onValueChange={([value]) => setConfig(prev => ({ ...prev, gridSize: value }))}
                                    min={15}
                                    max={50}
                                    step={5}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Player Color (custom theme only) */}
                    {config.theme === 'custom' && (
                        <div className="space-y-1">
                            <Label className="text-xs">Colore Serpente</Label>
                            <div className="flex gap-1.5 flex-wrap">
                                {COLOR_PRESETS.map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => setConfig(prev => ({ ...prev, player1Color: color }))}
                                        className={cn(
                                            "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110",
                                            config.player1Color === color ? "border-foreground scale-110" : "border-muted"
                                        )}
                                        style={{ backgroundColor: `hsl(${color})` }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Row 4: Toggles inline */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4">
                        <div className="p-2 rounded-md border flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <Zap className="w-3.5 h-3.5 text-yellow-500" />
                                <span className="text-xs">Power-ups</span>
                            </div>
                            <Switch
                                checked={config.powerUpsEnabled}
                                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, powerUpsEnabled: checked }))}
                            />
                        </div>
                        <div className="p-2 rounded-md border flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <Grid className="w-3.5 h-3.5 text-red-500" />
                                <span className="text-xs">Ostacoli</span>
                            </div>
                            <Switch
                                checked={config.enableWalls}
                                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableWalls: checked }))}
                            />
                        </div>
                        <div className="p-2 rounded-md border flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                                <span className="text-xs">Particelle</span>
                            </div>
                            <Switch
                                checked={config.particlesEnabled}
                                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, particlesEnabled: checked }))}
                            />
                        </div>
                        <div className="p-2 rounded-md border flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <Volume2 className="w-3.5 h-3.5 text-blue-500" />
                                <span className="text-xs">Effetti</span>
                            </div>
                            <Switch
                                checked={config.soundEnabled}
                                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, soundEnabled: checked }))}
                            />
                        </div>
                        <div className="p-2 rounded-md border flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <Music className="w-3.5 h-3.5 text-purple-500" />
                                <span className="text-xs">Musica</span>
                            </div>
                            <Switch
                                checked={config.musicEnabled}
                                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, musicEnabled: checked }))}
                            />
                        </div>
                    </div>

                    {/* Start Button */}
                    <Button
                        size="lg"
                        className="w-full h-11 text-base gap-2"
                        onClick={handleStartGame}
                    >
                        <Play className="w-4 h-4" />
                        Inizia Partita
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};
