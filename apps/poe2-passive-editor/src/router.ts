import { html } from 'lit-html';
import { css, CustomElement, signal, type CSSStyle } from './app/custom-element.ts';
import { Router } from '@sanguinejs/router';
import { browserLocalPersistence, getAuth, GoogleAuthProvider, setPersistence, signInWithPopup, type User } from 'firebase/auth';
import { when } from 'lit-html/directives/when.js';
import { app } from './app/firebase.ts';


export class RouterCmp extends CustomElement {

	static { this.register('poe-router'); }

	@signal protected accessor currentUser: User | undefined;

	protected routes = new Router(this, [
		{
			path:   '/',
			render: () => html``,
		},
		{
			path:  '/canvas-editor',
			enter: async () => {
				await import('./pages/canvas-editor/canvas-editor-page.ts');

				return true;
			},
			render: () => html`<poe-canvas-editor></poe-canvas-editor>`,
		},
	]);

	protected override connectedCallback(): void {
		super.connectedCallback();

		const auth = getAuth(app);
		auth.onAuthStateChanged(user => {
			if (user) {
				this.currentUser = user;
			}
			else {
				console.log('signed out');
				this.currentUser = undefined;
			}
		});
	}

	protected async login() {
		const auth = getAuth(app);
		await setPersistence(auth, browserLocalPersistence);

		const provider = new GoogleAuthProvider();
		const result = await signInWithPopup(auth, provider);

		this.currentUser = result.user;
	}

	protected async logout() {
		const auth = getAuth(app);
		await auth.signOut();
	}

	protected override render(): unknown {
		return html`
		<header>
			<nav>
				<a href="/">Home</a>
				<a href="/canvas-editor">Canvas Editor</a>
			</nav>

			${ when(this.currentUser, () => html`
			<button @click=${ this.logout }>
				Logout
			</button>
			`) }
		</header>
		${ when(
			!this.currentUser,
			() => html`
			<article>
				<login-button @click=${ this.login }>
					Login
				</login-button>
			</article>
			`,
			() => this.routes.outlet(),
			) }
		`;
	}

	public static override styles: CSSStyle = css`
		:host {
			display: grid;
			grid-template-rows: auto 1fr;
		}
		header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			height: 52px;
			background-color: #333;
			color: white;

			a {
				color: white;
				text-decoration: none;
				padding: 0 10px;
			}
		}
		article {
			display: grid;
			place-items: center;
			background-color: #334155;
		}
	`;

}


export class LoginBtnCmp extends CustomElement {

	static { this.register('login-button'); }

	protected override render(): unknown {
		return html`
		<s-base>
			<button class="button-67" role="button">
				<slot></slot>
			</button>
		</s-base>
		`;
	}

	public static override styles: CSSStyle = css`
		button { all: unset; }
		:host {
			display: block;
			color: #cfd7e2;
		}
		s-base {
			display: grid;
			place-items: center;
			height: 128px;
			width: 128px;
			background-color: #334155;
			border-radius: 32px;

			box-shadow: inset -1px -1px 0px 0px #252E3C,
						inset -2px -2px 2px 0px #2A3646,
						-1px -1px 0px 0px #334155,
						-2px -2px 2px 0px #222C39;
		}
		button {
			cursor: pointer;
			display: grid;
			place-items: center;
			height: 80px;
			width: 80px;
			border-radius: 24px;
			background-color: #334155;

			box-shadow: 8px 8px 16px 0px #263140,
						-8px -8px 16px 0px #394960;
		}
	`;

}
