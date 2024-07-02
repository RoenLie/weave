import { type ElementPart, LitElement, nothing, type TemplateResult } from 'lit';
import { AsyncDirective } from 'lit/async-directive.js';
import { customElement } from 'lit/decorators/custom-element.js';
import { property } from 'lit/decorators/property.js';
import { directive, type DirectiveParameters, type PartInfo, PartType } from 'lit/directive.js';


@customElement('mm-portal')
export class PortalElement extends LitElement {

	@property({ type: Object }) public renderTemplate: TemplateResult;

	protected override render() {
		return this.renderTemplate;
	}

}


class PortalDirective extends AsyncDirective {

	public targetElement?: HTMLElement;
	public portalElement?: PortalElement;

	constructor(partInfo: PartInfo) {
		super(partInfo);

		if (partInfo.type !== PartType.ELEMENT) {
			throw new Error(
				'`PortalDirective` can only be used inside an elements slot.',
			);
		}
	}

	public override update(
		part: ElementPart, [ targetElement, templateToRender ]: DirectiveParameters<this>,
	) {
		if (!this.isConnected)
			return this.render(targetElement, templateToRender);

		if (this.portalElement && this.targetElement !== targetElement) {
			// targetElement has changed - transplant the portalElement
			this.portalElement.remove();
			targetElement.appendChild(this.portalElement);
		}

		this.targetElement = targetElement;

		if (!this.portalElement) {
			this.portalElement = document.createElement('mm-portal') as PortalElement;
			targetElement?.appendChild(this.portalElement);
		}

		this.portalElement.renderTemplate = templateToRender;

		return this.render(targetElement, templateToRender);
	}

	protected override disconnected() {
		// Remove rendered template from targetNode
		this.portalElement?.remove();
		this.portalElement = undefined;
		this.targetElement = undefined;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public render(targetElement: HTMLElement, templateToRender: TemplateResult) {
		return nothing;
	}

}


/**
 */
export const portal = directive(PortalDirective);


/**
 * The type of the class that powers this directive. Necessary for naming the
 * directive's return type.
 */
export type { PortalDirective };
