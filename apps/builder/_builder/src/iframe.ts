import { html, render } from 'lit';
import 'root/root.cmp.ts';


window.addEventListener('click', (ev) => {
	window.top?.postMessage({
		type: 'click',
		x:    ev.x,
		y:    ev.y,
		path: ev.composedPath()
			.filter(tar => tar instanceof HTMLElement)
			.map(tar => {
				return {
					type:  tar.nodeName,
					id:    tar.id,
					tag:   tar.localName,
					class: tar.classList.toString(),
				};
			}),
	});
});

render(html`<b-root></b-root>`, document.body);
