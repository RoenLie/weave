import { html, render } from 'lit';
import 'root/root.cmp.ts';


window.addEventListener('message', (ev) => {
	console.log(ev);

	const style = ev.data.details.style;

	const rect = document.createElement('div');
	Object.assign(rect.style, style);

	document.body.append(rect);
});

window.addEventListener('click', (ev) => {
	window.top?.postMessage({
		type: 'click',
		x:    ev.x,
		y:    ev.y,
		path: ev.composedPath()
			.filter(tar => tar instanceof HTMLElement)
			.map(tar => {
				return {
					id:    tar.id,
					tag:   tar.localName,
					class: tar.classList.toString(),
				};
			}),
	});
});

render(html`<b-root></b-root>`, document.body);
