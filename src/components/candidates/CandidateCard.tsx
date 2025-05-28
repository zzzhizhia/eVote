
'use client';

import Image from 'next/image';
import type { Candidate } from '@/lib/types';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CandidateCardProps {
  candidate: Candidate;
  onSelect: (candidateId: string) => void;
  isSelected: boolean;
}

export default function CandidateCard({ candidate, onSelect, isSelected }: CandidateCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center p-4 cursor-pointer rounded-lg",
        isSelected ? 'ring-2 ring-primary' : ''
      )}
      onClick={() => onSelect(candidate.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(candidate.id)}
      aria-pressed={isSelected}
      aria-label={`Select ${candidate.name}`}
    >
      <div className="relative w-32 h-32 md:w-40 md:h-40 mb-3">
        <Image
          src={candidate.avatarUrl}
          alt={`Avatar of ${candidate.name}`}
          width={160}
          height={160}
          className="rounded-full object-cover border-4 border-muted"
          data-ai-hint={candidate.dataAiHint}
        />
        {isSelected && (
          <div className="absolute bottom-1 right-1 bg-primary rounded-full p-1.5 text-primary-foreground">
            <CheckCircle className="w-5 h-5" />
          </div>
        )}
      </div>
      <h2 className="text-xl font-semibold text-center text-foreground">{candidate.name}</h2>
    </div>
  );
}
