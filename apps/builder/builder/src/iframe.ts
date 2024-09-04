console.log('hei');


const componentTree: any[] = [];


window.addEventListener('message', (ev) => {
	console.log(ev);

	const style = ev.data.details.style;

	const rect = document.createElement('div');
	Object.assign(rect.style, style);

	document.body.append(rect);
});

window.addEventListener('click', (ev) => {
	window.top?.postMessage({
		type:    'click',
		details: {
			x: ev.x,
			y: ev.y,
		},
	});
});
