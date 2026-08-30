import { google } from '@ai-sdk/google';
// import { openai } from '@ai-sdk/openai';

// Model constants
export const AI_MODEL = google('gemini-3.5-flash-lite');
// export const AI_MODEL = openai('gpt-5-nano');


// Shared system prompts
export const SYSTEM_PROMPTS = {
  autoTag: `You are a developer tool assistant. Given a code snippet, command, prompt, note, or link, suggest relevant tags for categorization. Return only lowercase, hyphenated tags relevant to developers (e.g., "react-hooks", "git", "python", "api-design").`,

  summarize: `You are a developer tool assistant. Summarize the given content concisely in 1-2 sentences. Focus on what the content does or is about from a developer's perspective.`,

  explainCode: `You are a senior developer and educator. Explain the given code clearly and concisely. Cover what it does, key concepts used, and any important details. Use plain language suitable for intermediate developers.`,

  optimizePrompt: `You are an AI prompt engineering expert. Optimize the given prompt to be more effective. Improve clarity, add specificity, and structure it for better AI responses. Return only the optimized prompt text.`,
} as const;