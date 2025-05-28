
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone, VoteIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const HOME_PAGE_TITLE_KEY = 'eVote_homePageTitle_';
const HOME_PAGE_INTRO_TEXT_KEY = 'eVote_homePageIntroText_';

export default function HomePage() {
  const { t, locale } = useLanguage();
  const [displayTitle, setDisplayTitle] = useState('');
  const [introParagraph, setIntroParagraph] = useState('');

  const defaultHomeTitle = t('home.title');
  const defaultHomeIntroParagraph = t('home.defaultIntro');
  const defaultHomeIntroCardDescription = t('home.description');


  useEffect(() => {
    const currentLocaleTitleKey = `${HOME_PAGE_TITLE_KEY}${locale}`;
    try {
        const storedTitle = localStorage.getItem(currentLocaleTitleKey);
        setDisplayTitle((storedTitle && storedTitle.trim() !== "") ? storedTitle : defaultHomeTitle);
    } catch (error) {
        console.error("Error loading home page title from localStorage:", error);
        setDisplayTitle(defaultHomeTitle);
    }

    const currentLocaleIntroKey = `${HOME_PAGE_INTRO_TEXT_KEY}${locale}`;
    try {
      const storedIntro = localStorage.getItem(currentLocaleIntroKey);
      setIntroParagraph((storedIntro && storedIntro.trim() !== "") ? storedIntro : defaultHomeIntroParagraph);
    } catch (error) {
      console.error("Error loading home page intro from localStorage:", error);
      setIntroParagraph(defaultHomeIntroParagraph);
    }
  }, [locale, defaultHomeTitle, defaultHomeIntroParagraph]);
  
  useEffect(() => {
    const currentLocaleTitleKey = `${HOME_PAGE_TITLE_KEY}${locale}`;
    const storedTitle = localStorage.getItem(currentLocaleTitleKey);
    if (!storedTitle || storedTitle.trim() === "") {
       setDisplayTitle(defaultHomeTitle);
    }

    const currentLocaleIntroKey = `${HOME_PAGE_INTRO_TEXT_KEY}${locale}`;
    const storedIntro = localStorage.getItem(currentLocaleIntroKey);
    if (!storedIntro || storedIntro.trim() === "") {
       setIntroParagraph(defaultHomeIntroParagraph);
    }
  }, [defaultHomeTitle, defaultHomeIntroParagraph, locale]);


  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] py-12">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="items-center text-center">
          <Megaphone className="h-16 w-16 text-primary mb-4" />
          <CardTitle className="text-4xl font-extrabold tracking-tight">
            {displayTitle}
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
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

    