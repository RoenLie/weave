import { LitElement, noChange, TemplateResult } from 'lit';
import { AsyncDirective } from 'lit/async-directive.js';
import { AttributePart, directive, DirectiveParameters, PartInfo, PartType } from 'lit/directive.js';

import { TooltipCmp, TooltipProperties } from './tooltip.cmp.js';

TooltipCmp;


export interface TooltipPart extends AttributePart {
	readonly element: LitElement & Record<string, any>;
}

export type TooltipRef = { value?: TooltipDirective };

export interface TooltipDirectiveOptions extends Partial<TooltipProperties> {
	[key: string]: any;
}


const tooltipInstance = document.createElement('pl-tooltip');

class TooltipDirective extends AsyncDirective {

	private _part: TooltipPart;
	private _content: string | TemplateResult = '';
	private _tooltipRef: TooltipCmp | undefined;

	constructor(part: PartInfo) {
		super(part);

		if (part.type !== PartType.ELEMENT)
			throw new Error('`tooltip()` can only be used as an element attribute');

		this._part = part as unknown as TooltipPart;
		this._tooltipRef = tooltipInstance;
	}

	public override update(part: TooltipPart, [ content ]: DirectiveParameters<this>) {
		this._part = part;
		this._part.element['tooltipDirective'] = this;
		this._content = content || this._part.element.title;

		this.disconnected();
		this.reconnected();

		return noChange;
	}

	protected handleFocusFn = async () => {
		this.initialize(tooltipInstance.handleBlur, tooltipInstance.handleFocus);
	};

	protected handleMouseOverFn = async () => {
		this.initialize(tooltipInstance.handleMouseOut, tooltipInstance.handleMouseEnter);
	};

	protected override reconnected() {
		this._part.element.addEventListener('focus', this.handleFocusFn);
		this._part.element.addEventListener('mouseover', this.handleMouseOverFn);
	}

	protected override disconnected() {
		this._part.element.removeEventListener('focus', this.handleFocusFn);
		this._part.element.removeEventListener('mouseover', this.handleMouseOverFn);
	}

	protected initialize = async (preFn: () => void, postFn: () => void) => {
		tooltipInstance.target = this._part.element;
		tooltipInstance.content = this._content;

		preFn();
		await tooltipInstance.transitioning;

		this._part.element.insertAdjacentElement('afterend', tooltipInstance);
		postFn();
	};

	public blockClosing = (val: boolean) => {
		if (!this._tooltipRef)
			return;

		this._tooltipRef.blockClosing = val;
	};

	public getContent = () => {
		return this._tooltipRef?.content;
	};

	public setContent = (content: string | TemplateResult) => {
		if (!this._tooltipRef)
			return;

		this._tooltipRef.content = content;
		this._tooltipRef.requestUpdate();
	};


	public render(_content: string | TemplateResult, _options?: TooltipDirectiveOptions) {
		return noChange;
	}

}


export const tooltip = directive(TooltipDirective);

/**
 * The type of the class that powers this directive. Necessary for naming the
 * directive's return type.
 */
export type { TooltipDirective };
