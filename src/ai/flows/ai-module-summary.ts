'use server';
/**
 * @fileOverview This file implements a Genkit flow for summarizing learning module sections.
 *
 * - summarizeModuleSection - A function that handles the module section summarization process.
 * - SummarizeModuleSectionInput - The input type for the summarizeModuleSection function.
 * - SummarizeModuleSectionOutput - The return type for the summarizeModuleSection function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeModuleSectionInputSchema = z.object({
  sectionContent: z.string().describe('The full text content of a learning module section.'),
});
export type SummarizeModuleSectionInput = z.infer<typeof SummarizeModuleSectionInputSchema>;

const SummarizeModuleSectionOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the learning module section.'),
});
export type SummarizeModuleSectionOutput = z.infer<typeof SummarizeModuleSectionOutputSchema>;

export async function summarizeModuleSection(
  input: SummarizeModuleSectionInput
): Promise<SummarizeModuleSectionOutput> {
  return summarizeModuleSectionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeModuleSectionPrompt',
  input: {schema: SummarizeModuleSectionInputSchema},
  output: {schema: SummarizeModuleSectionOutputSchema},
  prompt: `You are an AI assistant designed to provide concise summaries of learning module sections. Your goal is to extract the key information and present it in a way that reinforces understanding without unnecessary detail.

Please summarize the following learning module section:

Section Content:
{{{sectionContent}}}`,
});

const summarizeModuleSectionFlow = ai.defineFlow(
  {
    name: 'summarizeModuleSectionFlow',
    inputSchema: SummarizeModuleSectionInputSchema,
    outputSchema: SummarizeModuleSectionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
