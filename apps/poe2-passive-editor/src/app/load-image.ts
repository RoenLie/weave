export const loadImage = (src: string): Promise<HTMLImageElement> => {
	const { promise, resolve } = Promise.withResolvers<HTMLImageElement>();

	const img = new Image();
	img.onload = () => {
		resolve(img);
	};
	img.src = src;

	return promise;
};
