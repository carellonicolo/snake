import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, LogIn, UserPlus, X } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [username, setUsername] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const { signIn, signUp } = useAuth();
    const { toast } = useToast();

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
                    toast({
                        title: 'Errore di accesso',
                        description: error.message.includes('Invalid login')
                            ? 'Email o password non corretti'
                            : error.message,
                        variant: 'destructive',
                    });
                } else {
                    toast({
                        title: 'Benvenuto!',
                        description: 'Accesso effettuato con successo',
                    });
                    onSuccess?.();
                    onClose();
                }
            } else {
                const { error } = await signUp(email, password, username);
                if (error) {
                    toast({
                        title: 'Errore di registrazione',
                        description: error.message.includes('already registered')
                            ? 'Questa email è già associata a un account'
                            : error.message,
                        variant: 'destructive',
                    });
                } else {
                    toast({
                        title: 'Account creato!',
                        description: 'Registrazione completata con successo',
                    });
                    onSuccess?.();
                    onClose();
                }
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[400px] bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl">
                <DialogHeader>
                    <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <LogIn className="w-6 h-6" />
                        </div>
                    </div>
                    <DialogTitle className="text-2xl font-black text-center tracking-tight">
                        {isLogin ? 'Bentornato!' : 'Crea Account'}
                    </DialogTitle>
                    <DialogDescription className="text-center font-terminal text-xs">
                        {isLogin
                            ? 'Inserisci le tue credenziali per continuare a giocare.'
                            : 'Unisciti alla sfida e salva i tuoi punteggi in classifica.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    {!isLogin && (
                        <div className="space-y-1.5">
                            <Label className="text-xs uppercase tracking-wider opacity-60">Username</Label>
                            <Input
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Il tuo nickname"
                                className="bg-muted/30 border-border/50 focus:border-primary/50"
                            />
                            {errors.username && <p className="text-[10px] text-destructive uppercase font-bold">{errors.username}</p>}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider opacity-60">Email</Label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@esempio.com"
                            className="bg-muted/30 border-border/50 focus:border-primary/50"
                        />
                        {errors.email && <p className="text-[10px] text-destructive uppercase font-bold">{errors.email}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider opacity-60">Password</Label>
                        <div className="relative">
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="bg-muted/30 border-border/50 focus:border-primary/50 pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {errors.password && <p className="text-[10px] text-destructive uppercase font-bold">{errors.password}</p>}
                    </div>

                    {!isLogin && (
                        <div className="space-y-1.5">
                            <Label className="text-xs uppercase tracking-wider opacity-60">Conferma Password</Label>
                            <Input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="bg-muted/30 border-border/50 focus:border-primary/50"
                            />
                            {errors.confirmPassword && <p className="text-[10px] text-destructive uppercase font-bold">{errors.confirmPassword}</p>}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 text-base font-bold gap-2 mt-4"
                    >
                        {loading ? (
                            <span className="animate-pulse">CARICAMENTO...</span>
                        ) : isLogin ? (
                            <>
                                <LogIn size={18} />
                                ACCEDI
                            </>
                        ) : (
                            <>
                                <UserPlus size={18} />
                                REGISTRATI
                            </>
                        )}
                    </Button>
                </form>

                <div className="text-center mt-4">
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setErrors({});
                        }}
                        className="font-terminal text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                    >
                        {isLogin ? "Non hai un account? Registrati ora" : "Hai già un account? Accedi"}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
