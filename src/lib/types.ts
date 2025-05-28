export interface Candidate {
  id: string;
  name: string;
  description: string; 
  avatarUrl: string;
  dataAiHint: string;
}

// For simplicity, votes will be stored in localStorage or a simple client-side store.
// Example structure for storing vote counts:
// export interface ElectionResults {
//   [candidateId: string]: number;
// }

export interface PollCandidate {
  id: string;
  name: string;
  avatarUrl: string; 
  dataAiHint: string;
  // description?: string; // Can be added later if needed for more detail
}

export interface Poll {
  id: string;
  title: string;
  candidates: PollCandidate[];
  votes: { [candidateId: string]: number }; // Stores vote counts for this poll
}
