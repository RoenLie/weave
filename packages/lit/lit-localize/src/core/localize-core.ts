import type { Dynamic } from './localize-types.js';


type Func = (...args: any) => any;


export abstract class TermStore {

	public static loadTerms(...args: Parameters<TermStore['setTerms']>) {
		return termFunctionRefs.loadRef!(...args);
	}

	public static requestTerm(...args: Parameters<TermStore['requestTerm']>) {
		return termFunctionRefs.requestRef!(...args);
	}

	public static toggleListener(...args: Parameters<TermStore['toggleListener']>) {
		return termFunctionRefs.toggleRef!(...args);
	}

	public static start() {
		if (!this.instance)
			return void (this.instance = new (this as any)());

		console.error('Term store instance already active.');
	}

	public static instance: TermStore;

	protected store = new Map<string, string>();
	protected listeners = new Map<string, Set<WeakRef<Func>>>();
	protected gcRegistry = new FinalizationRegistry<{
		ref: WeakRef<Func>;
		set: Set<WeakRef<Func>>;
	}>(({ set, ref }) => void set.delete(ref));

	protected langChangeObs = new MutationObserver(() => this.onLanguageChange());

	protected constructor() {
		termFunctionRefs.requestRef = this.requestTerm.bind(this);
		termFunctionRefs.toggleRef = this.toggleListener.bind(this);
		termFunctionRefs.loadRef = this.setTerms.bind(this);

		this.listenForLanguageChange();
	}

	protected createCacheKey(lang: string, term: string) {
		return lang + '-' + term;
	}

	protected async requestTerm(term: Dynamic<string>, formatter?: (text: string) => string) {
		const lang = this.detectLanguage();

		let resolvedTerm = typeof term === 'function' ? term() : term;
		resolvedTerm = resolvedTerm instanceof Promise ? await resolvedTerm : resolvedTerm;

		if (!this.hasTerm(resolvedTerm, lang))
			await this.onTermDoesNotExist(resolvedTerm, lang);

		let text = this.getTerm(resolvedTerm, lang) ?? resolvedTerm;

		if (formatter)
			text = formatter(text);

		return text;
	}

	protected toggleListener(term: string, callback: Func, state: boolean): void {
		const set = this.listeners.get(term) ?? (() => {
			const set = new Set<WeakRef<Func>>();

			return this.listeners.set(term, set), set;
		})();

		if (state) {
			const ref = new WeakRef(callback);
			set.add(ref);
			this.gcRegistry.register(callback, { ref, set }, callback);

			return;
		}

		for (const ref of set) {
			const func = ref.deref();
			if (!func || func === callback) {
				set.delete(ref);
				this.gcRegistry.unregister(callback);
			}
		}
	}

	protected onLanguageChange() {
		for (const [ , listeners ] of this.listeners) {
			for (const listenerRef of listeners) {
				const listener = listenerRef.deref();
				if (!listener) {
					listeners.delete(listenerRef);
					continue;
				}

				listener();
			}
		}
	}

	// TODO-maybe: Make this into a callback function or something that gets registered
	// so that there is no inherit connection to window.
	protected listenForLanguageChange() {
		this.langChangeObs.disconnect();
		this.langChangeObs.observe(
			document.documentElement,
			{ attributes: true, attributeFilter: [ 'lang' ] },
		);
	}

	public setTerm(lang: string, term: string, text: string) {
		this.store.set(this.createCacheKey(lang, term), text);

		// Invoke any listeners for this term.
		const listeners = this.listeners.get(term);
		for (const ref of listeners ?? []) {
			const listener = ref.deref();
			if (!listener) {
				listeners?.delete(ref);
				continue;
			}

			listener();
		}
	}

	public setTerms(lang: string, terms: [term: string, text: string][]) {
		for (const [ term, text ] of terms)
			this.setTerm(lang, term, text);

		this.onLanguageChange();
	}

	public getTerm(term: string, lang: string) {
		return this.store.get(this.createCacheKey(lang, term));
	}

	public hasTerm(term: string, lang: string) {
		return this.store.has(this.createCacheKey(lang, term));
	}

	public detectLanguage() {
		return document.documentElement.getAttribute('lang') ?? 'en';
	}

	protected abstract onTermDoesNotExist(
		requestedTerm: string, lang: string
	): Promise<void> | void;

}


const termFunctionRefs: Partial<{
	loadRef:    TermStore['setTerms'],
	toggleRef:  TermStore['toggleListener'],
	requestRef: TermStore['requestTerm'],
}> = {};


/** Sends a request to the term store for a translated term.
 * Returns a [promise, code] where the promise resolves when the term store has successfully
 * retrieved the translation.
 */
export const term = (text: Dynamic<string>, formatter?: (text: string) => string) => {
	const resolvedText = typeof text === 'function' ? text() : text;
	const request = TermStore.requestTerm(resolvedText, formatter);

	return [ request, resolvedText, 'loading...' ] as const;
};


/** Register a callback function that is run upon detecting a language change in the browser. */
export const toggleTermListener = (...args: Parameters<TermStore['toggleListener']>) => {
	TermStore.toggleListener(...args);
};


/** Loads terms for a spesified language into the term store. */
export const loadTerms = (lang: string, terms: [term: string, text: string][]) => {
	TermStore.loadTerms(lang, terms);
};
