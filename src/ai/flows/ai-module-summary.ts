'use server';
/**
 * @fileOverview Genkit flow for summarizing learning module sections cleanly and quickly.
 * Uses direct ai.generate to avoid Next.js HMR registry overwrite warnings.
 */

import { z } from 'zod';
import { ai } from '@/ai/genkit';

const SummarizeModuleSectionInputSchema = z.object({
  sectionContent: z.string().describe('The full text content of a learning module section.'),
});
export type SummarizeModuleSectionInput = z.infer<typeof SummarizeModuleSectionInputSchema>;

const SummarizeModuleSectionOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the learning module section.'),
});
export type SummarizeModuleSectionOutput = z.infer<typeof SummarizeModuleSectionOutputSchema>;

// Server-side cache Map to store generated summaries per section content
const summaryCache = new Map<string, SummarizeModuleSectionOutput>();

export async function summarizeModuleSection(
  input: SummarizeModuleSectionInput
): Promise<SummarizeModuleSectionOutput> {
  const cacheKey = input.sectionContent.trim();
  
  // Return cached result instantly if already generated
  if (summaryCache.has(cacheKey)) {
    return summaryCache.get(cacheKey)!;
  }

  try {
    const { output } = await ai.generate({
      prompt: `Eres un asistente de IA pedagógico. Tu objetivo es resumir la sección del módulo de aprendizaje de forma concisa y clara en español (máximo 2 a 3 frases clave).

Sección a resumir:
${input.sectionContent}`,
      output: { schema: SummarizeModuleSectionOutputSchema },
    });

    if (output?.summary) {
      summaryCache.set(cacheKey, output);
      return output;
    }
  } catch (error: any) {
    console.warn('AI summarize fallback triggered:', error?.message);
  }

  // Fast fallback summary if AI call fails or times out
  const sentences = input.sectionContent
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.trim().length > 10);
  const fallbackSummary = sentences.slice(0, 2).join(' ') || input.sectionContent.substring(0, 180) + '...';

  const result = { summary: fallbackSummary };
  summaryCache.set(cacheKey, result);
  return result;
}
