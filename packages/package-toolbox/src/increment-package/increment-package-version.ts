import { readFileSync, writeFileSync } from 'node:fs';


export const incrementPackageVersion = async () => {
	const packageJson = readFileSync('./package.json', { encoding: 'utf8' });
	const parsedPackage = JSON.parse(packageJson);
	const name = parsedPackage['name'];

	try {
		const npmFetch = await fetch('https://registry.npmjs.org/' + name + '/latest');
		const npmData = await npmFetch.json();
		const npmVersion: string = npmData.version;
		const splitVersion: (string | number)[] = npmVersion.split('.');
		splitVersion[2] = parseInt(splitVersion.at(-1)! as string) + 1;

		const newVersion = splitVersion.join('.');

		parsedPackage['version'] = newVersion;

		const stringified = JSON.stringify(parsedPackage, null, '\t');
		writeFileSync('./package.json', stringified);
	}
	catch (error) { /*  */ }
};
