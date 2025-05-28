import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { VoteIcon, BarChart3Icon, ShieldCheckIcon, HomeIcon } from 'lucide-react'; // BarChart3Icon for results, ShieldCheckIcon for admin

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <VoteIcon className="h-7 w-7 text-primary" />
          <span className="text-2xl font-bold text-foreground">eVote</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" asChild>
            <Link href="/" className="flex items-center gap-1">
              <HomeIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/vote" className="flex items-center gap-1">
              <VoteIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Vote</span>
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/results" className="flex items-center gap-1">
              <BarChart3Icon className="h-4 w-4" />
              <span className="hidden sm:inline">Results</span>
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/admin" className="flex items-center gap-1">
              <ShieldCheckIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
