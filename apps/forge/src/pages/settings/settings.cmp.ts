import { AegisElement, customElement } from '@roenlie/lit-aegis';
import { Keystone, type KeystoneComponent, type SubProps, useStyle } from 'keystone-core';
import { html } from 'lit';
import { createRef, ref } from 'lit/directives/ref.js';

import cardStyle from './card.css' with { type: 'css' };


interface Card {
	(): KeystoneComponent;
	Header(props: {text: string}): KeystoneComponent;
	Body(props: {text: string}): KeystoneComponent;
	Footer(props: {text: string}): KeystoneComponent;
}


const Card = Keystone(props => {
	useStyle(cardStyle, 'card');
	const el = createRef();

	return () => html`
	<s-card class="card" ${ ref(el) }>
		${ props.children }
	</s-card>
	`;
}) as Card;

Card.Header = Keystone<SubProps<Card['Header']>>(props => {
	return () => html`
	<s-card-header>
		${ props.text }
	</s-card-header>
	`;
});

Card.Body = Keystone<SubProps<Card['Body']>>(props => {
	return () => html`
	<s-card-body>
		${ props.text }
	</s-card-body>
	`;
});

Card.Footer = Keystone<SubProps<Card['Footer']>>(props => {
	return () => html`
	<s-card-footer>
		${ props.text }
	</s-card-footer>
	`;
});


@customElement('m-settings-page', true)
export class EditorPageCmp extends AegisElement {

	public static page = true;

	protected override createRenderRoot(): HTMLElement | DocumentFragment {
		return this;
	}

	protected override render(): unknown {
		return html`
		<Card>
			<Card.Header text="header goes here">
			</Card.Header>

			<Card.Body text="body goes here">
			</Card.Body>

			<Card.Footer text="footer goes here">
			</Card.Footer>
		</Card>
		`;
	}

}
