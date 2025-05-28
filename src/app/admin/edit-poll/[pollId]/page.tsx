
'use client';

import { useState, useEffect, type FormEvent, useRef, type ChangeEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Trash2, Edit3, AlertTriangle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { Poll, PollCandidate } from '@/lib/types';
import Image from 'next/image';

const POLLS_STORAGE_KEY = 'eVote_polls_list';

export default function EditPollPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const pollId = params.pollId as string;

  const [originalPoll, setOriginalPoll] = useState<Poll | null>(null);
  const [pollTitle, setPollTitle] = useState('');
  const [currentCandidateName, setCurrentCandidateName] = useState('');
  const [currentCandidateAvatarFile, setCurrentCandidateAvatarFile] = useState<File | null>(null);
  const [currentCandidateAvatarPreview, setCurrentCandidateAvatarPreview] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<PollCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingPoll, setIsFetchingPoll] = useState(true);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAdminAuthenticated') === 'true';
    if (!isAuthenticated) {
      router.push('/admin');
      return;
    }

    if (pollId) {
      setIsFetchingPoll(true);
      try {
        const existingPollsRaw = localStorage.getItem(POLLS_STORAGE_KEY);
        const existingPolls: Poll[] = existingPollsRaw ? JSON.parse(existingPollsRaw) : [];
        const pollToEdit = existingPolls.find(p => p.id === pollId);

        if (pollToEdit) {
          setOriginalPoll(pollToEdit);
          setPollTitle(pollToEdit.title);
          setCandidates(pollToEdit.candidates.map(c => ({...c}))); // Create copies to avoid direct state mutation
        } else {
          toast({
            title: "Poll Not Found",
            description: `Could not find a poll with ID: ${pollId}. Redirecting...`,
            variant: "destructive",
          });
          router.push('/admin/dashboard');
        }
      } catch (error) {
        console.error("Failed to load poll for editing:", error);
        toast({
          title: "Error Loading Poll",
          description: "An unexpected error occurred while loading the poll.",
          variant: "destructive",
        });
        router.push('/admin/dashboard');
      } finally {
        setIsFetchingPoll(false);
      }
    } else {
      // Should not happen if routing is correct, but handle defensively
      toast({
        title: "Invalid Poll ID",
        description: "No poll ID provided. Redirecting...",
        variant: "destructive",
      });
      router.push('/admin/dashboard');
    }
  }, [pollId, router, toast]);

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCurrentCandidateAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentCandidateAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setCurrentCandidateAvatarFile(null);
      setCurrentCandidateAvatarPreview(null);
    }
  };

  const handleAddCandidate = async () => {
    if (!currentCandidateName.trim()) {
      toast({
        title: "Candidate Name Empty",
        description: "Please enter a name for the candidate.",
        variant: "destructive",
      });
      return;
    }

    let avatarUrl = 'https://placehold.co/150x150.png';
    let dataAiHint = 'person placeholder';

    if (currentCandidateAvatarFile) {
      try {
        avatarUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(currentCandidateAvatarFile);
        });
        dataAiHint = 'uploaded avatar';
      } catch (error) {
        console.error("Error reading avatar file:", error);
        toast({
          title: "Avatar Upload Error",
          description: "Could not process the avatar image. Using default.",
          variant: "destructive",
        });
      }
    }

    const newCandidate: PollCandidate = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9), // New ID for new candidate
      name: currentCandidateName.trim(),
      avatarUrl,
      dataAiHint,
    };
    setCandidates(prev => [...prev, newCandidate]);
    setCurrentCandidateName('');
    setCurrentCandidateAvatarFile(null);
    setCurrentCandidateAvatarPreview(null);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };

  const handleRemoveCandidate = (candidateId: string) => {
    setCandidates(prev => prev.filter(c => c.id !== candidateId));
    // Note: Votes for this candidate in this poll will be orphaned if not handled explicitly on save.
    // For simplicity, we'll assume votes might need recounting or are lost for removed candidates.
    // A more robust solution would handle vote data more carefully.
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
    if (!originalPoll) {
         toast({
            title: "Error Saving Poll",
            description: "Original poll data not found. Cannot update.",
            variant: "destructive",
          });
        return;
    }

    setIsLoading(true);

    const updatedPoll: Poll = {
      ...originalPoll, // Preserve original ID and potentially other properties like votes
      title: pollTitle.trim(),
      candidates,
      // Preserve original votes, but reconcile if candidates were removed/changed
      // For simplicity, we are keeping existing votes. If a candidate was removed, their votes remain but won't be displayed.
      // If a candidate ID changed (e.g., by removing and re-adding), their old votes are lost.
      // A more complex system would map old votes to new candidate IDs or handle this scenario explicitly.
      votes: originalPoll.votes || {}, // Retain existing votes
    };

    // Special handling for votes if candidates were removed:
    // Create a set of current candidate IDs
    const currentCandidateIds = new Set(candidates.map(c => c.id));
    // Filter out votes for candidates that no longer exist in the updated list
    const reconciledVotes: { [candidateId: string]: number } = {};
    for (const candidateId in updatedPoll.votes) {
      if (currentCandidateIds.has(candidateId)) {
        reconciledVotes[candidateId] = updatedPoll.votes[candidateId];
      }
    }
    updatedPoll.votes = reconciledVotes;


    try {
      const existingPollsRaw = localStorage.getItem(POLLS_STORAGE_KEY);
      let existingPolls: Poll[] = existingPollsRaw ? JSON.parse(existingPollsRaw) : [];
      const pollIndex = existingPolls.findIndex(p => p.id === pollId);

      if (pollIndex !== -1) {
        existingPolls[pollIndex] = updatedPoll;
        localStorage.setItem(POLLS_STORAGE_KEY, JSON.stringify(existingPolls));
        toast({
          title: "Poll Updated!",
          description: `The poll "${updatedPoll.title}" has been successfully updated.`,
        });
        router.push('/admin/dashboard');
      } else {
         toast({
            title: "Error Saving Poll",
            description: "Could not find the poll to update in storage.",
            variant: "destructive",
          });
      }
    } catch (error) {
      console.error("Failed to save updated poll:", error);
      toast({
        title: "Error Saving Poll",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingPoll) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] py-10">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <Edit3 className="h-12 w-12 text-primary mx-auto mb-3 animate-pulse" />
            <CardTitle className="text-2xl">Loading Poll Data...</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please wait while we fetch the poll details for editing.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!originalPoll && !isFetchingPoll) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] py-10">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-3" />
            <CardTitle className="text-2xl">Poll Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The poll you are trying to edit could not be found. It might have been deleted.</p>
            <Button onClick={() => router.push('/admin/dashboard')} className="mt-4">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-10">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="items-center text-center">
          <Edit3 className="h-12 w-12 text-primary mb-3" />
          <CardTitle className="text-3xl font-bold">Edit Poll</CardTitle>
          <CardDescription className="text-lg">Modify the title and candidates for this poll.</CardDescription>
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
              <Label className="text-base font-medium">Candidates</Label>
              {candidates.length > 0 && (
                <div className="space-y-3 max-h-60 overflow-y-auto p-2 rounded-md border">
                  {candidates.map((candidate) => (
                    <div key={candidate.id} className="flex items-center justify-between p-2.5 bg-muted/50 rounded-md shadow-sm">
                      <div className="flex items-center gap-3">
                        <Image src={candidate.avatarUrl} alt={candidate.name} width={40} height={40} className="rounded-full object-cover" data-ai-hint={candidate.dataAiHint || 'candidate avatar'} />
                        <span className="text-sm font-medium">{candidate.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveCandidate(candidate.id)}
                        aria-label={`Remove ${candidate.name}`}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="p-4 border rounded-lg space-y-3 shadow-sm bg-card">
                 <Label htmlFor="candidateName" className="text-sm font-medium">Add New Candidate</Label>
                <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                  <div className="flex-grow space-y-1">
                    <Label htmlFor="candidateNameInput" className="text-xs text-muted-foreground">Name</Label>
                    <Input
                      id="candidateNameInput"
                      type="text"
                      value={currentCandidateName}
                      onChange={(e) => setCurrentCandidateName(e.target.value)}
                      placeholder="Enter candidate name"
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                     <Label htmlFor="candidateAvatar" className="text-xs text-muted-foreground">Avatar (Optional)</Label>
                    <Input
                      id="candidateAvatar"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      ref={avatarInputRef}
                      className="text-sm file:mr-2 file:py-1.5 file:px-2 file:rounded-full file:border-0 file:text-xs file:bg-muted file:text-muted-foreground hover:file:bg-primary/10"
                    />
                  </div>
                  {currentCandidateAvatarPreview && (
                    <Image src={currentCandidateAvatarPreview} alt="Avatar preview" width={40} height={40} className="rounded-full object-cover self-center sm:self-end" data-ai-hint="avatar preview" />
                  )}
                </div>
                 <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddCandidate}
                    className="w-full sm:w-auto shadow-sm"
                    disabled={!currentCandidateName.trim()}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Candidate to Poll
                  </Button>
              </div>
               {candidates.length === 0 && <p className="text-sm text-muted-foreground text-center pt-2">Add at least two candidates for the poll.</p>}
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" size="lg" className="w-full shadow-lg" disabled={isLoading || isFetchingPoll || candidates.length < 2}>
              {isLoading ? 'Updating Poll...' : 'Update Poll'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
