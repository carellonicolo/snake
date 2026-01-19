import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(6, 'La password deve avere almeno 6 caratteri'),
});

const signupSchema = loginSchema.extend({
  username: z.string().min(3, 'Lo username deve avere almeno 3 caratteri').max(20, 'Lo username può avere massimo 20 caratteri'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Le password non corrispondono',
  path: ['confirmPassword'],
});

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const validateForm = () => {
    try {
      if (isLogin) {
        loginSchema.parse({ email, password });
      } else {
        signupSchema.parse({ email, password, confirmPassword, username });
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login')) {
            toast({
              title: 'Errore di accesso',
              description: 'Email o password non corretti',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Errore',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Benvenuto!',
            description: 'Accesso effettuato con successo',
          });
          navigate('/');
        }
      } else {
        const { error } = await signUp(email, password, username);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: 'Email già registrata',
              description: 'Questa email è già associata a un account',
              variant: 'destructive',
            });
          } else if (error.message.includes('duplicate key') && error.message.includes('username')) {
            toast({
              title: 'Username non disponibile',
              description: 'Questo username è già in uso',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Errore',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Account creato!',
            description: 'Registrazione completata con successo',
          });
          navigate('/');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-pixel text-2xl text-primary mb-2">🐍 SNAKE</h1>
          <p className="font-terminal text-muted-foreground">
            {isLogin ? 'Accedi per giocare' : 'Crea il tuo account'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 bg-card p-6 rounded-lg border border-border">
          {!isLogin && (
            <div>
              <label className="block font-terminal text-sm text-muted-foreground mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-input rounded font-terminal text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Il tuo nickname"
              />
              {errors.username && (
                <p className="text-destructive text-xs mt-1 font-terminal">{errors.username}</p>
              )}
            </div>
          )}

          <div>
            <label className="block font-terminal text-sm text-muted-foreground mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-input rounded font-terminal text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="email@esempio.com"
            />
            {errors.email && (
              <p className="text-destructive text-xs mt-1 font-terminal">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block font-terminal text-sm text-muted-foreground mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 pr-10 bg-background border border-input rounded font-terminal text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-destructive text-xs mt-1 font-terminal">{errors.password}</p>
            )}
          </div>

          {!isLogin && (
            <div>
              <label className="block font-terminal text-sm text-muted-foreground mb-1">
                Conferma Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-input rounded font-terminal text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="text-destructive text-xs mt-1 font-terminal">{errors.confirmPassword}</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full retro-btn flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-pulse">...</span>
            ) : isLogin ? (
              <>
                <LogIn size={16} />
                <span>ACCEDI</span>
              </>
            ) : (
              <>
                <UserPlus size={16} />
                <span>REGISTRATI</span>
              </>
            )}
          </button>
        </form>

        {/* Toggle */}
        <div className="text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setErrors({});
            }}
            className="font-terminal text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {isLogin ? "Non hai un account? Registrati" : "Hai già un account? Accedi"}
          </button>
        </div>
      </div>
    </div>
  );
}
