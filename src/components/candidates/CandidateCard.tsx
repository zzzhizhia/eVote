
'use client';

import Image from 'next/image';
import type { PollCandidate } from '@/lib/types'; 
import { CheckCircle, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CandidateCardProps {
  candidate: PollCandidate; 
  onSelect: (candidateId: string) => void;
  isSelected: boolean;
  disabled?: boolean; // Added disabled prop
}

export default function CandidateCard({ candidate, onSelect, isSelected, disabled = false }: CandidateCardProps) {
  const handleSelect = () => {
    if (!disabled) {
      onSelect(candidate.id);
    }
  };

  return (
    <div
      className={cn(
        "relative flex flex-col items-center p-4 rounded-lg border-2 border-transparent transition-all duration-200",
        isSelected && !disabled ? 'ring-2 ring-primary border-primary shadow-lg' : 'border-card hover:border-primary/50',
        disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'
      )}
      onClick={handleSelect}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => !disabled && (e.key === 'Enter' || e.key === ' ') && handleSelect()}
      aria-pressed={isSelected}
      aria-disabled={disabled}
      aria-label={disabled ? `${candidate.name} (voting closed)` : `Select ${candidate.name}`}
    >
      <div className="relative w-32 h-32 md:w-40 md:h-40 mb-3">
        <Image
          src={candidate.avatarUrl}
          alt={`Avatar of ${candidate.name}`}
          width={160}
          height={160}
          className={cn("rounded-full object-cover border-4", isSelected && !disabled ? "border-primary/70" : "border-muted" )}
          data-ai-hint={candidate.dataAiHint}
        />
        {isSelected && !disabled && (
          <div className="absolute bottom-1 right-1 bg-primary rounded-full p-1.5 text-primary-foreground shadow-md">
            <CheckCircle className="w-5 h-5" />
          </div>
        )}
        {disabled && (
           <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
             <Lock className="w-10 h-10 text-white/70" />
           </div>
        )}
      </div>
      <h2 className={cn("text-xl font-semibold text-center", disabled ? "text-muted-foreground" : "text-foreground")}>
        {candidate.name}
      </h2>
    </div>
  );
}
