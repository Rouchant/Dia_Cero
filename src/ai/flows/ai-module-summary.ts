'use server';
/**
 * @fileOverview Genkit flow for summarizing learning module sections cleanly and quickly.
 * Reads from Supabase DB first; generates with AI if empty and updates DB automatically.
 */

import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { createClient } from '@supabase/supabase-js';

const SummarizeModuleSectionInputSchema = z.object({
  sectionId: z.string().optional(),
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
  const { sectionId, sectionContent } = input;

  // 1. Query Supabase DB first if sectionId is available
  if (sectionId) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createClient(supabaseUrl, serviceKey);

      const { data: sec } = await supabase
        .from('module_sections')
        .select('ai_summary')
        .eq('id', sectionId)
        .maybeSingle();

      if (sec?.ai_summary && sec.ai_summary.trim().length > 0) {
        return { summary: sec.ai_summary };
      }
    } catch (dbErr) {
      console.warn('DB summary check warning:', dbErr);
    }
  }

  // 2. Generate with Genkit AI if empty in DB
  let generatedSummary = '';
  try {
    const { output } = await ai.generate({
      prompt: `Eres un asistente de IA pedagógico. Tu objetivo es resumir la sección del módulo de aprendizaje de forma concisa y clara en español (máximo 2 a 3 frases clave).

Sección a resumir:
${sectionContent}`,
      output: { schema: SummarizeModuleSectionOutputSchema },
    });

    if (output?.summary) {
      generatedSummary = output.summary;
    }
  } catch (error: any) {
    console.warn('AI summarize fallback triggered:', error?.message);
  }

  if (!generatedSummary) {
    const sentences = sectionContent
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.trim().length > 10);
    generatedSummary = sentences.slice(0, 2).join(' ') || sectionContent.substring(0, 180) + '...';
  }

  const result = { summary: generatedSummary };

  // 3. Save back to Supabase DB for instant future access across all users
  if (sectionId && generatedSummary) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createClient(supabaseUrl, serviceKey);

      await supabase
        .from('module_sections')
        .update({ ai_summary: generatedSummary })
        .eq('id', sectionId);
    } catch (saveErr) {
      console.warn('DB summary update error:', saveErr);
    }
  }

  return result;
}
