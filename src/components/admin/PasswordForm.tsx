
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyRound, ShieldAlert } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/contexts/LanguageContext';

// In a real app, this should be a Server Action or API call, and password stored securely.
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'; // Default for demo

export default function PasswordForm() {
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate server-side check
    await new Promise(resolve => setTimeout(resolve, 500));

    if (password === ADMIN_PASSWORD) {
      toast({
        title: t('toast.accessGranted'),
        description: t('toast.accessGrantedDescription'),
      });
      // Store a session token or flag in a real app
      localStorage.setItem('isAdminAuthenticated', 'true'); // Simple flag for demo
      router.push('/admin/dashboard'); 
    } else {
      setError(t('admin.login.invalidPasswordError'));
      toast({
        title: t('toast.accessDenied'),
        description: t('toast.accessDeniedDescription'),
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-15rem)]">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <KeyRound className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">{t('admin.login.title')}</CardTitle>
          <CardDescription>
            {t('admin.login.description')}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t('admin.login.passwordLabel')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="text-lg"
                aria-describedby={error ? "password-error" : undefined}
              />
            </div>
            {error && (
              <p id="password-error" className="text-sm text-destructive flex items-center gap-1">
                <ShieldAlert className="h-4 w-4" /> {error}
              </p>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full shadow-lg" disabled={isLoading}>
              {isLoading ? t('admin.login.authenticating') : t('admin.login.button')}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
