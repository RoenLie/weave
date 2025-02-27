export const getWorkerImageChunk = (() => {
	const rawGlob = import.meta.glob('../../../assets/background/v2/*.webp', { query: 'inline' });
	const files = Object.entries(rawGlob).sort((a, b) => {
		const aMatch = a[0].match(/(\d+)\.webp/)?.[1];
		const bMatch = b[0].match(/(\d+)\.webp/)?.[1];
		if (!aMatch || !bMatch)
			return 0;

		return parseInt(aMatch) - parseInt(bMatch);
	}).map(([ ,imp ]) => imp as () => Promise<{ default: string }>);

	return async (chunk: number) => {
		const imp = files[chunk];
		const imgData = await imp?.();
		if (!imgData)
			throw new Error('Invalid chunk');

		const blob = await (await fetch(imgData.default)).blob();
		const bitmap = await createImageBitmap(blob, {
			premultiplyAlpha:     'premultiply',
			colorSpaceConversion: 'none',
		});

		return bitmap;
	};
})();
