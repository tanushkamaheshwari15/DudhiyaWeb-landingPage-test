import { en } from './en';
import { hi } from './hi';
import { pa } from './pa';
import { kn } from './kn';

export const translations = {
  en,
  hi,
  pa,
  kn
};

export const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' }
];

export const defaultLanguage = 'hi'; // Default to Hindi as per user request
