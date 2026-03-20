'use server';
/**
 * @fileOverview Provides AI-generated adaptive explanations for learning module concepts.
 *
 * - explainConceptAdaptively - A function that handles the adaptive explanation process.
 * - AiAdaptiveExplanationInput - The input type for the explainConceptAdaptively function.
 * - AiAdaptiveExplanationOutput - The return type for the explainConceptAdaptively function.
 *
 * This AI tool helps learners by providing simpler explanations or different analogies
 * for concepts they struggle with, enhancing understanding and reducing cognitive load.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiAdaptiveExplanationInputSchema = z.object({
  concept: z.string().describe('The specific concept the learner is struggling with.'),
  context: z.string().optional().describe('Optional context from the learning module or the learner\'s previous interaction (e.g., prior incorrect answers, specific questions).'),
});
export type AiAdaptiveExplanationInput = z.infer<typeof AiAdaptiveExplanationInputSchema>;

const AiAdaptiveExplanationOutputSchema = z.object({
  explanation: z.string().describe('The AI-generated adaptive explanation for the concept.'),
  analogyUsed: z.string().optional().describe('If an analogy was used in the explanation, what was it.'),
  simplicityLevel: z.string().optional().describe('An indication of the simplicity level of the provided explanation (e.g., "very simple", "simplified", "intermediate").'),
});
export type AiAdaptiveExplanationOutput = z.infer<typeof AiAdaptiveExplanationOutputSchema>;

export async function explainConceptAdaptively(input: AiAdaptiveExplanationInput): Promise<AiAdaptiveExplanationOutput> {
  return aiAdaptiveExplanationFlow(input);
}

const adaptiveExplanationPrompt = ai.definePrompt({
  name: 'adaptiveExplanationPrompt',
  input: { schema: AiAdaptiveExplanationInputSchema },
  output: { schema: AiAdaptiveExplanationOutputSchema },
  prompt: `You are an AI tutor for a learning module. Your goal is to provide clear, adaptive explanations to help a learner better understand concepts they are struggling with.

The learner is having difficulty with the concept of: "{{{concept}}}}".

Here is some additional context about their current understanding or previous interaction with the material (if available):
{{{context}}}

Please provide an explanation of "{{{concept}}}}" that is simpler than a typical textbook explanation, or uses a different, more accessible analogy.
Focus on clarity, brevity, and making the concept easier to grasp.
If you use an analogy, clearly state what analogy was used.
Rate the simplicity level of your explanation as 'very simple', 'simplified', or 'intermediate'.

Example output for a simple explanation:
{
  "explanation": "A 'variable' in programming is like a box where you can store different things. You give the box a name, and then you can put numbers, words, or other data inside it. You can also open the box later to see what's inside or change its contents.",
  "analogyUsed": "A box for storing things",
  "simplicityLevel": "very simple"
}

Example output for a more complex concept with analogy:
{
  "explanation": "The 'event loop' in JavaScript is like a restaurant kitchen that handles orders one by one, but quickly. When a new order (task) comes in, if it's something quick like cutting vegetables, it's done immediately. If it's a long task like baking a cake, it's handed off to an oven (web API) to bake in the background, allowing the kitchen (main thread) to take other quick orders. Once the cake is baked, it goes to a waiting area (callback queue) until the kitchen is free to 'serve' it (execute its callback).",
  "analogyUsed": "A restaurant kitchen handling orders",
  "simplicityLevel": "simplified"
}
`,
});

const aiAdaptiveExplanationFlow = ai.defineFlow(
  {
    name: 'aiAdaptiveExplanationFlow',
    inputSchema: AiAdaptiveExplanationInputSchema,
    outputSchema: AiAdaptiveExplanationOutputSchema,
  },
  async (input) => {
    const { output } = await adaptiveExplanationPrompt(input);
    if (!output) {
      throw new Error('Failed to generate adaptive explanation.');
    }
    return output;
  }
);
