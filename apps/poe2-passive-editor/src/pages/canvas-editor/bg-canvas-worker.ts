onmessage = (evt) => {
	const canvas: HTMLCanvasElement = evt.data.canvas;
	const context = canvas.getContext('2d')!;

	console.log(context);

	// Perform some drawing using the gl context
};
