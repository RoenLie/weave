import type { Part } from 'lit';
import { AsyncDirective } from 'lit/async-directive.js';
import { directive } from 'lit/directive.js';
import { until } from 'lit/directives/until.js';

import { term, toggleTermListener } from '../core/localize-core.js';
import type { DirectiveString, Dynamic } from '../core/localize-types.js';


class TermDirective extends AsyncDirective {

	protected term: Dynamic<string>;

	protected formatter?: (text: string) => string;

	protected forceUpdate = () => {
		this.setValue(until(...term(this.term, this.formatter)));
	};

	protected async toggleListener(state: boolean) {
		if (state && !this.isConnected)
			return;

		let resolvedText = typeof this.term === 'function'
			? this.term()
			: this.term;

		resolvedText = resolvedText instanceof Promise
			? await resolvedText
			: resolvedText;

		toggleTermListener(resolvedText, this.forceUpdate, state);
	}

	public override update(_part: Part, props: unknown[]) {
		try {
			return super.update(_part, props);
		}
		finally {
			this.toggleListener(true);
		}
	}

	protected override reconnected() {
		this.toggleListener(true);
	}

	protected override disconnected() {
		this.toggleListener(false);
	}

	public render(...[ text, formatter ]: Parameters<typeof term>) {
		this.term = text;
		this.formatter = formatter;

		return until(...term(text, formatter));
	}

}

/**
 * Renders the pre translation term while waiting for the term store and then the resolved translation.
 *
 * This function actually returns a `DirectiveResult<typeof UntilDirective>`.
 *
 * Declaring the returntype as a string is a small white lie.
 * This is done to allow it to be correctly understood by typescript as a valid value to set on string attributes.
 */
export const tTerm = directive(TermDirective) as (...args: Parameters<TermDirective['render']>) => DirectiveString;
