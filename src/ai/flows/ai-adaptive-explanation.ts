'use server';
/**
 * @fileOverview Provides AI-generated adaptive explanations for learning module concepts.
 * Reads from Supabase DB first; generates with AI if empty and updates DB automatically.
 */

import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { createClient } from '@supabase/supabase-js';

const AiAdaptiveExplanationInputSchema = z.object({
  sectionId: z.string().optional(),
  concept: z.string().describe('The specific concept the learner is struggling with.'),
  context: z.string().optional().describe('Optional context from the learning module.'),
});
export type AiAdaptiveExplanationInput = z.infer<typeof AiAdaptiveExplanationInputSchema>;

const AiAdaptiveExplanationOutputSchema = z.object({
  explanation: z.string().describe('The AI-generated adaptive explanation for the concept.'),
  analogyUsed: z.string().optional().describe('If an analogy was used in the explanation, what was it.'),
  simplicityLevel: z.string().optional().describe('An indication of the simplicity level of the explanation.'),
});
export type AiAdaptiveExplanationOutput = z.infer<typeof AiAdaptiveExplanationOutputSchema>;

export async function explainConceptAdaptively(input: AiAdaptiveExplanationInput): Promise<AiAdaptiveExplanationOutput> {
  const { sectionId, concept, context } = input;

  // 1. Query Supabase DB first if sectionId is available
  if (sectionId) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createClient(supabaseUrl, serviceKey);

      const { data: sec } = await supabase
        .from('module_sections')
        .select('ai_explanation')
        .eq('id', sectionId)
        .maybeSingle();

      if (sec?.ai_explanation) {
        const raw = sec.ai_explanation;
        const exp = typeof raw === 'string' ? (raw.startsWith('{') ? JSON.parse(raw) : { explanation: raw }) : raw;
        if (exp?.explanation && exp.explanation.trim().length > 0) {
          return {
            explanation: exp.explanation,
            analogyUsed: exp.analogyUsed || exp.analogy,
            simplicityLevel: exp.simplicityLevel || exp.level || 'simplificada'
          };
        }
      }
    } catch (dbErr) {
      console.warn('DB explanation check warning:', dbErr);
    }
  }

  // 2. Generate with Genkit AI if empty in DB
  let result: AiAdaptiveExplanationOutput | null = null;
  try {
    const { output } = await ai.generate({
      prompt: `Eres un tutor de IA para un módulo de capacitación en seguridad laboral DíaCero. Tu objetivo es entregar explicaciones sencillas y adaptativas en español.

El estudiante tiene dudas sobre el concepto: "${concept}".

Contexto adicional del módulo:
${context || 'N/A'}

Por favor entrega una explicación sencilla, clara y accesible en español con un lenguaje cercano.
Si utilizas una analogía del mundo real, indícala claramente.
Clasifica la simplicidad como 'muy simple', 'simplificada' o 'intermedia'.`,
      output: { schema: AiAdaptiveExplanationOutputSchema },
    });

    if (output?.explanation) {
      result = output;
    }
  } catch (error: any) {
    console.warn('AI adaptive explanation fallback triggered:', error?.message);
  }

  if (!result) {
    result = {
      explanation: `En términos sencillos: "${concept}" se refiere a identificar los riesgos clave antes de actuar y aplicar los procedimientos preventivos para proteger tu integridad física en todo momento.`,
      analogyUsed: 'Como verificar los espejos y abrochar el cinturón antes de conducir un vehículo.',
      simplicityLevel: 'simplificada'
    };
  }

  // 3. Save back to Supabase DB for instant future access across all users
  if (sectionId && result) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createClient(supabaseUrl, serviceKey);

      await supabase
        .from('module_sections')
        .update({ ai_explanation: JSON.stringify(result) })
        .eq('id', sectionId);
    } catch (saveErr) {
      console.warn('DB explanation update error:', saveErr);
    }
  }

  return result;
}
