export interface LangBlock {
	[key: string]: LangBlock | string
}

export type Language = string & Record<never, never>;
export type LangCodePath = string & Record<never, never>;
export type LangCode = string & Record<never, never>;
export type LangValue = string & Record<never, never>;
export type CodeMap = Map<LangCodePath, Map<LangCode, LangValue>>;
export type LangMap = Map<Language, CodeMap>;


export const createLangMapFromJson = (language: Language, langBlock: LangBlock) => {
	const langMap: LangMap = new Map<string, Map<string, Map<string, string>>>();
	const codeMap = createCodeMapFromJson(langBlock);

	langMap.set(language, codeMap);

	return langMap;
};


export const createCodeMapFromJson = (
	langBlock: LangBlock,
	codeMap: CodeMap = new Map<string, Map<string, string>>(),
) => (function processBlock(prefix: string, obj: LangBlock) {
	const entries = Object.entries(obj);
	entries.forEach(([ key, value ]) => {
		if (typeof value === 'string') {
			const map = codeMap.get(prefix) ?? (() =>
				codeMap.set(prefix, new Map()).get(prefix)!)();

			map.set(key, value);
		}
		else {
			processBlock((prefix ? prefix + '.' : '') + key, value);
		}
	});

	return codeMap;
})('', langBlock);


export const appendToLangMap = (langMap: LangMap, language: Language, langBlock: LangBlock) => {
	const codeMap = langMap.get(language) ??
		(() => langMap.set(language, new Map()).get(language)!)();

	createCodeMapFromJson(langBlock, codeMap);

	return langMap;
};
