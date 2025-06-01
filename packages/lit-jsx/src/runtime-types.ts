import type { CompiledTemplate, ElementPart, TemplateResult } from 'lit-html';
import type { AttributePart, BooleanAttributePart, ChildPart, EventPart, PropertyPart } from 'lit-html';


export type Config = {
	children:  JSX.JSXElement;
	ref:       JSX.CustomAttributes<any>['ref'];
	style:     JSX.HTMLAttributes<any>['style'];
	classList: JSX.CustomAttributes<any>['classList'];
} & Record<string, any>;


export type JSXType =
| string
| typeof HTMLElement & { tagName?: string; }
| ((config: Config) => JSX.JSXElement[]);


export interface LitPartConstructors {
	AttributePart: typeof AttributePart;
	PropertyPart:  typeof PropertyPart;
	BooleanPart:   typeof BooleanAttributePart;
	EventPart:     typeof EventPart;
	ChildPart:     typeof ChildPart;
	ElementPart:   typeof ElementPart;
}


export interface FakeTemplateStringsArray extends Array<string> { raw: readonly string[]; }


export interface FakeTemplateResult extends TemplateResult {
	strings: FakeTemplateStringsArray;
}


export interface FakeCompiledTemplate extends CompiledTemplate {
	el?: HTMLTemplateElement;
	h:   FakeTemplateStringsArray;
}


export interface FakeCompiledTemplateResult {
	['_$litType$']: FakeCompiledTemplate;
	values:         unknown[];
}
