'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Trash2, ListPlus } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { Poll, PollCandidate } from '@/lib/types';
import Image from 'next/image';

const POLLS_STORAGE_KEY = 'eVote_polls_list';

export default function CreatePollPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [pollTitle, setPollTitle] = useState('');
  const [currentCandidateName, setCurrentCandidateName] = useState('');
  const [candidates, setCandidates] = useState<PollCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAdminAuthenticated') === 'true';
    if (!isAuthenticated) {
      router.push('/admin');
    }
  }, [router]);

  const handleAddCandidate = () => {
    if (!currentCandidateName.trim()) {
      toast({
        title: "Candidate Name Empty",
        description: "Please enter a name for the candidate.",
        variant: "destructive",
      });
      return;
    }
    const newCandidate: PollCandidate = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      name: currentCandidateName.trim(),
      avatarUrl: 'https://placehold.co/150x150.png', // Default placeholder
      dataAiHint: 'person', // Generic hint
    };
    setCandidates(prev => [...prev, newCandidate]);
    setCurrentCandidateName('');
  };

  const handleRemoveCandidate = (candidateId: string) => {
    setCandidates(prev => prev.filter(c => c.id !== candidateId));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pollTitle.trim()) {
      toast({
        title: "Poll Title Empty",
        description: "Please enter a title for the poll.",
        variant: "destructive",
      });
      return;
    }
    if (candidates.length < 2) {
      toast({
        title: "Not Enough Candidates",
        description: "A poll must have at least two candidates.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const newPoll: Poll = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      title: pollTitle.trim(),
      candidates,
    };

    try {
      const existingPollsRaw = localStorage.getItem(POLLS_STORAGE_KEY);
      const existingPolls: Poll[] = existingPollsRaw ? JSON.parse(existingPollsRaw) : [];
      localStorage.setItem(POLLS_STORAGE_KEY, JSON.stringify([...existingPolls, newPoll]));

      toast({
        title: "Poll Created!",
        description: `The poll "${newPoll.title}" has been saved.`,
      });
      setPollTitle('');
      setCandidates([]);
      // Optionally, redirect: router.push('/admin/dashboard');
    } catch (error) {
      console.error("Failed to save poll:", error);
      toast({
        title: "Error Saving Poll",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center py-10">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="items-center text-center">
          <ListPlus className="h-12 w-12 text-primary mb-3" />
          <CardTitle className="text-3xl font-bold">Create New Poll</CardTitle>
          <CardDescription className="text-lg">Define the title and candidates for your new poll.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-2">
              <Label htmlFor="pollTitle" className="text-base">Poll Title</Label>
              <Input
                id="pollTitle"
                type="text"
                value={pollTitle}
                onChange={(e) => setPollTitle(e.target.value)}
                placeholder="e.g., Favorite Programming Language"
                className="text-base"
                required
              />
            </div>

            <div className="space-y-4">
              <Label className="text-base">Candidates</Label>
              {candidates.length > 0 && (
                <div className="space-y-3 max-h-60 overflow-y-auto p-1 rounded-md border">
                  {candidates.map((candidate) => (
                    <div key={candidate.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                      <div className="flex items-center gap-2">
                        <Image src={candidate.avatarUrl} alt={candidate.name} width={32} height={32} className="rounded-full" data-ai-hint={candidate.dataAiHint} />
                        <span className="text-sm">{candidate.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveCandidate(candidate.id)}
                        aria-label={`Remove ${candidate.name}`}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-2">
                <div className="flex-grow space-y-1">
                  <Label htmlFor="candidateName" className="text-sm sr-only">Candidate Name</Label>
                  <Input
                    id="candidateName"
                    type="text"
                    value={currentCandidateName}
                    onChange={(e) => setCurrentCandidateName(e.target.value)}
                    placeholder="Enter candidate name"
                    className="text-sm"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddCandidate}
                  className="shadow-sm"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Candidate
                </Button>
              </div>
               {candidates.length === 0 && <p className="text-sm text-muted-foreground text-center pt-2">Add at least two candidates for the poll.</p>}
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" size="lg" className="w-full shadow-lg" disabled={isLoading || candidates.length < 2}>
              {isLoading ? 'Saving Poll...' : 'Save Poll'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
