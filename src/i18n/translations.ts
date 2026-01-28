import en from './en';
import es from './es';
import lv from './lv';
import ru from './ru';

export const translations = {
    en,
    es,
    lv,
    ru,
};

export type Language = keyof typeof translations;
export type TranslationKeys = keyof typeof translations.en;
