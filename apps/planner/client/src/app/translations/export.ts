import { LanguageExport } from '@roenlie/mimic-core/localize';


export const translationFiles: LanguageExport = {
	en: () => import('./en.js'),
	nb: () => import('./nb.js'),
};
