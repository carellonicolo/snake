-- Add foreign key constraint between game_scores and profiles for the join to work
ALTER TABLE public.game_scores 
ADD CONSTRAINT fk_game_scores_profiles 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;