import { Endpoint, method } from '../app/endpoint.ts';
import { t } from 'tar';
import { mkdir, rm } from 'node:fs/promises';
import { createPkgDepBuckets, createPkgNodeTree, insertPackageContents } from '../services/package-service.ts';
import pacote from 'pacote';
import { paths } from '../app/paths.ts';
import { join as posixJoin, dirname as posixDirname } from 'node:path/posix';


@method.get('/api/package/*')
export class GetPackage extends Endpoint {

	protected override handle() {
		console.log('get package');
	}

}

@method.get('/api/package/install')
export class InstallPackage extends Endpoint {

	protected override async handle() {
		const { name, version = 'latest' } = this.request.query as {
			name?:    string;
			version?: string;
		};

		if (!name)
			return this.response.sendStatus(404);

		const nodeTree = await createPkgNodeTree(name, version);
		const buckets = createPkgDepBuckets(nodeTree);

		const depLineage = buckets.reduceRight((acc, cur) => {
			cur.forEach(dep => acc.add(dep));

			return acc;
		}, new Set<string>());

		for (const spec of depLineage) {
			const splitSpec = spec.split('@');
			const name = splitSpec.slice(0, -1).join('@');
			const version = splitSpec.at(-1)!;

			const dirPath = posixJoin(paths.cache, 'packages');
			const fileName = spec.replaceAll('/', '_');
			const filePath = posixJoin(dirPath, fileName + '.tgz');

			console.log('Downloading and extracking package', {
				dirPath, fileName, filePath, name, version,
			});

			try {
				await mkdir(dirPath, { recursive: true });
				await pacote.tarball.file(spec, filePath);

				const files: Promise<{ path: string; content: string; }>[] = [];

				await t({
					file: filePath,
					async onReadEntry(entry) {
						if (entry.path.endsWith('/'))
							return;

						files.push(entry.collect().then(([ buffer ]) => {
							return {
								path:    entry.path,
								content: buffer?.toString() ?? '',
							};
						}));
					},
				});

				const resolvedFiles = await Promise.all(files);
				const pkgJsonPath = resolvedFiles.find(file => file.path.endsWith('package.json'))?.path;
				if (pkgJsonPath) {
					const pathPrefix = posixDirname(pkgJsonPath);
					resolvedFiles.forEach(file => {
						file.path = file.path.replace(pathPrefix, '');
					});

					insertPackageContents(name, version, resolvedFiles);
				}
				else {
					console.error(
						'Skipping insertion of',
						name, version,
						'Could not find package.json.',
						'Possible malformed package?',
					);
				}

				// Remove extracted files and the uploaded file.
				await rm(filePath);
			}
			catch (err) {
				console.error(err);

				return this.response.sendStatus(500);
			}
		}

		return this.response.send([ ...depLineage ]);
	}

}


export default [
	GetPackage,
	InstallPackage,
];
