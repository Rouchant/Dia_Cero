'use server';
/**
 * @fileOverview Provides AI-generated adaptive explanations for learning module concepts.
 * Uses direct ai.generate to avoid Next.js HMR registry overwrite warnings.
 */

import { z } from 'zod';
import { ai } from '@/ai/genkit';

const AiAdaptiveExplanationInputSchema = z.object({
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

// Server-side cache Map
const explanationCache = new Map<string, AiAdaptiveExplanationOutput>();

export async function explainConceptAdaptively(input: AiAdaptiveExplanationInput): Promise<AiAdaptiveExplanationOutput> {
  const cacheKey = `${input.concept.trim()}_${(input.context || '').trim()}`;
  
  if (explanationCache.has(cacheKey)) {
    return explanationCache.get(cacheKey)!;
  }

  try {
    const { output } = await ai.generate({
      prompt: `Eres un tutor de IA para un módulo de capacitación en seguridad laboral DíaCero. Tu objetivo es entregar explicaciones sencillas y adaptativas en español.

El estudiante tiene dudas sobre el concepto: "${input.concept}".

Contexto adicional del módulo:
${input.context || 'N/A'}

Por favor entrega una explicación sencilla, clara y accesible en español con un lenguaje cercano.
Si utilizas una analogía del mundo real, indícala claramente.
Clasifica la simplicidad como 'muy simple', 'simplificada' o 'intermedia'.`,
      output: { schema: AiAdaptiveExplanationOutputSchema },
    });

    if (output?.explanation) {
      explanationCache.set(cacheKey, output);
      return output;
    }
  } catch (error: any) {
    console.warn('AI adaptive explanation fallback triggered:', error?.message);
  }

  // Fast fallback explanation
  const fallbackResult: AiAdaptiveExplanationOutput = {
    explanation: `En términos sencillos: "${input.concept}" se refiere a identificar los riesgos clave antes de actuar y aplicar los procedimientos preventivos para proteger tu integridad física en todo momento.`,
    analogyUsed: 'Como verificar los espejos y abrochar el cinturón antes de conducir un vehículo.',
    simplicityLevel: 'simplificada'
  };

  explanationCache.set(cacheKey, fallbackResult);
  return fallbackResult;
}
