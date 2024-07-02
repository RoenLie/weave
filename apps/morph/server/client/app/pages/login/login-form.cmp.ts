import { css, html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import { componentStyles } from '../../utilities/component-styles.ts';
import type { LoginStore } from './login-store.ts';
import { requestOtp } from './request-otp.ts';


@customElement('m-login-form')
export class LoginForm extends LitElement {

	@property({ type: Object }) public store: LoginStore;
	@state() protected loginStage: 1 | 2 = 1;
	@query('form') protected formEl?: HTMLFormElement;
	protected validationErrors: string[] = [];

	public override connectedCallback(): void {
		super.connectedCallback();

		const urlQuery = new URLSearchParams(location.search);

		if (urlQuery.get('stage') === '2')
			this.loginStage = 2;
	}


	protected getFormData() {
		const data: Record<keyof any, any> = {};
		for (const [ key, value ] of new FormData(this.formEl))
			data[key] = value;

		return data;
	}

	protected onRequestCode(ev: Event) {
		ev.preventDefault();

		const formData = this.getFormData() as {username: string};
		requestOtp(formData.username);

		this.formEl?.reset();

		//this.loginStage = 2;

		//const url = new URL(location.href);
		//url.searchParams.set('stage', '2');

		//const newUrl = url.toString();
		//history.pushState({ path: newUrl }, '', newUrl);
	}

	protected onSubmitCode(ev: Event) {
		ev.preventDefault();
	}

	protected renderLoginPart1() {
		return html`
		<form @submit=${ this.onRequestCode }>
			<fieldset class="field">
				<legend>
					<label for="username">
						Username or Email
					</label>
				</legend>
				<input
					id="username"
					name="username"
					value=""
					required
					autofocus
				>
			</fieldset>

			<button>
				<h3>Sign in</h3>
			</button>

			<s-error-messages>
				${ this.validationErrors?.map(err => html`
					<s-error>
						${ err }
					</s-error>
				`) }
			</s-error-messages>
		</form>
		`;
	}

	protected renderLoginPart2() {
		return html`
		<form @submit=${ this.onSubmitCode }>
			<fieldset class="field">
				<legend>
					<label for="otp">
						Code
					</label>
				</legend>
				<input
					id="otp"
					name="otp"
					value=""
					type="password"
					required
					autofocus
				>
			</fieldset>

			<button>
				<h3>Submit</h3>
			</button>

			<s-error-messages>
				${ this.validationErrors?.map(err => html`
					<s-error>
						${ err }
					</s-error>
				`) }
			</s-error-messages>
		</form>
		`;
	}

	protected override render() {
		if (this.loginStage === 1)
			return this.renderLoginPart1();

		if (this.loginStage === 2)
			return this.renderLoginPart2();
	}

	public static override styles = [
		componentStyles,
		css`
		:host {
			display: grid;
			grid-auto-rows: max-content;
		}

		form {
			display: grid;
			grid-auto-rows: max-content;
			row-gap: 24px;
			width: clamp(100px, 30vw, 500px);

			fieldset.field {
				all: unset;
				display: block;
				padding-bottom: 4px;
				border-bottom: 1px solid rgb(160 160 160);

				legend {
					padding-bottom: 8px;
					padding-inline: 0px;
					font-size: 14px;
					color: rgb(160 160 160);
				}
				input {
					all: unset;
					font-size: 24px;
					width: 100%;
				}
				input:-webkit-autofill, input:-webkit-autofill:focus {
					box-shadow: 0 0 0 1000px hotpink inset;
					-webkit-text-fill-color: #333;
				}
			}
			s-error-messages {
				display: grid;
				grid-auto-rows: max-content;
				place-items: start center;
				font-size: 10px;
				color: red;
				height: 15vh;
			}
			div.forgot-password {
				display: flex;
				justify-content: end;

				a {
					font-size: 12px;
					color: rgb(119 154 98);
				}
			}
			div.create-account {
				place-self: center;

			}
			button {
				all: unset;
				cursor: pointer;
				place-self: center;
				display: grid;
				place-items: center;
				background-color: rgb(200 200 200);
				border-radius: 999px;
				height: 50px;
				padding-inline: 64px;

				h3 {
					color: rgb(0 0 0);
				}
			}
			button:hover {
				background-color: rgb(160 160 160);
			}
			button:focus-visible {
				outline: 4px solid rgb(240 240 240);
				outline-offset: -4px;
			}
		}
		s-create-account {
			display: block;
			place-self: start center;
			color: rgb(160 160 160);

			a {
				color: rgb(119 154 98);
				border-bottom: 2px solid rgb(119 154 98);
				padding-bottom: 4px;
			}
		}
		`,
	];

}
