'use client';

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Candidate } from '@/lib/types';
import { CheckCircle, Circle } from 'lucide-react';

interface CandidateCardProps {
  candidate: Candidate;
  onSelect: (candidateId: string) => void;
  isSelected: boolean;
}

export default function CandidateCard({ candidate, onSelect, isSelected }: CandidateCardProps) {
  return (
    <Card 
      className={`w-full max-w-sm transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl ${isSelected ? 'border-primary ring-2 ring-primary shadow-2xl' : 'border-border'}`}
      onClick={() => onSelect(candidate.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(candidate.id)}
      aria-pressed={isSelected}
      aria-label={`Select ${candidate.name}`}
    >
      <CardHeader className="items-center p-4">
        <div className="relative w-32 h-32 md:w-40 md:h-40 mb-4">
          <Image
            src={candidate.avatarUrl}
            alt={`Avatar of ${candidate.name}`}
            width={160}
            height={160}
            className="rounded-full object-cover border-4 border-muted"
            data-ai-hint={candidate.dataAiHint}
          />
          {isSelected && (
            <div className="absolute bottom-0 right-0 bg-primary rounded-full p-1.5 text-primary-foreground">
              <CheckCircle className="w-5 h-5" />
            </div>
          )}
        </div>
        <CardTitle className="text-2xl font-semibold text-center">{candidate.name}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 text-center">
        <CardDescription className="text-sm h-20 overflow-hidden text-ellipsis">
          {candidate.description}
        </CardDescription>
      </CardContent>
      <CardFooter className="flex justify-center p-4">
        <Button 
          variant={isSelected ? 'default' : 'outline'} 
          className="w-full shadow-md"
          aria-label={isSelected ? `Deselect ${candidate.name}` : `Select ${candidate.name}`}
        >
          {isSelected ? (
            <>
              <CheckCircle className="mr-2 h-5 w-5" /> Selected
            </>
          ) : (
            <>
              <Circle className="mr-2 h-5 w-5" /> Select
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
