
'use client';

import Image from 'next/image';
import type { PollCandidate } from '@/lib/types'; 
import { CheckCircle, Lock, Square, CheckSquare as CheckSquareIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface CandidateCardProps {
  candidate: PollCandidate; 
  onSelect: (candidateId: string) => void;
  isSelected: boolean;
  disabled?: boolean; 
  isMultiSelectPoll?: boolean;
}

export default function CandidateCard({ candidate, onSelect, isSelected, disabled = false, isMultiSelectPoll = false }: CandidateCardProps) {
  const { t } = useLanguage();
  
  const handleSelect = () => {
    if (!disabled) {
      onSelect(candidate.id);
    }
  };

  const SelectionIndicatorIcon = isMultiSelectPoll ? (isSelected ? CheckSquareIcon : Square) : CheckCircle;

  const ariaLabel = disabled 
    ? t('candidateCard.disabledAriaLabel', { candidateName: candidate.name })
    : t('candidateCard.selectCandidateAriaLabel', { candidateName: candidate.name });

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
      aria-label={ariaLabel}
    >
      <div className="relative w-[160px] h-[160px] mb-3" style={{ width: '160px', height: '160px' }}>
        <Image
          src={candidate.avatarUrl}
          alt={t('candidateCard.selectCandidateAriaLabel', { candidateName: candidate.name })} // Alt text can also be translated
          width={160}
          height={160}
          className={cn("rounded-full object-cover border-4", isSelected && !disabled ? "border-primary/70" : "border-muted" )}
          data-ai-hint={candidate.dataAiHint}
          style={{ width: '160px', height: '160px', objectFit: 'cover', borderRadius: '9999px' }}
        />
        {isSelected && !disabled && (
          <div className="absolute bottom-1 right-1 bg-primary rounded-full p-1.5 text-primary-foreground shadow-md">
            <SelectionIndicatorIcon className="w-5 h-5" />
          </div>
        )}
         {isMultiSelectPoll && !isSelected && !disabled && ( 
          <div className="absolute bottom-1 right-1 bg-muted rounded-full p-1.5 text-muted-foreground border shadow-sm">
            <Square className="w-5 h-5" />
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

    