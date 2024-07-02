import { ContainerLoader } from '@roenlie/lit-aegis';
import { css, html, LitElement, type PropertyValues, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';
import { when } from 'lit/directives/when.js';

import type { SiteConfig } from '../../../shared/config.types.js';
import type { Declarations } from '../../../shared/metadata.types.js';
import { componentStyles } from '../../styles/component.styles.js';


@customElement('midoc-metadata-viewer')
export class MiDocMetadataViewerCmp extends LitElement {

	//#region properties
	@property({ type: Object }) public declaration: Declarations;
	protected sanitizedDeclarations: Declarations;
	//#endregion properties


	//#region controllers
	//#endregion


	//#region lifecycle
	protected override update(props: PropertyValues): void {
		if (props.has('declaration')) {
			this.sanitizedDeclarations = structuredClone(this.declaration);
			this.sanitizedDeclarations.members = this.sanitizedDeclarations.members
				?.filter(prop => prop.privacy === 'public');
		}

		super.update(props);
	}
	//#endregion


	//#region logic
	//#endregion


	//#region template
	protected propertiesTpl() {
		const props = this.sanitizedDeclarations.members;

		return html`
		<section class="prop-section">
			<header>
				<h3>Properties</h3>
			</header>

			<div class="prop-body">
				<div class="prop-body__header">
					<span class="prop-name">Name</span>
					<span class="prop-description">Description</span>
					<span class="prop-reflects">Reflects</span>
					<span class="prop-type">Type</span>
					<span class="prop-default">Default</span>
				</div>

				${ map(props, prop => html`
				<div class="prop-body__row">
					<span class="prop-name"><p>${ prop.name }</p></span>
					<span class="prop-description">${ prop.description }</span>
					<span class="prop-reflects">${ prop.reflects ? '✔' : '' }</span>
					<span class="prop-type">${ prop.type?.text.split('|').filter(t => t).map(type => html`<p>${ type }</p>`) ?? '' }</span>
					<span class="prop-default">${ prop.default ? html`<p>${ prop.default }</p>` : '' }</span>
				</div>
				`) }
			</div>

			<footer class="prop-footer">
				Learn more about
				<a href="https://open-wc.org/guides/knowledge/attributes-and-properties/" target="_blank" rel="noopener noreferrer">
					properties and attributes
				</a>
			</footer>
		</section>
		`;
	}

	protected cssPropertiesTpl() {
		const props = this.sanitizedDeclarations.cssProperties;

		return html`
		<section class="prop-section">
			<header>
				<h3>CSS Properties</h3>
			</header>

			<div class="prop-body">
				<div class="cssprop-body__header">
					<span>Name</span>
					<span>Description</span>
				</div>

				${ map(props, prop => html`
				<div class="cssprop-body__row">
					<span class="prop-name"><p>${ prop.name }</p></span>
					<span class="prop-description">${ prop.description }</span>
				</div>
				`) }
			</div>

			<footer class="prop-footer">
				Learn more about
				<a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties" target="_blank" rel="noopener noreferrer">
					custom css properties
				</a>
			</footer>
		</section>
		`;
	}

	protected cssPartsTpl() {
		const props = this.sanitizedDeclarations.cssParts;

		return html`
		<section class="prop-section">
			<header>
				<h3>CSS Parts</h3>
			</header>

			<div class="prop-body">
				<div class="cssprop-body__header">
					<span>Name</span>
					<span>Description</span>
				</div>

				${ map(props, prop => html`
				<div class="cssprop-body__row">
					<span class="prop-name"><p>${ prop.name }</p></span>
					<span class="prop-description">${ prop.description }</span>
				</div>
				`) }
			</div>

			<footer class="prop-footer">
				Learn more about
				<a href="https://developer.mozilla.org/en-US/docs/Web/CSS/::part" target="_blank" rel="noopener noreferrer">
					css parts
				</a>
			</footer>
		</section>
		`;
	}

	protected slotsTpl() {
		const props = this.sanitizedDeclarations.slots;

		return html`
		<section class="prop-section">
			<header>
				<h3>Slots</h3>
			</header>

			<div class="prop-body">
				<div class="cssprop-body__header">
					<span>Name</span>
					<span>Description</span>
				</div>

				${ map(props, prop => html`
				<div class="cssprop-body__row">
					<span class="prop-name"       ><p>${ prop.name || 'default' }</p></span>
					<span class="prop-description">${ prop.description }</span>
				</div>
				`) }
			</div>

			<footer class="prop-footer">
				Learn more about
				<a href="https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_templates_and_slots" target="_blank" rel="noopener noreferrer">
					slots
				</a>
			</footer>
		</section>
		`;
	}

	protected depsTpl() {
		const props = this.sanitizedDeclarations.dependencies;

		return html`
		<section class="prop-section">
			<header>
				<h3>Dependencies</h3>
			</header>

			<div class="prop-body">
				<div class="cssprop-body__header">
					<span>Name</span>
				</div>

				<div class="chip-row">
				${ map(props, prop => html`
					<span class="prop-chip"><p>${ prop.name || '' }</p></span>
				`) }
				</div>
			</div>
		</section>
		`;
	}

	public override render() {
		return html`

		${ when(this.sanitizedDeclarations?.members?.length, () => html`
		<div part="base" class="base">
			${ this.propertiesTpl() }
		</div>
		`) }

		${ when(this.sanitizedDeclarations?.cssProperties?.length, () => html`
		<div part="base" class="base">
			${ this.cssPropertiesTpl() }
		</div>
		`) }

		${ when(this.sanitizedDeclarations?.cssParts?.length, () => html`
		<div part="base" class="base">
			${ this.cssPartsTpl() }
		</div>
		`) }

		${ when(this.sanitizedDeclarations?.slots?.length, () => html`
		<div part="base" class="base">
			${ this.slotsTpl() }
		</div>
		`) }

		${ when(this.sanitizedDeclarations?.dependencies?.length, () => html`
		<div part="base" class="base">
			${ this.depsTpl() }
		</div>
		`) }
		`;
	}
	//#endregion


	//#region style
	public static override styles = [
		componentStyles,
		css`
		:host {
			display: flex;
			flex-flow: column nowrap;
			gap: 48px;
		}

		.base {
			background-color: var(--midoc-background);
			color: var(--midoc-on-surface);
			border: 1px solid var(--midoc-surface-variant);
			border-radius: var(--midoc-border-radius-s);
			padding: 12px;
		}

		.prop-section {
			display: flex;
			flex-flow: column nowrap;
			gap: 12px;
		}

		.prop-body {
			display: flex;
			flex-flow: column nowrap;
			gap: 8px;
		}

		.prop-body__header,
		.prop-body__row {
			display: grid;
			grid-auto-flow: column;
			grid-template-columns: 2fr 5fr 1fr 1fr 2fr;
			gap: 8px;
			padding-top: 8px;
		}

		.prop-body__row .prop-name,
		.cssprop-body__row .prop-name {
			display: flex;
			height: 100%;
			align-items: center;
		}

		.prop-body__row .prop-description,
		.cssprop-body__row .prop-description {
			display: flex;
			height: 100%;
			align-items: center;
		}

		.prop-body__row .prop-reflects,
		.prop-body__row .prop-type,
		.prop-body__row .prop-default {
			display: grid;
			gap: 4px;
			place-items: center;
		}

		.prop-chip,
		.prop-body__row .prop-name p,
		.prop-body__row .prop-type p,
		.prop-body__row .prop-default p,
		.cssprop-body__row .prop-name p,
		.cssprop-body__row .prop-type p,
		.cssprop-body__row .prop-default p {
			padding: 4px 4px;
			background-color: var(--midoc-surface-variant);
			border-radius: 6px;
			line-height: 1em;
			font-size: 0.8em;
			display: flex;
			width: fit-content;
			color: var(--midoc-on-surface-variant);
		}

		.prop-name,
		.prop-description,
		.prop-reflects,
		.prop-default,
		.prop-type {
			word-break: break-word;
		}

		.prop-reflects,
		.prop-default,
		.prop-type {
			margin: 0 auto;
		}

		.prop-body__header,
		.cssprop-body__header {
			font-weight: 600;
		}
		.prop-body__row,
		.cssprop-body__row {
			border-top: 1px solid var(--midoc-surface-variant);
		}

		.cssprop-body__header,
		.cssprop-body__row {
			display: grid;
			grid-auto-flow: column;
			grid-template-columns: 2fr 9fr;
			gap: 8px;
			padding-top: 8px;
		}

		.chip-row {
			display: flex;
			flex-flow: row wrap;
			gap: 12px;
		}

		.prop-footer {
			font-style: italic;
		}
		.prop-footer a {
			color: var(--midoc-tertiary);
		}
	`,
	];

	static {
		const cfg = ContainerLoader.get<SiteConfig>('site-config');
		const style = cfg.root?.styleOverrides?.metadata;
		if (style)
			this.styles.push(unsafeCSS(style));
	}
	//#endregion

}
