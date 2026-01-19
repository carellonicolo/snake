import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Medal, Award } from 'lucide-react';
import { Difficulty, Theme } from '@/types/game';

interface LeaderboardEntry {
  id: string;
  score: number;
  snake_length: number;
  difficulty: string;
  theme: string;
  created_at: string;
  username: string;
}

interface LeaderboardProps {
  filterDifficulty?: Difficulty;
  filterTheme?: Theme;
  limit?: number;
}

export function Leaderboard({ filterDifficulty, filterTheme, limit = 10 }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      
      // Get scores first
      let query = supabase
        .from('game_scores')
        .select('id, score, snake_length, difficulty, theme, created_at, user_id')
        .order('score', { ascending: false })
        .limit(limit);

      if (filterDifficulty) {
        query = query.eq('difficulty', filterDifficulty);
      }
      if (filterTheme) {
        query = query.eq('theme', filterTheme);
      }

      const { data: scores, error } = await query;

      if (error) {
        console.error('Error fetching leaderboard:', error);
        setLoading(false);
        return;
      }

      if (!scores || scores.length === 0) {
        setEntries([]);
        setLoading(false);
        return;
      }

      // Get usernames for all user_ids
      const userIds = [...new Set(scores.map(s => s.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds);

      const usernameMap = new Map(profiles?.map(p => [p.user_id, p.username]) || []);

      const entriesWithUsernames: LeaderboardEntry[] = scores.map(score => ({
        id: score.id,
        score: score.score,
        snake_length: score.snake_length,
        difficulty: score.difficulty,
        theme: score.theme,
        created_at: score.created_at,
        username: usernameMap.get(score.user_id) || 'Anonimo',
      }));

      setEntries(entriesWithUsernames);
      setLoading(false);
    };

    fetchLeaderboard();
  }, [filterDifficulty, filterTheme, limit]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center font-pixel text-xs">{rank}</span>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
    });
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

  if (entries.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="font-terminal text-muted-foreground">
          Nessun punteggio ancora. Sii il primo!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="font-pixel text-xs text-primary mb-4 flex items-center gap-2">
        <Trophy className="w-4 h-4" />
        CLASSIFICA GLOBALE
      </h3>
      
      <div className="space-y-1">
        {entries.map((entry, index) => (
          <div
            key={entry.id}
            className={`flex items-center gap-3 p-2 rounded ${
              index < 3 ? 'bg-accent/20' : 'bg-muted/30'
            }`}
          >
            <div className="w-8 flex justify-center">
              {getRankIcon(index + 1)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="font-terminal text-sm truncate">
                {entry.username}
              </div>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span>🐍 {entry.snake_length}</span>
                <span>{formatDate(entry.created_at)}</span>
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-pixel text-sm text-primary">
                {entry.score}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
