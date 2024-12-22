import { experimental_createProviderRegistry as createProviderRegistry } from 'ai';
import { openai } from '@ai-sdk/openai';

export const registry = createProviderRegistry({
  openai,
});

export function getModel(model: string) {
  return registry.languageModel(model);
}

export function isProviderEnabled(providerId: string): boolean {
  switch (providerId) {
    case 'openai':
      return !!process.env.OPENAI_API_KEY;
    default:
      return false;
  }
}
