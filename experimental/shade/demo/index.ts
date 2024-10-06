import '@roenlie/shade';
import { createElement, useStyles } from '@roenlie/shade';
import { css, html, render } from 'lit';


const tester = createElement('test1', () => {
	useStyles(css`
	:host {
		display: block;
		height: 200px;
		width: 200px;
		background-color: red;
	}
	`);

	return (params: { label: string }) => html`
	<div>
		Hello what is this???

		<slot></slot>
	</div>
	`;
});


render([
	tester({ label: 'Hello1' }),
	tester({ label: 'Hello2' }, {}, html`<div>Test</div>`),
], document.body);
