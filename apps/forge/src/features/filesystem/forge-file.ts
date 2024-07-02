import { enumerable, MSchema } from './mimic-db.js';


export const ForgeFileDB = 'forge-filesystem' as const;

export class ForgeFile extends MSchema {

	public static override dbIdentifier = 'files';
	public static override dbKey = 'id';

	public id = crypto.randomUUID();
	public type: 'component' | 'script';
	public project: string;
	public directory: string;
	public name: string;
	public extension: string;
	public content: string;
	public importAlias: string;
	public importUri: string;
	public accessor editingName = false;

	@enumerable() public get path() {
		return (this.directory + '/' + this.name + this.extension)
			.replaceAll(/\/+/g, '/');
	}

}
