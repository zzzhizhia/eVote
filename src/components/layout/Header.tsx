
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { VoteIcon, BarChart3Icon, ShieldCheckIcon, HomeIcon, LanguagesIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const { locale, setLocale, t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-[#FFFFFF]/95 backdrop-blur supports-[backdrop-filter]:bg-[#FFFFFF]/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <VoteIcon className="h-7 w-7 text-primary" />
          <span className="text-2xl font-bold text-foreground">{t('header.eVote')}</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" asChild>
            <Link href="/" className="flex items-center gap-1">
              <HomeIcon className="h-4 w-4" />
              <span className="hidden sm:inline">{t('header.home')}</span>
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/vote" className="flex items-center gap-1">
              <VoteIcon className="h-4 w-4" />
              <span className="hidden sm:inline">{t('header.vote')}</span>
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/results" className="flex items-center gap-1">
              <BarChart3Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{t('header.results')}</span>
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/admin" className="flex items-center gap-1">
              <ShieldCheckIcon className="h-4 w-4" />
              <span className="hidden sm:inline">{t('header.admin')}</span>
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <LanguagesIcon className="h-5 w-5" />
                <span className="sr-only">Change language</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLocale('en')} disabled={locale === 'en'}>
                {t('header.language.english')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocale('zh-CN')} disabled={locale === 'zh-CN'}>
                {t('header.language.chinese')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
}
