import { render } from 'lit';
import { classes, component } from '../src/raw-components.ts';
import { html } from '../src/html.ts';
import { Signal, signal } from '@preact/signals-core';
import { when } from 'lit/directives/when.js';


const app = component((raw, css) => {
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

	const activeBtn = signal(1);

	return () => raw`
	<main>
		${ aside(activeBtn) }
		${ section(activeBtn) }
	</main>
	`;
});


const aside = component((raw, css) => {
	css`
	.aside {
		display: flex;
		flex-flow: column nowrap;
		background-color: rebeccapurple;
		width: 80px;
	}
	`;

	return (activeBtnSig?: Signal<any>) => raw`
	<aside ${ classes('aside') }>
		<button @click=${ () => activeBtnSig!.value = 1 }>1</button>
		<button @click=${ () => activeBtnSig!.value = 2 }>2</button>
		<button>3</button>
	</aside>
	`;
});


const section = component((raw, css) => {
	return (activeBtnSig?: Signal<any>) => raw`
	<section>
		${ activeBtnSig }
	</section>
	`;
});

render(app(), document.body);
