
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone, VoteIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const HOME_PAGE_INTRO_TEXT_KEY = 'eVote_homePageIntroText_'; // Appending locale
// DEFAULT_HOME_INTRO_CARD_DESCRIPTION is now part of translations
// DEFAULT_HOME_INTRO_PARAGRAPH is now part of translations

export default function HomePage() {
  const { t, locale } = useLanguage();
  const [introParagraph, setIntroParagraph] = useState('');

  const defaultHomeIntroParagraph = t('home.defaultIntro');
  const defaultHomeIntroCardDescription = t('home.description');


  useEffect(() => {
    // Update introParagraph when locale changes or component mounts
    const currentLocaleIntroKey = `${HOME_PAGE_INTRO_TEXT_KEY}${locale}`;
    try {
      const storedIntro = localStorage.getItem(currentLocaleIntroKey);
      if (storedIntro && storedIntro.trim() !== "") {
        setIntroParagraph(storedIntro);
      } else {
        setIntroParagraph(defaultHomeIntroParagraph); 
      }
    } catch (error) {
      console.error("Error loading home page intro from localStorage:", error);
      setIntroParagraph(defaultHomeIntroParagraph);
    }
  }, [locale, defaultHomeIntroParagraph]);
  
  // Effect to update introParagraph if the default text itself changes due to language switch
  // and no custom text is set.
  useEffect(() => {
    const currentLocaleIntroKey = `${HOME_PAGE_INTRO_TEXT_KEY}${locale}`;
    const storedIntro = localStorage.getItem(currentLocaleIntroKey);
    if (!storedIntro || storedIntro.trim() === "") {
       setIntroParagraph(defaultHomeIntroParagraph);
    }
  }, [defaultHomeIntroParagraph, locale]);


  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] py-12">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="items-center text-center">
          <Megaphone className="h-16 w-16 text-primary mb-4" />
          <CardTitle className="text-4xl font-extrabold tracking-tight">
            {t('home.title')}
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            {/* If this needs to be admin-editable, it would follow the same pattern as introParagraph */}
            {defaultHomeIntroCardDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-base mb-6 whitespace-pre-line">
            {introParagraph}
          </p>
          <p className="text-base font-semibold">
            {t('home.votingPeriod')}
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
