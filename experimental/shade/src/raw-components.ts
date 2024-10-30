import { css, noChange, type ChildPart, type CSSResultGroup, type ElementPart } from 'lit';
import { directive, Directive,  type PartInfo } from 'lit/directive.js';
import { html } from './html.ts';


const commentTag = '?shade:' as const;


type CreateComponent = (
	root: (strings: TemplateStringsArray, ...values: unknown[]) => unknown,
	css: (strings: TemplateStringsArray, ...values: (CSSResultGroup | number)[]) => void
) => (props: any) => unknown;


export class Component {

	static #html = (id: string) => (
		strings: TemplateStringsArray,
		...values: unknown[]
	): unknown => refDir(id)(html(strings, ...values));

	static #css = (id: string) => (
		strings: TemplateStringsArray,
		...values: (CSSResultGroup | number)[]
	): void => {
		const cssResult = css(strings, ...values);

		const style = document.createElement('style');
		style.innerHTML = cssResult.cssText
			.replaceAll(/\.[\w-]+/g, str => (str + '-' + id).trim());

		document.head.append(style);
	};

	public static create<T extends CreateComponent>(fn: T) {
		const id = (Math.random() * 100).toString(16).slice(3);

		return fn(this.#html(id), this.#css(id)) as ReturnType<T>;
	}

}


const refDir = (id: string) => directive(class extends Directive {

	constructor(partInfo: PartInfo) {
		super(partInfo);
		this.#part = partInfo as ChildPart;
	}

	#part: ChildPart;

	public commentRef: WeakRef<Comment> | undefined = undefined;
	public override render(template: unknown): unknown {
		queueMicrotask(() => {
			let el: Element | Node | undefined | null = this.#part.startNode;
			while (el && !(el instanceof Element))
				el = el.nextSibling;

			if (el) {
				el.insertAdjacentHTML('beforebegin', '<!--' + commentTag + id + '-->');
				if (el.previousSibling instanceof Comment)
					this.commentRef = new WeakRef(el.previousSibling);
			}
		});

		return template;
	}

});


export const classes = directive(class extends Directive {

	constructor(partInfo: PartInfo) {
		super(partInfo);
		this.#part = partInfo as ElementPart;
	}

	#part: ElementPart;

	public override render(...classes: unknown[]): unknown {
		queueMicrotask(() => {
			const possibleNode = getCommentNode(this.#part.element);
			if (!possibleNode)
				return console.warn('Could not find reference comment node');

			const id = possibleNode.textContent
				?.replace(commentTag, '').trim();

			this.#part.element.classList.value = '';

			classes.forEach(cls => {
				this.#part.element.classList.add(cls + '-' + id);
			});
		});

		return noChange;
	}

});


const getCommentNode = (startNode: Node) => {
	let possibleNode: Node | null | undefined = startNode;

	while (possibleNode) {
		if (possibleNode.nodeType === possibleNode.COMMENT_NODE) {
			if (possibleNode.textContent?.includes(commentTag))
				break;
		}

		if (possibleNode.nodeType === possibleNode.TEXT_NODE) {
			possibleNode = possibleNode.previousSibling
				?? possibleNode.parentNode;

			continue;
		}

		if (possibleNode.previousSibling) {
			possibleNode = possibleNode.previousSibling;

			continue;
		}

		possibleNode = possibleNode.parentNode?.previousSibling;
	}

	return possibleNode;
};
