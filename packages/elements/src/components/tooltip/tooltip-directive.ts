import { LitElement, noChange, type TemplateResult } from 'lit';
import { AsyncDirective } from 'lit/async-directive.js';
import { type AttributePart, directive, type DirectiveParameters, type PartInfo, PartType } from 'lit/directive.js';

import { MMTooltip, type TooltipProperties } from './tooltip-element.js';

MMTooltip.register();


export interface TooltipPart extends AttributePart {
	readonly element: LitElement & Record<string, any>;
}

export interface TooltipRef { value?: TooltipDirective }

export interface TooltipDirectiveOptions extends Partial<TooltipProperties>, Record<string, any> {}


const tooltipInstance = document.createElement(MMTooltip.tagName) as MMTooltip;


class TooltipDirective extends AsyncDirective {

	private _part: TooltipPart;
	private _content: string | TemplateResult | unknown = '';
	private _options?: TooltipDirectiveOptions;
	private _tooltipRef: MMTooltip | undefined;

	constructor(part: PartInfo) {
		super(part);

		if (part.type !== PartType.ELEMENT)
			throw new Error('`tooltip()` can only be used as an element attribute');

		this._part = part as unknown as TooltipPart;
		this._tooltipRef = tooltipInstance;
	}

	public override update(part: TooltipPart, [ content, options ]: DirectiveParameters<this>) {
		this._part = part;
		this._part.element['tooltipDirective'] = this;
		this._content = content || this._part.element.title;
		this._options = options;

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
		for (const prop in this._options)
			(tooltipInstance as Record<keyof any, any>)[prop] = this._options[prop];

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


	public render(_content: string | TemplateResult | unknown, _options?: TooltipDirectiveOptions) {
		return noChange;
	}

}


export const tooltip = directive(TooltipDirective);

/**
 * The type of the class that powers this directive. Necessary for naming the
 * directive's return type.
 */
export type { TooltipDirective };
