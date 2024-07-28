import { signal, type Signal } from '@lit-labs/preact-signals';

type Language = string;
type Term = string;
type Translation = string;


export class LanguageStore {

	protected readonly termStore = new Map<Language, Map<Term, Translation>>();
	protected readonly activeTerms = new Map<Term, Signal<Translation>>();
	protected readonly language = signal('en');
	protected langSubscription: () => void;

	constructor() {
		this.langSubscription = this.language.subscribe(lang => {
			const termMap = this.getTermMap(lang);

			// lang changed, replace all entries in activeTerms.
			// entries will not override the entire signal, just its value.
			// This allows any component using the signal to rerender upon language change.
			this.activeTerms.forEach((sig, term) => {
				sig.value = termMap.get(term) ?? term;
			});
		});
	}

	protected getTermMap(language: Language): Map<Term, Translation> {
		return this.termStore.get(language) ??
			this.termStore.set(language, new Map()).get(language)!;
	}

	public dispose(): void {
		this.langSubscription();
	}

	public changeLanguage(language: Language): void {
		this.language.value = language;
	}

	public addTerm(language: Language, term: Term, translation: Translation): void {
		const termMap = this.getTermMap(language);
		termMap.set(term, translation);

		// Update the active term signal if it exists.
		if (language === this.language.value && this.activeTerms.has(term))
			this.activeTerms.get(term)!.value = translation;
	}

	public term(term: Term): Signal<string> {
		let termSignal = this.activeTerms.get(term);
		if (!termSignal) {
			const termMap = this.getTermMap(this.language.value);

			termSignal = signal(termMap.get(term) ?? term);
			this.activeTerms.set(term, termSignal);
		}

		return termSignal;
	}

}


export let localize: LanguageStore = new LanguageStore();
export const overrideLanguageStore = (store: LanguageStore) => {
	localize.dispose();
	localize = store;
};


export const term = (term: Term, formatter?: (text: Translation) => Translation) => {
	const translation = localize.term(term);

	return formatter ? formatter(translation.value) : translation.value;
};
