import { DefaultTranslation, registerTranslation } from '@eyeshare/web-components';

export const translationNb: DefaultTranslation = {
	$code: 'nb',
	$name: 'Norwegian',
	$dir:  'ltr',

	update: 'Oppdater',
	submit: 'Legg til',
	delete: 'Slett',
};

registerTranslation(translationNb);
