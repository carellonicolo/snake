import React, { useState, useEffect } from 'react';
import { MainMenu } from '@/components/game/MainMenu';
import { SnakeGame } from '@/components/game/SnakeGame';
import { Leaderboard } from '@/components/game/Leaderboard';
import { AuthModal } from '@/components/auth/AuthModal';
import { GameConfig } from '@/types/game';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { X, LogOut, User, LogIn as LogInIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type Screen = 'menu' | 'game' | 'leaderboard';

const Index = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [currentScreen, setCurrentScreen] = useState<Screen>('menu');
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [username, setUsername] = useState<string>('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const loadUsername = async () => {
      if (loading || !user) {
        setUsername('');
        return;
      }

      try {
        console.log('Fetching profile for user:', user.id);

        // Try 'id' first (standard PK)
        let { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Profile fetch error:', error);
        }

        if (data?.username) {
          console.log('Username found:', data.username);
          setUsername(data.username);
        }
      } catch (err) {
        console.error('Silent error in profile fetch:', err);
      }
    };

    loadUsername();
  }, [user, loading]);

  const handleStartGame = (config: GameConfig) => {
    setGameConfig(config);
    setCurrentScreen('game');
  };

  const handleBackToMenu = () => {
    setCurrentScreen('menu');
    setGameConfig(null);
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: '👋 Arrivederci!',
      description: 'Sei stato disconnesso',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center animate-pulse">
          <h1 className="font-pixel text-2xl text-primary mb-4">🐍 SNAKE</h1>
          <p className="font-terminal text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (currentScreen === 'game' && gameConfig) {
    return (
      <SnakeGame
        config={gameConfig}
        onBackToMenu={handleBackToMenu}
      />
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Header for user info while in Menu/Leaderboard */}
      {currentScreen !== 'game' && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-background/50 backdrop-blur-md p-2 rounded-lg border border-border">
          {user ? (
            <>
              <div className="flex items-center gap-2 px-2 text-sm font-medium">
                <User className="w-4 h-4 text-primary" />
                {username || 'Giocatore'}
              </div>
              <div className="w-px h-4 bg-border mx-1" />
              <Button variant="ghost" size="icon" onClick={handleSignOut} title="Esci" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive">
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAuthModalOpen(true)}
              className="gap-2 h-8"
            >
              <LogInIcon className="w-4 h-4 text-primary" />
              Accedi
            </Button>
          )}
        </div>
      )}

      {currentScreen === 'menu' && (
        <MainMenu
          onStartGame={handleStartGame}
          onViewLeaderboard={() => setCurrentScreen('leaderboard')}
          isAuthenticated={!!user}
          onAuthRequired={() => setIsAuthModalOpen(true)}
        />
      )}

      {currentScreen === 'leaderboard' && (
        <div className="flex items-center justify-center min-h-screen p-4 bg-background relative">
          <div className="bg-card border border-border rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-auto shadow-2xl relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-xl text-primary">🏆 CLASSIFICA GLOBALE</h2>
              <Button variant="ghost" size="icon" onClick={() => setCurrentScreen('menu')}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <Leaderboard limit={20} />
          </div>
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        </div>
      )}
    </div>
  );
};

export default Index;
