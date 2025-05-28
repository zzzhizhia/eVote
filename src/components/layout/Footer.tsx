
import { Github } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-background text-muted-foreground">
      <div className="container mx-auto px-4 py-6 text-center text-sm">
        <span>© 2025 </span>
        <span className="text-red-500">♥</span>
        <span> zzzhizhi. </span>
        <Link href="https://github.com/zzzhizhia/evote" target="_blank" rel="noopener noreferrer" className="inline-flex items-baseline hover:text-primary transition-colors ml-1">
          <Github className="h-3.5 w-3.5 mr-1 relative top-[1px]" />
          eVote
        </Link>
      </div>
    </footer>
  );
}
