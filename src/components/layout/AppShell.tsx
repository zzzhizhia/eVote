import type { ReactNode } from 'react';
import Header from './Header';
// import Footer from './Footer'; // Footer import removed

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      {/* <Footer /> Footer component rendering removed */}
    </div>
  );
}
