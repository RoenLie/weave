import { DefaultTranslation, registerTranslation } from '@roenlie/mimic-core/localize';


const translation: DefaultTranslation = {
	$code: 'en',
	$name: 'English',
	$dir:  'ltr',

	loading:  'Loading',
	close:    'Close',
	progress: 'Progress',
};


export default (async () => {
	registerTranslation(translation);

	return translation;
})();
