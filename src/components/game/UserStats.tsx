import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BarChart3, Clock, Gamepad2, Zap, TrendingUp } from 'lucide-react';

interface Stats {
  total_games: number;
  total_score: number;
  best_score: number;
  max_snake_length: number;
  total_play_time_seconds: number;
  total_powerups_collected: number;
  games_by_difficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export function UserStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching stats:', error);
      } else if (data) {
        setStats({
          ...data,
          games_by_difficulty: data.games_by_difficulty as Stats['games_by_difficulty'],
        });
      }
      setLoading(false);
    };

    fetchStats();
  }, [user]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="font-pixel text-xs text-muted-foreground animate-pulse">
          Caricamento...
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="font-terminal text-muted-foreground">
          Nessuna statistica disponibile. Gioca per iniziare!
        </p>
      </div>
    );
  }

  const statItems = [
    {
      icon: Gamepad2,
      label: 'Partite Totali',
      value: stats.total_games,
    },
    {
      icon: TrendingUp,
      label: 'Miglior Punteggio',
      value: stats.best_score,
    },
    {
      icon: BarChart3,
      label: 'Punteggio Totale',
      value: stats.total_score,
    },
    {
      icon: Clock,
      label: 'Tempo di Gioco',
      value: formatTime(stats.total_play_time_seconds),
    },
    {
      icon: Zap,
      label: 'Power-up Raccolti',
      value: stats.total_powerups_collected,
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-pixel text-xs text-primary mb-4 flex items-center gap-2">
        <BarChart3 className="w-4 h-4" />
        LE TUE STATISTICHE
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {statItems.map((item, index) => (
          <div
            key={index}
            className={`p-3 rounded bg-muted/30 ${index === 0 ? 'col-span-2' : ''}`}
          >
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <item.icon className="w-4 h-4" />
              <span className="font-terminal text-xs">{item.label}</span>
            </div>
            <div className="font-pixel text-lg text-primary">
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Games by difficulty */}
      <div className="p-3 rounded bg-muted/30">
        <div className="font-terminal text-xs text-muted-foreground mb-2">
          Partite per Difficoltà
        </div>
        <div className="flex justify-between font-terminal text-sm">
          <div>
            <span className="text-green-500">🟢</span> Facile: {stats.games_by_difficulty.easy}
          </div>
          <div>
            <span className="text-yellow-500">🟡</span> Medio: {stats.games_by_difficulty.medium}
          </div>
          <div>
            <span className="text-red-500">🔴</span> Difficile: {stats.games_by_difficulty.hard}
          </div>
        </div>
      </div>

      {/* Max snake length */}
      <div className="p-3 rounded bg-accent/20 text-center">
        <div className="font-terminal text-xs text-muted-foreground">
          Serpente più lungo
        </div>
        <div className="font-pixel text-2xl text-primary">
          🐍 {stats.max_snake_length}
        </div>
      </div>
    </div>
  );
}
