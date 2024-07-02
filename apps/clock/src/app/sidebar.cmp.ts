import { component } from '@roenlie/lit-fabric/core';
import { useProperty } from '@roenlie/lit-fabric/hooks';
import { sharedStyles } from '@roenlie/lit-utilities/styles';
import { css, html } from 'lit';
import { map } from 'lit/directives/map.js';


export const Sidebar = component('clk-sidebar-element', () => {
	const [ items ] = useProperty<{
		icon: string;
		label: string;
		path: () => string;
	}[]>('items', []);

	const itemTemplate = (item: typeof items.value[0]) => {
		return html`
		<mm-ripple>
			<a href=${ item.path() }>
				<mm-icon url=${ item.icon }></mm-icon>
				<mm-text>${ item.label }</mm-text>
			</a>
		</mm-ripple>
		`;
	};

	return ({
		render: () => html`
		<menu>
		${ map(items.value, item => itemTemplate(item)) }
		</menu>
		`,
		styles: [
			sharedStyles,
			css`
			:host {
				display: grid;
			}
			menu {
				all: unset;
				display: grid;
				grid-auto-flow: row;
				grid-auto-rows: max-content;
				padding-block: 12px;
				padding-inline: 8px;
			}
			mm-ripple {
				--ripple-bg: var(--surface-variant-press);
			}
			a {
				display: grid;
				align-items: center;
				gap: 8px;
				grid-template-columns: auto 1fr;
				padding-inline: 12px;
				padding-block: 6px;
				border-radius: 8px;
				cursor: pointer;
			}
			a:hover {
				background-color: var(--surface-variant-hover);
				box-shadow: var(--box-shadow-s);
			}
			`,
		],
	});
});
