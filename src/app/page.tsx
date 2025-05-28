
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone, VoteIcon, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface CustomTextsForLocale {
  homePageTitle?: string;
  homePageDescription?: string;
  homePageIntroText?: string;
}

export default function HomePage() {
  const { t, locale } = useLanguage();
  const [isLoadingTexts, setIsLoadingTexts] = useState(true);
  
  const [displayTitle, setDisplayTitle] = useState('');
  const [displayDescription, setDisplayDescription] = useState('');
  const [introParagraph, setIntroParagraph] = useState('');

  const defaultLocalizedTexts = useMemo(() => ({
    title: t('home.title'),
    description: t('home.description'),
    introParagraph: t('home.defaultIntro'),
  }), [t]);

  const loadCustomTexts = useCallback(async () => {
    setIsLoadingTexts(true);
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) {
        let errorDetails = `Status: ${res.status}`;
        try {
          const errorData = await res.json();
          errorDetails += `, Message: ${errorData.message || 'Unknown server error'}`;
        } catch (e) {
          try {
            const textError = await res.text();
            errorDetails += `, Body: ${textError.substring(0, 200)}`;
          } catch (textE) {
            errorDetails += `, Body: Could not read error body.`;
          }
        }
        throw new Error(`Failed to fetch settings. ${errorDetails}`);
      }
      const settingsData = await res.json();
      
      const currentLocaleCustomTexts: CustomTextsForLocale = settingsData.customTexts?.[locale] || {};

      setDisplayTitle(currentLocaleCustomTexts.homePageTitle || defaultLocalizedTexts.title);
      setDisplayDescription(currentLocaleCustomTexts.homePageDescription || defaultLocalizedTexts.description);
      setIntroParagraph(currentLocaleCustomTexts.homePageIntroText || defaultLocalizedTexts.introParagraph);

    } catch (error) {
      console.error("Error loading custom texts from API:", error);
      setDisplayTitle(defaultLocalizedTexts.title);
      setDisplayDescription(defaultLocalizedTexts.description);
      setIntroParagraph(defaultLocalizedTexts.introParagraph);
    }
    setIsLoadingTexts(false);
  }, [locale, defaultLocalizedTexts, t]); // Added t to dependencies

  useEffect(() => {
    loadCustomTexts();
  }, [loadCustomTexts]);

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
