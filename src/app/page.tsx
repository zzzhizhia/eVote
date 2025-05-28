
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone, VoteIcon } from 'lucide-react';

const HOME_PAGE_INTRO_TEXT_KEY = 'eVote_homePageIntroText';
const DEFAULT_HOME_INTRO_CARD_DESCRIPTION = "Your voice matters. Make sure to cast your vote and shape the future.";
const DEFAULT_HOME_INTRO_PARAGRAPH = "We are pleased to announce that the next presidential election will be held soon. This is your opportunity to choose the leader who will best represent your interests. Prepare to learn about the candidates and make an informed decision.";

export default function HomePage() {
  const [introParagraph, setIntroParagraph] = useState(DEFAULT_HOME_INTRO_PARAGRAPH);
  // The CardDescription part could also be made editable if desired, following the same pattern.
  // For now, we are only making the main paragraph editable.

  useEffect(() => {
    try {
      const storedIntro = localStorage.getItem(HOME_PAGE_INTRO_TEXT_KEY);
      if (storedIntro && storedIntro.trim() !== "") {
        setIntroParagraph(storedIntro);
      } else {
        setIntroParagraph(DEFAULT_HOME_INTRO_PARAGRAPH); // Fallback to default
      }
    } catch (error) {
      console.error("Error loading home page intro from localStorage:", error);
      setIntroParagraph(DEFAULT_HOME_INTRO_PARAGRAPH); // Fallback on error
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] py-12"> {/* Adjust min-h based on header/footer */}
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="items-center text-center">
          <Megaphone className="h-16 w-16 text-primary mb-4" />
          <CardTitle className="text-4xl font-extrabold tracking-tight">
            Upcoming Presidential Election!
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            {DEFAULT_HOME_INTRO_CARD_DESCRIPTION}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-base mb-6 whitespace-pre-line">
            {introParagraph}
          </p>
          <p className="text-base font-semibold">
            Voting Period: To Be Announced
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-shadow">
            <Link href="/vote" className="flex items-center gap-2">
              <VoteIcon className="h-5 w-5" />
              Proceed to Voting
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
