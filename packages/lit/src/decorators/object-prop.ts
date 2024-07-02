import { deepEqual } from 'fast-equals';
import { type PropertyDeclaration } from 'lit';
import { property } from 'lit/decorators.js';


export const objectProp = (options: PropertyDeclaration): PropertyDecorator =>
	property({ type: Object, attribute: false, hasChanged: (v, o) => deepEqual(v, o), ...options });
