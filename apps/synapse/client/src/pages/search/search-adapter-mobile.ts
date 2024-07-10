import { Adapter, state } from '@roenlie/lit-aegis';
import type { Image } from '../capture/components/gallery.cmp.ts';
import { debounce } from '@roenlie/core/timing';
import { ServerURL } from '../../app/server-url.ts';
import { maybe } from '@roenlie/core/async';
import { html } from 'lit';
import { map } from 'lit/directives/map.js';
import { live } from 'lit/directives/live.js';
import searchPageStyles from './search.css' with { type: 'css' };
import type { SearchPageCmp } from './search-page.ts';


export class SearchPageMobileAdapter extends Adapter<SearchPageCmp> {

	@state() protected searchResult: Image[] = [];
	protected searchValue = '';

	public override connectedCallback(): void {
		this.updateComplete.then(() =>
			this.shadowRoot!.querySelector('input')?.focus());
	}

	protected async onSearch(ev: InputEvent) {
		const target = ev.target as HTMLInputElement;
		this.searchValue = target.value;
		this.vectorSearch();
	}

	protected vectorSearch = debounce(async () => {
		if (!this.searchValue)
			return this.searchResult = [];

		const url = new ServerURL('/api/search');
		url.searchParams.set('query', this.searchValue);

		interface SearchResult {
			query:  string;
			files:  string[];
			error?: unknown;
		}

		const [ searchResult, err ] = await maybe<SearchResult>(
			fetch(url).then(r => r.json()),
		);

		if (err)
			return;

		this.searchResult = searchResult.files.map(f => {
			return {
				datauri: 'data:image/png;base64,' + f,
				hash:    '',
				name:    '',
			};
		});
	}, 500);

	public override render(): unknown {
		return html`
		<s-results>
			${ map(this.searchResult, res => html`
			<s-img-wrapper>
				<img .src=${ res.datauri }>
			</s-img-wrapper>
			`) }
		</s-results>

		<s-search>
			<input
				synapse
				type="search"
				value=${ live(this.searchValue) }
				@input=${ this.onSearch }
			>
		</s-search>
		`;
	}

	public static override styles = searchPageStyles;

}
