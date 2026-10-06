import { thMessages, type MessageKey } from './th.js';
import { enMessages } from './en.js';

export type SupportedLocale = 'th' | 'en';

export function resolveLocale(acceptLanguageHeader?: string): SupportedLocale {
  if (!acceptLanguageHeader) return 'th';
  const lower = acceptLanguageHeader.toLowerCase();
  if (lower.startsWith('en') || lower.includes(',en')) {
    return 'en';
  }
  return 'th';
}

export function getErrorMessage(
  key: MessageKey,
  locale: SupportedLocale = 'th'
): string {
  const dictionary = locale === 'en' ? enMessages.errors : thMessages.errors;
  return dictionary[key] ?? thMessages.errors.INTERNAL_SERVER_ERROR;
}

export function getSystemMessage(
  key: keyof typeof thMessages.system,
  locale: SupportedLocale = 'th'
): string {
  const dictionary = locale === 'en' ? enMessages.system : thMessages.system;
  return dictionary[key] ?? thMessages.system.HEALTH_OK;
}
