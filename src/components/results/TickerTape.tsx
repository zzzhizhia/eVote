
'use client';

import Image from 'next/image';
import type { PollCandidate } from '@/lib/types'; // Changed from Candidate to PollCandidate

interface TickerTapeProps {
  candidates: PollCandidate[]; // Changed from Candidate to PollCandidate
}

export default function TickerTape({ candidates }: TickerTapeProps) {
  if (!candidates || candidates.length === 0) {
    return null;
  }

  // Duplicate candidates for a smoother infinite scroll effect if count is low
  const displayCandidates = candidates.length < 10 ? [...candidates, ...candidates, ...candidates] : candidates;

  return (
    <div className="w-full overflow-hidden bg-card p-4 rounded-lg shadow-md">
      <div className="ticker-tape-container whitespace-nowrap">
        <div className="ticker-tape-content flex animate-marquee motion-safe:animate-marquee hover:pause">
          {displayCandidates.map((candidate, index) => (
            <div key={`${candidate.id}-${index}`} className="inline-flex flex-col items-center mx-3 w-24">
              <Image
                src={candidate.avatarUrl}
                alt={candidate.name}
                width={64}
                height={64}
                style={{ borderRadius: '9999px' }}
                className="rounded-full object-cover border-2 border-primary"
                data-ai-hint={candidate.dataAiHint}
              />
              <span className="mt-1 text-xs text-muted-foreground truncate w-full text-center">{candidate.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
