import { type IModule, Module } from '../../../models/modules-model.ts';


export async function updateModule(module: Module): Promise<undefined>;
export async function updateModule(module: Module, returnModule: boolean): Promise<Module>
export async function updateModule(
	module: Module,
	returnModule?: boolean,
) {
	const url = new URL('/api/modules/save', location.origin);
	if (returnModule)
		url.searchParams.set('returnModule', 'true');

	const response = await fetch(url, {
		method:  'post',
		headers: { 'Content-Type': 'Application/Json' },
		body:    module.toString(),
	});

	try {
		const result: IModule = await response.json();

		return Module.parse(result);
	}
	catch (error) { /*  */ }
}
