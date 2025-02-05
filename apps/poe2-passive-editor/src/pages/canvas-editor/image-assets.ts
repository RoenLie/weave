import { loadImage } from '../../app/load-image.ts';

export const smallNeutralAttr = await (async () => {
	const imgData = await import('../../assets/small-neutral-attr.webp?inline');

	return await loadImage(imgData.default);
})();
