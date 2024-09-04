import { html } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

export const icons = {
	'square': (size: number | string) => `
	<svg xmlns="http://www.w3.org/2000/svg" width="${ size }" height="${ size }" fill="currentColor" class="bi bi-square" viewBox="0 0 16 16">
		<path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"/>
	</svg>
	`,
	'cursor': (size: number | string) => `
	<svg xmlns="http://www.w3.org/2000/svg" width="${ size }" height="${ size }" fill="currentColor" class="bi bi-cursor" viewBox="0 0 16 16">
  		<path d="M14.082 2.182a.5.5 0 0 1 .103.557L8.528 15.467a.5.5 0 0 1-.917-.007L5.57 10.694.803 8.652a.5.5 0 0 1-.006-.916l12.728-5.657a.5.5 0 0 1 .556.103zM2.25 8.184l3.897 1.67a.5.5 0 0 1 .262.263l1.67 3.897L12.743 3.52z"/>
	</svg>
	`,
};


export const icon = (name: keyof typeof icons, size: number | string = 20) => {
	return html`
	${ unsafeHTML(icons[name](size)) }
	`;
};
