//import '@roenlie/elements/styles';

import { sleep } from '@roenlie/core/async';
import { LangBlockStore } from '@roenlie/lit-localize/implement';
import { appendToLangMap, createLangMapFromJson } from '@roenlie/lit-localize/utilities';

import codes from './misc/language-en.json';


const langMap = createLangMapFromJson('en', {});
//const langMap = createLangMapFromJson('en', codes);
appendToLangMap(langMap, 'en', codes);


class EsTermStore extends LangBlockStore {

	public async retrieveLangBlock(block: string, lang: string) {
		await sleep(500);

		return langMap.get(lang)?.get(block);
	}

}

EsTermStore.start();
