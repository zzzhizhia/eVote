'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CandidateCard from '@/components/candidates/CandidateCard';
import { Button } from '@/components/ui/button';
import { MOCK_CANDIDATES } from '@/lib/mockdata';
import type { Candidate } from '@/lib/types';
import { Send } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";


export default function VotePage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Simulate fetching candidates
    setCandidates(MOCK_CANDIDATES);
    setIsLoading(false);
  }, []);

  const handleSelectCandidate = (candidateId: string) => {
    setSelectedCandidateId(prevId => (prevId === candidateId ? null : candidateId));
  };

  const handleSubmitVote = () => {
    if (!selectedCandidateId) {
      toast({
        title: "No Candidate Selected",
        description: "Please select a candidate before submitting your vote.",
        variant: "destructive",
      });
      return;
    }
    
    // Store the vote in localStorage. In a real app, this would be an API call.
    localStorage.setItem('eVote_selectedCandidateId', selectedCandidateId);
    
    // Store/update overall votes (mocked)
    const currentVotes = JSON.parse(localStorage.getItem('eVote_allVotes') || '{}');
    currentVotes[selectedCandidateId] = (currentVotes[selectedCandidateId] || 0) + 1;
    localStorage.setItem('eVote_allVotes', JSON.stringify(currentVotes));

    toast({
      title: "Vote Submitted!",
      description: `Your vote for ${candidates.find(c => c.id === selectedCandidateId)?.name} has been recorded.`,
    });
    router.push('/results');
  };

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <p className="text-lg text-muted-foreground">Loading candidates...</p>
        {/* Add Skeleton loaders here for better UX */}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-10">
      <h1 className="text-4xl font-bold tracking-tight text-center text-primary">
        Who to elect as President?
      </h1>
      <p className="text-lg text-muted-foreground text-center max-w-2xl">
        Review the candidates below and make your selection. Click on a candidate's card to select them, then submit your vote.
      </p>
      
      {candidates.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 w-full">
          {candidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              onSelect={handleSelectCandidate}
              isSelected={selectedCandidateId === candidate.id}
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No candidates available at this time.</p>
      )}

      {candidates.length > 0 && (
        <Button 
          size="lg" 
          onClick={handleSubmitVote} 
          disabled={!selectedCandidateId}
          className="mt-8 shadow-lg hover:shadow-xl transition-shadow min-w-[200px]"
        >
          <Send className="mr-2 h-5 w-5" />
          Submit Your Vote
        </Button>
      )}
    </div>
  );
}
