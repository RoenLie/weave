import { html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import searchPageStyles from './search.css' with { type: 'css' };
import { sharedStyles } from '../../app/shared-styles.ts';
import { maybe, maybeAll, type Maybe } from '@roenlie/core/async';
import { debounce } from '@roenlie/core/timing';
import { live } from 'lit/directives/live.js';
import { serverUrl } from '../../app/constants.ts';
import type { Image } from '../capture/components/gallery.cmp.ts';
import { map } from 'lit/directives/map.js';

@customElement('syn-search-page')
export class SearchPageCmp extends LitElement {

	@state() protected searchResult: Image[] = [];
	protected searchValue = '';

	public override connectedCallback(): void {
		super.connectedCallback();

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

		const url = new URL(serverUrl + '/api/search', location.origin);
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

	protected override render(): unknown {
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

	public static override styles = [
		sharedStyles,
		searchPageStyles,
	];

}
