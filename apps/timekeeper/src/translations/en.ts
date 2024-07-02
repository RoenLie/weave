import { DefaultTranslation, registerTranslation } from '@eyeshare/web-components';

export const translationEn: DefaultTranslation = {
	$code: 'en',
	$name: 'English',
	$dir:  'ltr',

	update: 'Update',
	submit: 'Submit',
	delete: 'Delete',
};

registerTranslation(translationEn);
