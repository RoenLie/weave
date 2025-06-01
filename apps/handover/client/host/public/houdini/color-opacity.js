class OpacityPainter {

	static get inputArguments() {
		return [ '<color>', '<number>' ];
	}

	paint(ctx, size, properties, args) {
		// Get arguments passed directly to paint()
		const color = args[0]?.toString() || '#000000';
		const opacity = parseFloat(args[1]?.toString()) || 1;

		//// Use color-mix to create the opacity effect
		const opacityPercentage = Math.round(opacity * 100);
		const mixedColor = `color-mix(in srgb, ${ color } ${ opacityPercentage }%, transparent)`;

		// Apply the color
		ctx.fillStyle = mixedColor;
		ctx.fillRect(0, 0, size.width, size.height);
	}

}

globalThis.registerPaint('opacity', OpacityPainter);
