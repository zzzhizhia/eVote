
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone, VoteIcon, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { CustomTexts } from '@/app/api/custom-texts/route';

export default function HomePage() {
  const { t, locale } = useLanguage();
  const [isLoadingTexts, setIsLoadingTexts] = useState(true);
  const [fetchedCustomTexts, setFetchedCustomTexts] = useState<CustomTexts | null>(null);

  const defaultTexts = useMemo(() => ({
    title: t('home.title'),
    description: t('home.description'),
    introParagraph: t('home.defaultIntro'),
  }), [t]);

  const fetchTexts = useCallback(async () => {
    setIsLoadingTexts(true);
    try {
      const response = await fetch('/api/custom-texts');
      if (!response.ok) {
        throw new Error('Failed to fetch custom texts');
      }
      const data = await response.json();
      setFetchedCustomTexts(data);
    } catch (error) {
      console.error("Error loading custom texts from API:", error);
      setFetchedCustomTexts(null); // Fallback to defaults on error
    }
    setIsLoadingTexts(false);
  }, []);

  useEffect(() => {
    fetchTexts();
  }, [fetchTexts]);

  const displayTitle = useMemo(() => {
    if (isLoadingTexts || !fetchedCustomTexts) return defaultTexts.title;
    return fetchedCustomTexts[locale]?.homePageTitle || defaultTexts.title;
  }, [isLoadingTexts, fetchedCustomTexts, locale, defaultTexts.title]);

  const displayDescription = useMemo(() => {
    if (isLoadingTexts || !fetchedCustomTexts) return defaultTexts.description;
    return fetchedCustomTexts[locale]?.homePageDescription || defaultTexts.description;
  }, [isLoadingTexts, fetchedCustomTexts, locale, defaultTexts.description]);

  const introParagraph = useMemo(() => {
    if (isLoadingTexts || !fetchedCustomTexts) return defaultTexts.introParagraph;
    return fetchedCustomTexts[locale]?.homePageIntroText || defaultTexts.introParagraph;
  }, [isLoadingTexts, fetchedCustomTexts, locale, defaultTexts.introParagraph]);

  if (isLoadingTexts) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">{t('home.loadingContent')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] py-12">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="items-center text-center">
          <Megaphone className="h-16 w-16 text-primary mb-4" />
          <CardTitle className="text-4xl font-extrabold tracking-tight">
            {displayTitle}
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            {displayDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-base mb-6 whitespace-pre-line">
            {introParagraph}
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-shadow">
            <Link href="/vote" className="flex items-center gap-2">
              <VoteIcon className="h-5 w-5" />
              {t('home.proceedToVoting')}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
