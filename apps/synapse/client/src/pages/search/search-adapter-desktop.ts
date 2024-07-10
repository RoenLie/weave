import { Adapter } from '@roenlie/lit-aegis';
import type { SearchPageCmp } from './search-page.ts';
import { html } from 'lit';


export class SearchPageDesktopAdapter extends Adapter<SearchPageCmp> {

	public override render() {
		return html`
		HEI
		`;
	}

}
