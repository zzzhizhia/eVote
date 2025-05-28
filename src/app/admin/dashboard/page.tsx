'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Settings } from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAdminAuthenticated') === 'true';
    if (!isAuthenticated) {
      router.push('/admin');
    }
  }, [router]);

  return (
    <div className="flex flex-col items-center py-10 space-y-8">
      <Card className="w-full max-w-xl shadow-xl">
        <CardHeader className="items-center text-center">
          <Settings className="h-12 w-12 text-primary mb-3" />
          <CardTitle className="text-3xl font-bold">Admin Dashboard</CardTitle>
          <CardDescription className="text-lg">Manage your eVote application settings and content.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4 p-6">
          <Button asChild size="lg" className="w-full max-w-xs shadow-md hover:shadow-lg transition-shadow">
            <Link href="/admin/create-poll" className="flex items-center">
              <PlusCircle className="mr-2 h-5 w-5" />
              Create New Poll
            </Link>
          </Button>
          {/* Add more admin links here as needed */}
          {/* 
          <Button variant="outline" size="lg" className="w-full max-w-xs shadow-md hover:shadow-lg transition-shadow">
            <ListChecks className="mr-2 h-5 w-5" />
            View Existing Polls (Coming Soon)
          </Button>
          */}
        </CardContent>
      </Card>
    </div>
  );
}
