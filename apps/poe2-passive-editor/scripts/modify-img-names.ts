import { readdirSync, renameSync } from 'node:fs';
import { join, resolve } from 'node:path';


// eslint-disable-next-line @typescript-eslint/no-unused-vars
const switchOrderOfIndex = () => {
	const images = readdirSync('./public/background/v3');
	const regexIndex = /(?<=-bg)\d*/;
	const regexReplace = /(?<=-bg)\d*/;
	images.sort((a, b) => {
		const aIndex = parseInt(a.match(regexIndex)![0]!);
		const bIndex = parseInt(b.match(regexIndex)![0]!);

		return bIndex - aIndex;
	}).reduceRight((acc, img, i) => {
		const prefix = join(resolve(), '/public/background/v3');
		const path = join(prefix, img);
		const newPath = path.replace(regexReplace, '' + (i + 1));

		renameSync(path, newPath);

		return acc;
	}, []);
};
//switchOrderOfIndex();
