import { TermStore } from '../core/localize-core.js';


export abstract class LangBlockStore extends TermStore {

	public langBlockRequests = new Map<string, Promise<any>>();

	public abstract retrieveLangBlock(
		block: string,
		lang: string
	): Promise<Map<string, string> | undefined>;

	public override async onTermDoesNotExist(requestedTerm: string, lang: string) {
		const head = requestedTerm.split('.').slice(0, -1).join('.');

		const requestKey = lang + ':' + head;
		const existingRequest = this.langBlockRequests.get(requestKey);

		if (existingRequest) {
			await existingRequest;
		}
		else {
			const termBlock = this.retrieveLangBlock(head, lang);
			this.langBlockRequests.set(requestKey, termBlock);

			for (const [ code, text ] of await termBlock ?? new Map())
				this.setTerm(lang, head + '.' + code, text);

			this.langBlockRequests.delete(requestKey);
		}
	}

}
