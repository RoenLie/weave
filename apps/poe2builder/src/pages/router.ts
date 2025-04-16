import { Router } from '@roenlie/custom-element/router';
import { css, type CSSStyle, CustomElement, state } from '@roenlie/custom-element/signal';
import type { UserResponse } from '@supabase/supabase-js';
import { browserLocalPersistence, getAuth, GoogleAuthProvider, setPersistence, signInWithPopup, type User } from 'firebase/auth';
import { html } from 'lit-html';
import { when } from 'lit-html/directives/when.js';

import { app } from '../app/firebase.ts';
import { supabase } from '../app/supabase.ts';


export class RouterCmp extends CustomElement {

	static { this.register('poe-router'); }

	@state() protected accessor currentUser: User | undefined;
	@state() protected accessor currentUser2: UserResponse | undefined;
	@state() protected accessor requiresLogin: boolean = false;

	protected routes = new Router(this, [
		{
			path:  '/',
			enter: async () => {
				this.requiresLogin = false;

				history.replaceState(undefined, '', '/canvas-reader');
				dispatchEvent(new PopStateEvent('popstate'));

				return false;
			},
			render: () => html``,
		},
		{
			path:  '/canvas-reader',
			enter: async () => {
				this.requiresLogin = false;
				await import('./canvas-editor/canvas-reader-page.ts');

				return true;
			},
			render: () => html`<poe-canvas-reader></poe-canvas-reader>`,
		},
		{
			path:  '/canvas-editor',
			enter: async () => {
				this.requiresLogin = true;
				await import('./canvas-editor/canvas-editor-page.ts');

				return true;
			},
			render: () => html`<poe-canvas-editor></poe-canvas-editor>`,
		},
		{
			path:  '/node-catalog',
			enter: async () => {
				this.requiresLogin = true;
				await import('./node-catalog/node-catalog-page.ts');

				return true;
			},
			render: () => html`<poe-node-catalog></poe-node-catalog>`,
		},
	]);

	protected override connectedCallback(): void {
		super.connectedCallback();

		this.initialize();
	}

	protected async initialize(): Promise<void> {
		this.currentUser2 = await supabase.auth.getUser();

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

	protected async login(): Promise<void> {
		const auth = getAuth(app);
		await setPersistence(auth, browserLocalPersistence);

		const provider = new GoogleAuthProvider();
		await signInWithPopup(auth, provider);

		location.reload();
	}

	protected async logout(): Promise<void> {
		const auth = getAuth(app);
		await auth.signOut();
	}

	protected override render(): unknown {
		return html`
		<header>
			<nav>
				<a href="/">Home</a>
				<a href="/canvas-reader">Canvas Reader</a>
				<a href="/canvas-editor">Canvas Editor</a>
				<a href="/node-catalog">Node Catalog</a>
			</nav>

			${ when(this.currentUser, () => html`
			<login-button @click=${ this.logout }>
				Logout
			</login-button>
			`) }
		</header>
		${ when(
			this.requiresLogin && !this.currentUser,
			() => html`
			<article>
				<login-button .useBase=${ true } @click=${ this.login }>
					Login
				</login-button>
			</article>
			`,
			() => this.routes.outlet(),
			) }
		`;
	}

	static override styles: CSSStyle = css`
		:host {
			display: grid;
			grid-template-rows: auto 1fr;
			background-color: #334155;
		}
		header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			height: 64px;
			padding-inline: 12px;
			color: white;
			contain: strict;
			border-bottom: 1px solid #263140;

			a {
				color: white;
				text-decoration: none;
				padding: 0 10px;
			}
		}
		article {
			display: grid;
			place-items: center;
		}
	`;

}


export class LoginBtnCmp extends CustomElement {

	static { this.register('login-button'); }

	@state() accessor useBase: boolean = false;

	protected override render(): unknown {
		if (this.useBase) {
			return html`
			<s-base>
				<button>
					<slot></slot>
				</button>
			</s-base>
			`;
		}

		return html`
		<button>
			<slot></slot>
		</button>
		`;
	}

	static override styles: CSSStyle = css`
		button { all: unset; }
		:host {
			display: block;
			color: #cfd7e2;

			--border-radius: 12px;
			--base-padding: 14px;
			--background: #334155;
		}
		s-base {
			display: grid;
			place-items: center;
			padding: var(--base-padding);
			background-color: var(--background);
			border-radius: calc(var(--base-padding) + var(--border-radius));

			box-shadow: inset -1px -1px 0px 0px #252E3C,
						inset -2px -2px 2px 0px #2A3646,
						-1px -1px 0px 0px #334155,
						-2px -2px 2px 0px #222C39;
		}
		button {
			cursor: pointer;
			display: grid;
			place-items: center;
			height: 44px;
			padding-inline: 12px;
			border-radius: var(--border-radius);
			background-color: var(--background);

			--sh-x: 7px;
			--sh-y: 7px;
			--sh-neg-x: calc(var(--sh-x) * -1);
			--sh-neg-y: calc(var(--sh-y) * -1);

			--sh-blur: 14px;
			--sh-spread: 0px;
			--sh-color1: #263140;
			--sh-color2: #394960;

			--outset-empty: 0px 0px 0px 0px transparent;
			--inset-empty: inset 0px 0px 0px 0px transparent;

			--outset-shadow1: var(--sh-x)     var(--sh-y)     var(--sh-blur) var(--sh-spread) var(--sh-color1);
			--outset-shadow2: var(--sh-neg-x) var(--sh-neg-y) var(--sh-blur) var(--sh-spread) var(--sh-color2);
			--inset-shadow1: var(--inset-empty);
			--inset-shadow2: var(--inset-empty);

			transition: box-shadow 0.1s ease-out;
			box-shadow: var(--outset-shadow1),
							var(--outset-shadow2),
							var(--inset-shadow1),
							var(--inset-shadow2);
		}
		button:focus-visible {
			border: 1px solid orange;
		}
		@media (hover: hover) {
			button:hover {
				--sh-spread: 6px;
			}
			button:active, button:focus-within:not(:focus-visible) {
				--sh-spread: 0px;
				--outset-shadow1: var(--outset-empty);
				--outset-shadow2: var(--outset-empty);
				--inset-shadow1: inset var(--sh-x)     var(--sh-y)     var(--sh-blur) var(--sh-spread) var(--sh-color1);
				--inset-shadow2: inset var(--sh-neg-x) var(--sh-neg-y) var(--sh-blur) var(--sh-spread) var(--sh-color2);
			}
		}
	`;

}
