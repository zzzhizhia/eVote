
'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PlusCircle, Settings, Eye, EyeOff, AlertTriangle, Save, PencilLine, ListChecks, Edit3, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import type { Poll } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


const RESULTS_VISIBILITY_KEY = 'eVote_isResultsPublic';
const HOME_PAGE_INTRO_TEXT_KEY = 'eVote_homePageIntroText';
const VOTE_PAGE_INTRO_TEXT_KEY = 'eVote_votePageIntroText';
const POLLS_STORAGE_KEY = 'eVote_polls_list';

const DEFAULT_HOME_INTRO = "We are pleased to announce that the next presidential election will be held soon. This is your opportunity to choose the leader who will best represent your interests. Prepare to learn about the candidates and make an informed decision.";
const DEFAULT_VOTE_INTRO = "Review the candidates below and make your selection. Click on a candidate's card to select them, then submit your vote.";


export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isResultsPublic, setIsResultsPublic] = useState(false);
  const [isLoadingVisibility, setIsLoadingVisibility] = useState(true);

  const [homeIntroText, setHomeIntroText] = useState('');
  const [voteIntroText, setVoteIntroText] = useState('');
  const [isLoadingHomeIntro, setIsLoadingHomeIntro] = useState(true);
  const [isLoadingVoteIntro, setIsLoadingVoteIntro] = useState(true);

  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoadingPolls, setIsLoadingPolls] = useState(true);

  useEffect(() => {
    const authStatus = localStorage.getItem('isAdminAuthenticated') === 'true';
    setIsAdminAuthenticated(authStatus);
    if (!authStatus) {
      router.push('/admin');
    }

    // Load results visibility
    try {
      const storedVisibility = localStorage.getItem(RESULTS_VISIBILITY_KEY);
      if (storedVisibility !== null) {
        setIsResultsPublic(JSON.parse(storedVisibility));
      } else {
        setIsResultsPublic(false);
        localStorage.setItem(RESULTS_VISIBILITY_KEY, JSON.stringify(false));
      }
    } catch (error) {
      console.error("Error reading results visibility from localStorage:", error);
      setIsResultsPublic(false);
       toast({
        title: "Error Loading Settings",
        description: "Could not load results visibility setting. Defaulting to private.",
        variant: "destructive",
      });
    }
    setIsLoadingVisibility(false);

    // Load Home page intro text
    try {
      const storedHomeIntro = localStorage.getItem(HOME_PAGE_INTRO_TEXT_KEY);
      setHomeIntroText(storedHomeIntro || '');
    } catch (error) {
      console.error("Error reading home intro text from localStorage:", error);
      setHomeIntroText('');
      toast({
        title: "Error Loading Home Intro",
        description: "Could not load home page introductory text.",
        variant: "destructive",
      });
    }
    setIsLoadingHomeIntro(false);

    // Load Vote page intro text
    try {
      const storedVoteIntro = localStorage.getItem(VOTE_PAGE_INTRO_TEXT_KEY);
      setVoteIntroText(storedVoteIntro || '');
    } catch (error) {
      console.error("Error reading vote intro text from localStorage:", error);
      setVoteIntroText('');
      toast({
        title: "Error Loading Vote Intro",
        description: "Could not load vote page introductory text.",
        variant: "destructive",
      });
    }
    setIsLoadingVoteIntro(false);

    // Load polls
    loadPollsFromStorage();

  }, [router, toast]);

  const loadPollsFromStorage = () => {
    setIsLoadingPolls(true);
    try {
      const storedPollsRaw = localStorage.getItem(POLLS_STORAGE_KEY);
      const existingPolls: Poll[] = storedPollsRaw ? JSON.parse(storedPollsRaw) : [];
      setPolls(existingPolls);
    } catch (error) {
      console.error("Error reading polls from localStorage:", error);
      setPolls([]);
      toast({
        title: "Error Loading Polls",
        description: "Could not load existing polls.",
        variant: "destructive",
      });
    }
    setIsLoadingPolls(false);
  };

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

  const handleSaveHomeIntro = () => {
    try {
      localStorage.setItem(HOME_PAGE_INTRO_TEXT_KEY, homeIntroText);
      toast({
        title: "Home Page Intro Saved",
        description: "The introductory text for the home page has been updated.",
      });
    } catch (error) {
      console.error("Error saving home intro text to localStorage:", error);
      toast({
        title: "Error Saving Home Intro",
        description: "Could not save home page introductory text.",
        variant: "destructive",
      });
    }
  };

  const handleSaveVoteIntro = () => {
    try {
      localStorage.setItem(VOTE_PAGE_INTRO_TEXT_KEY, voteIntroText);
      toast({
        title: "Vote Page Intro Saved",
        description: "The introductory text for the vote page has been updated.",
      });
    } catch (error) {
      console.error("Error saving vote intro text to localStorage:", error);
      toast({
        title: "Error Saving Vote Intro",
        description: "Could not save vote page introductory text.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePoll = (pollId: string) => {
    try {
      const updatedPolls = polls.filter(p => p.id !== pollId);
      localStorage.setItem(POLLS_STORAGE_KEY, JSON.stringify(updatedPolls));
      setPolls(updatedPolls);
      toast({
        title: "Poll Deleted",
        description: "The poll has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting poll:", error);
      toast({
        title: "Error Deleting Poll",
        description: "Could not delete the poll.",
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

          {/* Manage Polls Section */}
          <Card className="w-full max-w-md shadow-md">
            <CardHeader>
              <CardTitle className="text-xl text-center flex items-center justify-center gap-2">
                <ListChecks className="h-5 w-5" /> Manage Polls
              </CardTitle>
            </CardHeader>
            <CardContent className="py-4 space-y-3">
              {isLoadingPolls ? (
                <p className="text-sm text-muted-foreground text-center">Loading polls...</p>
              ) : polls.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">No polls created yet.</p>
              ) : (
                <ul className="space-y-2">
                  {polls.map((poll) => (
                    <li key={poll.id} className="flex items-center justify-between p-2.5 bg-muted/50 rounded-md shadow-sm">
                      <span className="text-sm font-medium truncate pr-2" title={poll.title}>{poll.title}</span>
                      <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm" className="h-8">
                          <Link href={`/admin/edit-poll/${poll.id}`} className="flex items-center">
                            <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Edit
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="h-8">
                              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the poll
                                "{poll.title}" and all its associated data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeletePoll(poll.id)}>
                                Delete Poll
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
             <CardFooter className="text-xs text-muted-foreground text-center pt-3 border-t">
              <p>Edit or delete existing polls.</p>
            </CardFooter>
          </Card>


          <Card className="w-full max-w-md shadow-md">
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

          {/* Edit Home Page Intro */}
          <Card className="w-full max-w-md shadow-md">
            <CardHeader>
              <CardTitle className="text-xl text-center flex items-center justify-center gap-2">
                <PencilLine className="h-5 w-5" /> Edit Home Page Introduction
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 py-4">
              <Label htmlFor="homeIntroText">Introductory Text</Label>
              {isLoadingHomeIntro ? (
                 <p className="text-sm text-muted-foreground">Loading text...</p>
              ) : (
                <Textarea
                  id="homeIntroText"
                  value={homeIntroText}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setHomeIntroText(e.target.value)}
                  placeholder={DEFAULT_HOME_INTRO}
                  rows={5}
                  className="text-sm"
                />
              )}
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button onClick={handleSaveHomeIntro} className="w-full" disabled={isLoadingHomeIntro}>
                <Save className="mr-2 h-4 w-4" /> Save Home Intro
              </Button>
            </CardFooter>
          </Card>

          {/* Edit Vote Page Intro */}
          <Card className="w-full max-w-md shadow-md">
            <CardHeader>
              <CardTitle className="text-xl text-center flex items-center justify-center gap-2">
                <PencilLine className="h-5 w-5" /> Edit Vote Page Introduction
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 py-4">
              <Label htmlFor="voteIntroText">Introductory Text</Label>
              {isLoadingVoteIntro ? (
                <p className="text-sm text-muted-foreground">Loading text...</p>
              ): (
                <Textarea
                  id="voteIntroText"
                  value={voteIntroText}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setVoteIntroText(e.target.value)}
                  placeholder={DEFAULT_VOTE_INTRO}
                  rows={4}
                  className="text-sm"
                />
              )}
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button onClick={handleSaveVoteIntro} className="w-full" disabled={isLoadingVoteIntro}>
                <Save className="mr-2 h-4 w-4" /> Save Vote Intro
              </Button>
            </CardFooter>
          </Card>
          
        </CardContent>
      </Card>
    </div>
  );
}
