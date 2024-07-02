import './login-form.cmp.ts';

import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

import { componentStyles } from '../../utilities/component-styles.ts';


@customElement('m-login-body')
export class LoginBody extends LitElement {

	protected override render() {
		return html`
		<section id="image-section">
			<img src="/login/images/bird.png">
		</section>

		<section id="form-section">
			<h1 id="title">
				Morph
			</h1>
			<h3 id="greeting">
				Welcome to Morph
			</h3>

			<m-login-form></m-login-form>
		</section>
		`;
	}

	public static override styles = [
		componentStyles,
		css`
		:host {
			overflow: hidden;
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		#image-section {
			overflow: hidden;
			display: grid;
			place-items: center;
			background-color: rgb(165 197 183);

			img {
				object-fit: contain;
				width: 30vw;
			}
		}
		#form-section {
			overflow: hidden;
			display: flex;
			flex-flow: column nowrap;
			align-items: center;
			justify-content: center;
			background-color: rgb(50 50 50);

			&>h1, h3 {
				justify-content: center;
			}
			&>h1 {
				font-family: 'Tilt Neon';
				align-items: center;
				color: rgb(245 245 245);
				padding-bottom: 10vh;
			}
			&>h3 {
				color: rgb(160 160 160);
				padding-bottom: 5vh;
			}
		}
		`,
	];

}
