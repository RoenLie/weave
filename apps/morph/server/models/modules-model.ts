import type { Optional } from './optional.js';


export interface IModule {
	module_id: number;
	code: string;
	name: string;
	namespace: string;
	description: string;
	active: 0 | 1;
}


export class Module implements IModule {

	public readonly module_id: number;
	public code: string;
	public name: string;
	public namespace: string;
	public description: string;
	public active: 0 | 1;

	private constructor(values: Optional<IModule, 'module_id'>) {
		if (values.module_id !== undefined)
			this.module_id = values.module_id;

		this.code = values.code;
		this.name = values.name;
		this.namespace = values.namespace;
		this.description = values.description;

		// In a form, a checkbox value is not sent if it is unchecked.
		// therefor we need to check if active is included or not.
		const active = values.active;
		this.active = active === 0 || active === 1 ? active
			: active === '0' || active === '1' ? (Number(active) as 1 | 0)
				: ('active' in values) ? 1 : 0;
	}

	public static parse(values: IModule) {
		return new Module(values);
	}

	public static initialize(values: Omit<IModule, 'module_id'>) {
		return new Module(values);
	}

	public toString() {
		return JSON.stringify({
			module_id:   this.module_id,
			namespace:   this.namespace,
			active:      this.active,
			name:        this.name,
			description: this.description,
			code:        this.code,
		} satisfies IModule);
	}

}
