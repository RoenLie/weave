import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';


export type MonarchObject = {
	defaultToken: string;
	tokenPostfix: string;
	keywords:     string[];
	typeKeywords: string[];
	operators:    string[];
	symbols:      RegExp;
	escapes:      RegExp;
	digits:       RegExp;
	octaldigits:  RegExp;
	binarydigits: RegExp;
	hexdigits:    RegExp;
	regexpctl:    RegExp;
	regexpesc:    RegExp;
	tokenizer:    MonarchTokenizer;
} & Record<string, any>;

export type MonarchTokenizer = Record<string, TokenizerEntry[]>;


export type TokenizerEntry = [
	regex: string | RegExp,
	action: string
] | [
	regex: string | RegExp,
	action: string | string[],
	next: string
] | [
	regex: string | RegExp,
	{
		token?:  string;
		goBack?: number;
		cases?:  Record<string, TokenizerEntry | string>;
		log?:    string;
		next?:   string;
	}
] | {
	token?:  string;
	goBack?: number;
	cases?:  Record<string, TokenizerEntry | string>;
	log?:    string;
	next?:   string;
} | {
	include: string;
};

export type LanguageExtension = monaco.languages.ILanguageExtensionPoint & { loader: () => Promise<{
	language: MonarchObject;
}> };


export const isTokenizer = (value: any, key: string): value is MonarchTokenizer => {
	return key === 'tokenizer';
};


export const updateLangConfig = async (lang: string, monarchObject: Partial<MonarchObject>) => {
	const allLangs = monaco.languages.getLanguages();
	const baseLang = allLangs.find(({ id }) => id === lang);
	const { language } = await (baseLang as LanguageExtension).loader();

	for (const key in monarchObject) {
		const value = monarchObject[key as keyof MonarchObject]!;

		if (isTokenizer(value, key)) {
			const tokenizer = language.tokenizer;

			for (const category in value) {
				const tokenArr = tokenizer[category] ??= [];
				const tokenDefs = value[category];
				if (Array.isArray(tokenDefs))
					tokenArr.unshift(...tokenDefs);
			}
		}
		else if (Array.isArray(value)) {
			const propArr: unknown = ((language as any)[key] ??= []);
			if (Array.isArray(propArr))
				propArr.unshift(...value);
		}
	}
};
