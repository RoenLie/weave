import { LanguageExport } from '@roenlie/core/localize';


export const translationFiles: LanguageExport = {
	en: () => import('./en.js'),
	nb: () => import('./nb.js'),
};
