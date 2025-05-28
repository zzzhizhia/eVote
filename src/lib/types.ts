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
