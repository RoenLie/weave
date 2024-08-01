import './lit-html-shim.ts';

import type { ScopeHierarchy } from '../app.types.ts';
import { appComponentDecorator } from '../elements/app-component.ts';
import type { AppComponentOptions } from '../elements/types.ts';


/**
 * Creates the decorators used to augment the framework classes.
 */
export class AegisFactory<T extends object> {

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	constructor(scopeHierarchy: T) { }

	public createDecorator<TScopes extends ScopeHierarchy<T>>() {
		return (options: AppComponentOptions<TScopes>) => appComponentDecorator(options);
	}

}
