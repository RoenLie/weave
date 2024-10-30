import { render } from 'lit';
import { classes, Component } from '../src/raw-components.ts';
import { Signal, signal } from '@preact/signals-core';


const app = Component.create((raw, css) => () => {
	css`
	body {
		margin: 0px;
		height: 100vh;
		display: grid;
		background-color: rgb(30 30 30);
		color: white;
	}
	main {
		display: grid;
		grid-template-columns: max-content auto;
	}
	`;

	const activePage = signal<'home' | 'settings'>('home');
	const page = signal<unknown>(homePage());
	const availablePages = signal([ 'home', 'settings' ]);
	const setPage = (input: 'home' | 'settings') => {
		if (activePage.value === input)
			return;

		activePage.value = input;
		page.value = input === 'home' ? homePage() : settingsPage();
	};

	return raw`
	<main>
		${ aside({ activePage, availablePages, setPage }) }
		<section>
			${ page }
		</section>
	</main>
	`;
});


const aside = Component.create((raw, css) => (props: {
	activePage:     Signal<'home' | 'settings'>,
	availablePages: Signal<string[]>,
	setPage:        (input: 'home' | 'settings') => void
}) => {
	css`
	.aside {
		display: flex;
		flex-flow: column nowrap;
		background-color: rebeccapurple;
		width: 80px;
	}
	`;

	const { activePage, setPage } = props;

	return raw`
	<aside ${ classes('aside') }>
		<button @click=${ () => setPage('home') }>1</button>
		<button @click=${ () => setPage('settings') }>2</button>
	</aside>
	`;
});


const homePage = Component.create((raw) => () => {
	return raw`
	Home
	`;
});

const settingsPage = Component.create((raw) => () => {
	return raw`
	Settings
	`;
});


render(app(), document.body);
