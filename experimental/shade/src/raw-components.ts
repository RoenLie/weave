import { _$LH, css, noChange, type ChildPart, type CSSResultGroup, type ElementPart } from 'lit';
import { directive, Directive,  type PartInfo } from 'lit/directive.js';
import { html } from './html.ts';


const commentTag = '?shade:' as const;


const _html = (id: string) => (
	strings: TemplateStringsArray,
	...values: unknown[]
) => refDir(id)(html(strings, ...values));


const _css = (id: string) => (
	strings: TemplateStringsArray,
	...values: (CSSResultGroup | number)[]
) => {
	const cssResult = css(strings, ...values);

	const style = document.createElement('style');
	style.innerHTML = cssResult.cssText
		.replaceAll(/\.[\w-]+/g, str => (str + '-' + id).trim());

	document.head.append(style);

	return;
};


export const component = <T>(
	create: (
		root: ReturnType<typeof _html>,
		css: ReturnType<typeof _css>
	) => (props?: T) => unknown,
): (props?: T) => unknown => {
	const id = (Math.random() * 100).toString(16).slice(3);

	return create(_html(id), _css(id));
};


const refDir = (id: string) => directive(class extends Directive {

	#part: ChildPart;
	constructor(partInfo: PartInfo) {
		super(partInfo);
		this.#part = partInfo as ChildPart;
	}

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

	#part: ElementPart;
	constructor(partInfo: PartInfo) {
		super(partInfo);
		this.#part = partInfo as ElementPart;
	}

	public override render(...props: unknown[]): unknown {
		queueMicrotask(() => {
			const possibleNode = getCommentNode(this.#part.element);
			if (!possibleNode)
				return console.warn('Could not find reference comment node');

			const id = possibleNode.textContent
				?.replace(commentTag, '').trim();

			props.forEach(prop => {
				this.#part.element.classList.add(prop + '-' + id);
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
