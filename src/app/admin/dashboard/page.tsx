
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PlusCircle, Settings, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";

const RESULTS_VISIBILITY_KEY = 'eVote_isResultsPublic';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isResultsPublic, setIsResultsPublic] = useState(false);
  const [isLoadingVisibility, setIsLoadingVisibility] = useState(true);

  useEffect(() => {
    const authStatus = localStorage.getItem('isAdminAuthenticated') === 'true';
    setIsAdminAuthenticated(authStatus);
    if (!authStatus) {
      router.push('/admin');
    }

    try {
      const storedVisibility = localStorage.getItem(RESULTS_VISIBILITY_KEY);
      if (storedVisibility !== null) {
        setIsResultsPublic(JSON.parse(storedVisibility));
      } else {
        // Default to private if not set
        setIsResultsPublic(false);
        localStorage.setItem(RESULTS_VISIBILITY_KEY, JSON.stringify(false));
      }
    } catch (error) {
      console.error("Error reading results visibility from localStorage:", error);
      setIsResultsPublic(false); // Default to false on error
       toast({
        title: "Error Loading Settings",
        description: "Could not load results visibility setting. Defaulting to private.",
        variant: "destructive",
      });
    }
    setIsLoadingVisibility(false);
  }, [router, toast]);

  const handleResultsVisibilityToggle = (checked: boolean) => {
    try {
      localStorage.setItem(RESULTS_VISIBILITY_KEY, JSON.stringify(checked));
      setIsResultsPublic(checked);
      toast({
        title: `Results Visibility Updated`,
        description: `Poll results are now ${checked ? 'PUBLIC' : 'PRIVATE'}.`,
      });
    } catch (error) {
       console.error("Error saving results visibility to localStorage:", error);
       toast({
        title: "Error Saving Settings",
        description: "Could not save results visibility setting.",
        variant: "destructive",
      });
    }
  };
  
  if (!isAdminAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] py-10">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-3" />
            <CardTitle className="text-2xl">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You are not authorized to view this page. Redirecting to login...</p>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="flex flex-col items-center py-10 space-y-8">
      <Card className="w-full max-w-xl shadow-xl">
        <CardHeader className="items-center text-center">
          <Settings className="h-12 w-12 text-primary mb-3" />
          <CardTitle className="text-3xl font-bold">Admin Dashboard</CardTitle>
          <CardDescription className="text-lg">Manage your eVote application settings and content.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6 p-6">
          <Button asChild size="lg" className="w-full max-w-xs shadow-md hover:shadow-lg transition-shadow">
            <Link href="/admin/create-poll" className="flex items-center">
              <PlusCircle className="mr-2 h-5 w-5" />
              Create New Poll
            </Link>
          </Button>

          <Card className="w-full max-w-xs shadow-md">
            <CardHeader>
              <CardTitle className="text-xl text-center">Results Visibility</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center space-x-3 py-4">
              {isLoadingVisibility ? (
                <p className="text-sm text-muted-foreground">Loading setting...</p>
              ) : (
                <>
                  <Label htmlFor="results-visibility-switch" className="flex items-center gap-2 cursor-pointer">
                    {isResultsPublic ? <Eye className="h-5 w-5 text-green-500" /> : <EyeOff className="h-5 w-5 text-red-500" />}
                    <span>{isResultsPublic ? 'Public' : 'Private'}</span>
                  </Label>
                  <Switch
                    id="results-visibility-switch"
                    checked={isResultsPublic}
                    onCheckedChange={handleResultsVisibilityToggle}
                    aria-label={`Toggle results visibility, currently ${isResultsPublic ? 'public' : 'private'}`}
                  />
                </>
              )}
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground text-center pt-3 border-t">
              <p>Controls whether non-admin users can view poll results.</p>
            </CardFooter>
          </Card>
          
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
