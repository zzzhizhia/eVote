// This is an auto-generated file from Firebase Studio.

'use server';

/**
 * @fileOverview Generates headshots for candidates using Genkit and Gemini 2.0 Flash.
 *
 * - generateCandidateHeadshot - A function that generates a candidate headshot.
 * - GenerateCandidateHeadshotInput - The input type for the generateCandidateHeadshot function.
 * - GenerateCandidateHeadshotOutput - The return type for the generateCandidateHeadshot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCandidateHeadshotInputSchema = z.object({
  candidateDescription: z
    .string()
    .describe('A description of the candidate for whom to generate a headshot.'),
});
export type GenerateCandidateHeadshotInput = z.infer<
  typeof GenerateCandidateHeadshotInputSchema
>;

const GenerateCandidateHeadshotOutputSchema = z.object({
  headshotDataUri: z
    .string()
    .describe(
      'A data URI containing the generated headshot image, including MIME type and Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
});
export type GenerateCandidateHeadshotOutput = z.infer<
  typeof GenerateCandidateHeadshotOutputSchema
>;

export async function generateCandidateHeadshot(
  input: GenerateCandidateHeadshotInput
): Promise<GenerateCandidateHeadshotOutput> {
  return generateCandidateHeadshotFlow(input);
}

const generateHeadshotPrompt = ai.definePrompt({
  name: 'generateHeadshotPrompt',
  input: {schema: GenerateCandidateHeadshotInputSchema},
  output: {schema: GenerateCandidateHeadshotOutputSchema},
  prompt: `Generate a professional headshot for a candidate with the following description: {{{candidateDescription}}}. The image should be suitable for display on an election voting website. Return the image as a data URI.`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const generateCandidateHeadshotFlow = ai.defineFlow(
  {
    name: 'generateCandidateHeadshotFlow',
    inputSchema: GenerateCandidateHeadshotInputSchema,
    outputSchema: GenerateCandidateHeadshotOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      prompt: [
        {
          text: `Generate a professional headshot for a candidate with the following description: ${input.candidateDescription}. The image should be suitable for display on an election voting website.`,
        },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    return {headshotDataUri: media.url!};
  }
);
