export interface CustomElementManifest {
	schemaVersion: string;
	readme: string;
	modules: Modules[]
}

export interface Modules {
	kind: string;
	path: string;
	declarations: Declarations[];
	exports: any;
}

export interface Declarations {
	kind: string;
	description: string;
	name: string;
	cssProperties?: CssProperties[];
	cssParts?: CssParts[];
	slots?: Slots[];
	members?: Members[];
	attributes?: Attributes[];
	events?: Event[];
	dependencies?: Dependencies[];
	superclass?: Superclass;
	tagName?: string;
	customElement: boolean;
}

export interface CssProperties {
	description: string;
	name: string;
}

export interface CssParts {
	description: string;
	name: string;
}

export interface Slots {
	description: string;
	name: string;
}

export interface Members {
	kind: string;
	name: string;
	type?: { text: string; }
	privacy: 'public' | 'private' | 'protected';
	description?: string;
	attribute?: string;
	reflects?: boolean;
	default?: string;
}

export interface Attributes {
	name: string;
	description: string;
	fieldName: string;
	type?: { text: string; },
	default?: string;
}

export interface Event {
	name: string;
	description: string;
	type?: { text: string };
}

export interface Dependencies {
	name: string;
}

export interface Superclass {
	name: string;
	package: string;
}
