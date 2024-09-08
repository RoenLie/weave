interface RGBA {
	r:     number;
	g:     number;
	b:     number;
	alpha: number;
};


const parseHex = (nakedHex: string): RGBA => {
	const isShort = nakedHex.length === 3 || nakedHex.length === 4;
	const twoDigitHexR = isShort ? ''.concat(nakedHex.slice(0, 1)).concat(nakedHex.slice(0, 1)) : nakedHex.slice(0, 2);
	const twoDigitHexG = isShort ? ''.concat(nakedHex.slice(1, 2)).concat(nakedHex.slice(1, 2)) : nakedHex.slice(2, 4);
	const twoDigitHexB = isShort ? ''.concat(nakedHex.slice(2, 3)).concat(nakedHex.slice(2, 3)) : nakedHex.slice(4, 6);
	const twoDigitHexA = (isShort ? ''.concat(nakedHex.slice(3, 4)).concat(nakedHex.slice(3, 4)) : nakedHex.slice(6, 8)) || 'ff'; // const numericA = +((parseInt(a, 16) / 255).toFixed(2));

	return {
		r:     parseInt(twoDigitHexR, 16),
		g:     parseInt(twoDigitHexG, 16),
		b:     parseInt(twoDigitHexB, 16),
		alpha: +(parseInt(twoDigitHexA, 16) / 255).toFixed(2),
	};
};


export const hexToRgba = function hexToRgba(hex: string) {
	const hashlessHex = hex.replace(/^#/, '');

	return parseHex(hashlessHex);
};
