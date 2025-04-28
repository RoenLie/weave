/* eslint-disable @stylistic/max-len */
import { css, html, svg } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

import { AegisElement, customElement, state } from '../../aegis/index.js';
import { componentStyles } from '../../styles/component.styles.js';


@customElement('midoc-copy-code')
export class MiDocCopyCodeCmp extends AegisElement {

	protected static icons = {
		neutral: svg`
		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard" viewBox="0 0 16 16">
			<path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z"/>
			<path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0z"/>
		</svg>
		`,
		success: svg`
		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard-heart" viewBox="0 0 16 16">
			<path fill-rule="evenodd" d="M5 1.5A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5v1A1.5 1.5 0 0 1 9.5 4h-3A1.5 1.5 0 0 1 5 2.5zm5 0a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5z"/>
			<path d="M3 1.5h1v1H3a1 1 0 0 0-1 1V14a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V3.5a1 1 0 0 0-1-1h-1v-1h1a2 2 0 0 1 2 2V14a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V3.5a2 2 0 0 1 2-2"/>
			<path d="M8 6.982C9.664 5.309 13.825 8.236 8 12 2.175 8.236 6.336 5.31 8 6.982"/>
		</svg>
		`,
		error: svg`
		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard-x" viewBox="0 0 16 16">
			<path fill-rule="evenodd" d="M6.146 7.146a.5.5 0 0 1 .708 0L8 8.293l1.146-1.147a.5.5 0 1 1 .708.708L8.707 9l1.147 1.146a.5.5 0 0 1-.708.708L8 9.707l-1.146 1.147a.5.5 0 0 1-.708-.708L7.293 9 6.146 7.854a.5.5 0 0 1 0-.708"/>
			<path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z"/>
			<path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0z"/>
		</svg>
		`,
	};

	@state() protected activeIcon: keyof typeof MiDocCopyCodeCmp['icons'] = 'neutral';

	protected handleClick() {
		const content = this.textContent?.trim();
		if (!content)
			return;

		try {
			navigator.clipboard.writeText(content);
			this.activeIcon = 'success';
			setTimeout(() => { this.activeIcon = 'neutral';	}, 1000);
		}
		catch {
			this.activeIcon = 'error';
			setTimeout(() => { this.activeIcon = 'neutral';	}, 1000);
		}
	}

	override render() {
		return html`
		<button @click=${ this.handleClick } style=${ styleMap({
			color: this.activeIcon === 'success' ? 'var(--midoc-success)'
				: this.activeIcon === 'error' ? 'var(--midoc-error)'
				: '',
		}) }>
			${ MiDocCopyCodeCmp.icons[this.activeIcon] }
		</button>
		<slot style="display:none;"></slot>
		`;
	}

	static override styles = [
		componentStyles,
		css`
		:host {
			position: absolute;
			top: 7.5px;
			right: 6px;
			display: block;
		}
		button {
			all: unset;
			cursor: pointer;
			display: grid;
			place-items: center;
			opacity: 0.5;
			transition: opacity 0.2s;
			transition-delay: 0.5s;

			&:hover {
				opacity: 1;
				transition-delay: 0s;
			}
		}
		svg {
			transition: fill 0.2s;
		}
		`,
	];

}
