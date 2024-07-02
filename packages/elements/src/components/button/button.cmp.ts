import { customElement, MimicElement } from '@roenlie/lit-utilities/element';
import { sharedStyles } from '@roenlie/lit-utilities/styles';
import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { initializeStyleTokens } from '../../styles/token-styles.js';
import { MMRipple } from '../ripple/ripple-element.js';
import buttonStyles from './button.css' with { type: 'css' };

MMRipple.register();


declare global { interface HTMLElementTagNameMap {
	'mm-button': MMButton;
} }

export type ButtonType = [
	'',
	'icon'
][number];

export type ButtonSize = [
	'auto',
	'x-small',
	'small',
	'medium',
	'large',
	'x-large'
][number];

export type ButtonShape = [
	'sharp',
	'rounded',
	'pill'
][number];

export type ButtonVariant = [
	'primary',
	'variant',
	'secondary',
	'tertiary',
	'neutral',
	'error',
	'elevated',
	'warning',
	'success',
	'text',
	'outline'
][number];


@customElement('mm-button')
export class MMButton extends MimicElement {

	@property({ type: String }) public type: ButtonType = '';
	@property() public size: ButtonSize = 'medium';
	@property() public shape: ButtonShape = 'pill';
	@property() public variant: ButtonVariant = 'primary';
	@property({ type: Boolean, reflect: true }) public disabled?: boolean;

	public override render() {
		return html`
		<mm-ripple
			?disabled=${ this.disabled }
			class=${ classMap({
				[this.type]:    true,
				[this.size]:    true,
				[this.shape]:   true,
				[this.variant]: true,
			}) }
		>
			<button
				?disabled=${ !!this.disabled }
				part="button"
				class=${ classMap({
					base:           true,
					[this.type]:    true,
					[this.size]:    true,
					[this.shape]:   true,
					[this.variant]: true,
				}) }
			>
				<slot name="prefix"></slot>
				<slot></slot>
				<slot name="suffix"></slot>
			</button>
		</mm-ripple>
		`;
	}

	public static override styles = [
		sharedStyles,
		buttonStyles,
	];

}
