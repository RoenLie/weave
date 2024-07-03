import { maybe } from '@roenlie/core/async';

import { type IModule, Module } from '../../../models/modules-model.ts';


export async function insertModule(module: Module): Promise<undefined>;
export async function insertModule(module: Module, returnModule: boolean): Promise<Module>
export async function insertModule(
	module: Module,
	returnModule?: boolean,
) {
	const url = new URL('/api/modules/insert', location.origin);
	if (returnModule)
		url.searchParams.set('returnModule', 'true');

	const [ response ] = await maybe(fetch(url, {
		method:  'post',
		headers: { 'Content-Type': 'Application/Json' },
		body:    module.toString(),
	}));

	if (!response)
		return;

	if (response.status === 200) {
		const result: IModule = await response.json();

		return Module.parse(result);
	}
	else {
		console.error(response.status, response.statusText);
	}
}
