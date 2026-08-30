'use server';

import { auth } from '@/lib/auth';
import { generateText, Output } from 'ai';
import { AI_MODEL, SYSTEM_PROMPTS } from '@/lib/ai';
import { checkRateLimit, rateLimiters } from '@/lib/rate-limit';
import { autoTagSchema } from '../validators';

// Helper to format reset time
function formatResetTime(reset: Date): string {
  const diff = Math.max(0, reset.getTime() - Date.now());
  const minutes = Math.ceil(diff / (60 * 1000));
  if (minutes < 1) return 'a few seconds';
  if (minutes === 1) return '1 minute';
  return `${minutes} minutes`;
}


export async function suggestTags(input: {
  title: string;
  content: string;
  typeName: string;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: 'Unauthorized',
    };
  }

  // Pro gating
  const isPro = session.user.isPro ?? false;

  if (!isPro) {
    return {
      success: false,
      error: 'AI features require a Pro subscription',
    };
  }

  // Rate limiting
  const rate = await checkRateLimit(
    rateLimiters.aiFeatures,
    session.user.id
  );

  if (!rate.success) {
    return {
      success: false,
      error: `AI rate limit reached. Try again in ${formatResetTime(rate.reset)}.`,
    };
  }

  // Limit input size
  const title = input.title.slice(0, 200);
  const typeName = input.typeName.slice(0, 100);
  const truncated = input.content.slice(0, 2000);

  try {
    const { output } = await generateText({
      model: AI_MODEL,
      system: SYSTEM_PROMPTS.autoTag,
      prompt: `Type: ${typeName}
Title: ${title}
Content: ${truncated}`,
      output: Output.object({
        schema: autoTagSchema,
      }),
      maxOutputTokens: 100,
    });

    const tags = output.tags
      .map((tag) => tag.toLowerCase().trim())
      .filter(Boolean);

    return {
      success: true,
      data: tags,
    };
  } catch (error) {
    console.error('AI auto-tag error:', error);

    return {
      success: false,
      error: 'Failed to generate tag suggestions',
    };
  }
}




export async function explainCode(input: {
  content: string;
  language: string;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: 'Unauthorized',
    };
  }

  // Pro gating
  const isPro = session.user.isPro ?? false;

  if (!isPro) {
    return {
      success: false,
      error: 'AI features require a Pro subscription',
    };
  }

  // Rate limiting
  const rate = await checkRateLimit(
    rateLimiters.aiFeatures,
    session.user.id
  );

  if (!rate.success) {
    return {
      success: false,
      error: `AI rate limit reached. Try again in ${formatResetTime(rate.reset)}.`,
    };
  }

  // Limit input size
  const language = input.language.slice(0, 50);
  const truncated = input.content.slice(0, 3000);

  try {
    const { text } = await generateText({
      model: AI_MODEL,
      system: SYSTEM_PROMPTS.explainCode,
      prompt: `Language: ${language || 'unknown'}

Code:
\`\`\`
${truncated}
\`\`\``,
      maxOutputTokens: 500,
    });

    return {
      success: true,
      data: text,
    };
  } catch (error) {
    console.error('AI explain code error:', error);

    return {
      success: false,
      error: 'Failed to explain code',
    };
  }
}



export async function generateSummary(input: {
  title: string;
  content: string;
  typeName: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' };
  if (!session.user.isPro) return { success: false, error: 'AI features require a Pro subscription' };

  const rate = await checkRateLimit(rateLimiters.aiFeatures, session.user.id);
  if (!rate.success) return { success: false, error: `AI rate limit reached. Try again in ${formatResetTime(rate.reset)}.`, };

  const truncated = input.content.slice(0, 2000);
  try {
    const { text } = await generateText({
      model: AI_MODEL,
      system: SYSTEM_PROMPTS.summarize,
      prompt: `Title: ${input.title}\nContent: ${truncated}`,
      maxOutputTokens: 150,
    });
    return { success: true, data: text };
  } catch (error) {
    console.error('AI summary error:', error);
    return { success: false, error: 'Failed to generate summary' };
  }
}




export async function optimizePrompt(input: { content: string }) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' };
  if (!session.user.isPro) return { success: false, error: 'AI features require a Pro subscription' };

  const rate = await checkRateLimit(rateLimiters.aiFeatures, session.user.id);
  if (!rate.success) return { success: false, error: `AI rate limit reached. Try again in ${formatResetTime(rate.reset)}.` };

  const truncated = input.content.slice(0, 3000);
  try {
    const { text } = await generateText({
      model: AI_MODEL,
      system: SYSTEM_PROMPTS.optimizePrompt,
      prompt: truncated,
      maxOutputTokens: 400,
    });
    return { success: true, data: text };
  } catch (error) {
    console.error('AI prompt optimizer error:', error);
    return { success: false, error: 'Failed to optimize prompt' };
  }
}