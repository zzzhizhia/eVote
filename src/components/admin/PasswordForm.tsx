
'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyRound, ShieldAlert } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/contexts/LanguageContext';

export default function PasswordForm() {
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if already admin on mount
    fetch('/api/user')
      .then(res => res.json())
      .then(data => {
        if (data.isAdmin) {
          router.push('/admin/dashboard');
        } else {
          setIsCheckingAuth(false);
        }
      })
      .catch(() => setIsCheckingAuth(false));
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        toast({
          title: t('toast.accessGranted'),
          description: t('toast.accessGrantedDescription'),
        });
        router.push('/admin/dashboard');
        router.refresh(); // To ensure layout re-renders with new auth state if necessary
      } else {
        const data = await response.json();
        setError(data.message || t('admin.login.invalidPasswordError'));
        toast({
          title: t('toast.accessDenied'),
          description: data.message || t('toast.accessDeniedDescription'),
          variant: "destructive",
        });
      }
    } catch (err) {
      setError(t('admin.login.networkError'));
      toast({
        title: t('toast.networkErrorTitle'),
        description: t('admin.login.networkErrorDescription'),
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  if (isCheckingAuth) {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-15rem)]">
            <KeyRound className="h-12 w-12 text-primary animate-pulse" />
        </div>
    );
  }

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
