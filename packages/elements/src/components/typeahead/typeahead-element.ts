import { emitEvent, type EventOf } from '@roenlie/core/dom';
import { Enum, type InferEnum } from '@roenlie/core/enum';
import { invariant } from '@roenlie/core/validation';
import { PopoutController } from '@roenlie/lit-utilities/controllers';
import { customElement, MimicElement } from '@roenlie/lit-utilities/element';
import { sharedStyles } from '@roenlie/lit-utilities/styles';
import { css, html } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';
import { createRef, type Ref, ref } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';
import { when } from 'lit/directives/when.js';

import { systemIcons } from '../../utilities/system-icons.js';
import { MMButton } from '../button/button.cmp.js';
import { MMIcon } from '../icon/icon-element.js';
import { MMInput } from '../input/input.cmp.js';

MMIcon.register();
MMInput.register();
MMButton.register();


declare global { interface HTMLElementTagNameMap {
	'mm-typeahead': MMTypeahead
	'mm-typeahead-item': MMTypeaheadItem
} }


export type TypeaheadEvents = InferEnum<typeof typeaheadEvents>;
export const typeaheadEvents = Enum('mm-clear', 'mm-select-item');


function scrollParentToChild(parent: HTMLElement, child: HTMLElement) {
	// Where is the parent on page
	const parentRect = parent.getBoundingClientRect();
	// What can you see?
	const parentViewableArea = {
		height: parent.clientHeight,
		width:  parent.clientWidth,
	};

	// Where is the child
	const childRect = child.getBoundingClientRect();
	// Is the child viewable?
	const isViewable = (childRect.top >= parentRect.top)
		&& (childRect.bottom <= parentRect.top + parentViewableArea.height);

	// if you can't see the child try to scroll parent
	if (!isViewable) {
		// Should we scroll using top or bottom? Find the smaller ABS adjustment
		const scrollTop = childRect.top - parentRect.top;
		const scrollBot = childRect.bottom - parentRect.bottom;
		if (Math.abs(scrollTop) < Math.abs(scrollBot)) {
			// we're near the top of the list
			parent.scrollTop += scrollTop;
		}
		else {
			// we're near the bottom of the list
			parent.scrollTop += scrollBot;
		}
	}
}


/**
 * @fires open  --fired when typeahead popout has opened.
 * @fires close --fired when typeahead popout has closed.
 */
@customElement('mm-typeahead')
export class MMTypeahead extends MimicElement {

	@property() public name?: string;
	@property() public value?: string;
	@property() public height?: string;
	@property() public label?: string;
	@property() public placeholder?: string;
	@property({ type: Boolean }) public disabled?: boolean;
	@property({ type: Boolean }) public openOnFocus?: boolean;
	@property({ type: Boolean }) public openOnInput?: boolean;
	@property({ type: Boolean }) public openOnClick?: boolean;
	@property({ type: Boolean }) public closeOnSelect?: boolean;
	@property({ type: Boolean }) public immediateFocus?: boolean;
	@property({ type: Boolean }) public openImmediately?: boolean;
	@property({ type: Boolean }) public showClearWhenDisabled?: boolean;
	@state() public open = false;
	@query('slot') protected slotEl?: HTMLSlotElement;
	@query('mm-input') protected inputEl?: MMInput;
	@query('input-container') protected inputWrapperEl?: HTMLElement;
	protected popoutEl: Ref<HTMLDivElement> = createRef();
	protected popoutListEl: Ref<HTMLOListElement> = createRef();
	public activeEl?: MMTypeaheadItem;
	protected resizeObs = new ResizeObserver(() => this.requestUpdate());
	protected popoutCtrl = new PopoutController({
		host:      this,
		reference: () => this.inputEl,
		floating:  () => this.popoutEl.value,
		onUpdate:  () => {
			const inputRect = this.inputEl?.getBoundingClientRect();
			if (!inputRect)
				return;

			const point = this.shadowRoot?.elementsFromPoint(
				inputRect.x + (inputRect.width / 2),
				inputRect.y + (inputRect.height / 2),
			);

			if (!point?.includes(this))
				this.open = false;
		},
	});

	protected override afterConnectedCallback(): void {
		invariant(this.inputEl);

		this.resizeObs.observe(this.inputEl);

		if (this.openImmediately)
			requestAnimationFrame(() => this.open = true);

		if (this.immediateFocus)
			requestAnimationFrame(() => this.inputEl!.focus());
	}

	protected override updated(props: Map<PropertyKey, unknown>): void {
		super.updated(props);

		if (props.has('open')) {
			if (this.open) {
				this.popoutCtrl.startPositioner();

				if (props.get('open') === false)
					emitEvent(this, 'open');
			}
			else {
				this.popoutCtrl.stopPositioner();

				if (props.get('open') === true)
					emitEvent(this, 'close');
			}
		}
	}

	public override focus(options?: FocusOptions): void {
		if (this.disabled && this.showClearWhenDisabled) {
			const buttonEl = this.renderRoot.querySelector<HTMLButtonElement>(
				'input-container button',
			);

			buttonEl?.focus({ preventScroll: true, ...options });
		}
		else {
			this.inputEl?.focus({ preventScroll: true, ...options });
		}
	}

	protected focusItem(item?: MMTypeaheadItem) {
		if (!(item instanceof MMTypeaheadItem))
			throw new Error('Invalid element type.');

		this.querySelectorAll('*').forEach((el) =>
			el instanceof MMTypeaheadItem
				? el.classList.toggle('active', false)
				: undefined);

		this.activeEl = item;
		this.activeEl?.classList.toggle('active', true);
	}

	protected selectItem(item: MMTypeaheadItem) {
		this.inputEl?.focus();
		emitEvent(item, typeaheadEvents.mmSelectItem);

		if (this.closeOnSelect)
			this.open = false;
	}

	protected handleInput(ev: EventOf<HTMLInputElement>) {
		if (!this.open && this.openOnInput)
			this.open = true;

		this.value = ev.target.value;
	}

	protected handleClick() {
		if (!this.open && this.openOnClick)
			this.open = true;
	}

	protected handleFocus() {
		if (!this.open && this.openOnFocus)
			this.open = true;
	}

	protected handleBlur() {
		//this.open = false;
	}

	protected async handleInputKeydown(ev: KeyboardEvent) {
		if (ev.code === 'ArrowUp' || ev.code === 'ArrowDown') {
			ev.preventDefault();

			const wasClosed = !this.open;
			if (!this.open) {
				this.open = true;
				await this.updateComplete;
			}

			if (!this.activeEl) {
				this.activeEl = this.slotEl?.assignedElements().at(0) as
					| MMTypeaheadItem
					| undefined;
			}

			if (this.activeEl) {
				const nextEl =
					ev.code === 'ArrowUp'
						? this.activeEl.previousElementSibling
						: this.activeEl.nextElementSibling;

				if (!wasClosed && nextEl instanceof MMTypeaheadItem)
					this.focusItem(nextEl);

				this.activeEl.scrollIntoView({ block: 'nearest' });
			}
		}

		if (ev.key === 'Enter') {
			const slot = this.activeEl?.assignedSlot;
			if (slot?.name === 'action') {
				const event = new KeyboardEvent('keydown', ev);
				this.activeEl?.dispatchEvent(event);
			}
			else if (this.activeEl) {
				ev.preventDefault();
				this.selectItem(this.activeEl);
			}
		}

		if (ev.key === 'Tab') {
			const actionSlotEl = this.renderRoot.querySelector<HTMLSlotElement>(
				'slot[name="action"]',
			);
			const slotContent = actionSlotEl?.assignedElements();
			const firstEl = slotContent?.at(0);

			if (
				firstEl instanceof MMTypeaheadItem &&
				firstEl !== this.activeEl
			) {
				ev.preventDefault();
				ev.stopPropagation();

				this.focusItem(firstEl);
			}
		}

		if (ev.key === 'Delete') {
			ev.preventDefault();
			emitEvent(this, typeaheadEvents.mmClear);
		}

		if (ev.key === 'Escape') {
			ev.preventDefault();
			this.open = false;
		}
	}

	protected handleDefaultSlotChange(ev: EventOf<HTMLSlotElement>) {
		if (!this.open)
			return;

		const slotContent = ev.target.assignedElements();

		const previousExists = slotContent.some((el) => el === this.activeEl);
		if (!previousExists) {
			this.activeEl = undefined;

			const firstEl = slotContent.at(0) as
				| MMTypeaheadItem
				| undefined;

			if (firstEl)
				this.focusItem(firstEl);
		}

		this.updateComplete.then(() => {
			const el = this.popoutListEl.value;
			const active = this.activeEl;

			if (active && el && el.scrollHeight > el.offsetHeight)
				scrollParentToChild(el, active);
		});
	}

	protected handleDropdownClick(ev: PointerEvent) {
		ev.preventDefault();

		//const findInstanceOf = <TOut extends Ctor>(
		//	arr: any[], type: TOut,
		//): InstanceType<TOut> | undefined => arr.find(el => el instanceof type) as any;

		//const test1 = findInstanceOf(ev.composedPath(), HTMLAnchorElement);

		const path = ev.composedPath();
		const el = path.find(
			(el): el is MMTypeaheadItem =>
				el instanceof MMTypeaheadItem,
		);

		if (el?.assignedSlot?.name)
			return;

		if (el) {
			if (this.activeEl !== el)
				this.focusItem(el);

			this.selectItem(el);
		}
	}

	public override render() {
		const showClearBtn = (this.value && this.showClearWhenDisabled && this.disabled)
			|| (this.value && !this.disabled);

		return html`
		<mm-input
			label=${ ifDefined(this.label) }
			placeholder=${ ifDefined(this.placeholder) }
			.value=${ live(this.value ?? '') }
			?disabled=${ this.disabled }
			@input=${ this.handleInput }
			@click=${ this.handleClick }
			@keydown=${ this.handleInputKeydown }
			@focus=${ this.handleFocus }
			@blur=${ this.handleBlur }
		>
		${ when(showClearBtn, () => html`
			<mm-button
				slot="end"
				type="icon"
				variant="elevated"
				size="x-small"
				style="--mm-btn-xsmall-height:14px;margin-right:4px;"
				tabindex=${ this.disabled && this.showClearWhenDisabled ? '0' : '-1' }
				@mousedown=${ (ev: MouseEvent) => {
					ev.preventDefault();
					ev.stopPropagation();
					ev.stopImmediatePropagation();
				} }
				@click=${ (ev: MouseEvent) => {
					ev.preventDefault();
					ev.stopPropagation();
					emitEvent(this, typeaheadEvents.mmClear);
				} }
			>
				<mm-icon
					style="color: rgb(0 0 0 / 70%);"
					template=${ systemIcons.xLg }
				></mm-icon>
			</mm-button>
		`) }
		</mm-input>

		${ when(this.open, () => html`
		<s-input-dropdown
			${ ref(this.popoutEl) }
			part="input-dropdown"
			style=${ styleMap({
				width: this.inputEl?.offsetWidth
					? this.inputEl.offsetWidth + 'px' : 'auto',
			}) }
			@mousedown=${ this.handleDropdownClick }
		>
			<ol ${ ref(this.popoutListEl) }>
				<slot @slotchange=${ this.handleDefaultSlotChange }></slot>
			</ol>

			<div class="action">
				<slot name="action"></slot>
			</div>
		</s-input-dropdown>
		`) }
		`;
	}

	public static override styles = [
		sharedStyles,
		css`
		/* variables */
		:host {
			--_typea-popout-height: var(--mm-typea-popout-height, 200px);
			--_typea-bg-color: var(var(--mm-typea-bg-color), rgb(25, 28, 26));
		}
		`,
		css`
		:host {
			position: relative;
			display: grid;
			background-color: var(--_typea-bg-color);
		}
		s-input-dropdown {
			overflow: hidden;
			display: grid;
			grid-template-rows: 1fr max-content;

			height: var(--_typea-popout-height);
			background-color: rgb(20, 36, 39);
			border: 1px solid rgb(var(--mm-color-on-surface) / .08);
			border-top: none;
		}
		s-input-dropdown[placement^="top"] {
			border-top-left-radius: 8px;
			border-top-right-radius: 8px;
		}
		s-input-dropdown[placement^="bottom"] {
			border-bottom-left-radius: 8px;
			border-bottom-right-radius: 8px;
		}
		ol,
		li {
			all: unset;
		}
		ol {
			display: flex;
			flex-flow: column nowrap;
			overflow: auto;
		}
		.action ::slotted(*) {
			border-top: 1px solid rgb(var(--mm-color-on-surface) / .08);
		}
		`,
	];

}

@customElement('mm-typeahead-item')
export class MMTypeaheadItem extends MimicElement {

	public override role = 'listitem';
	public value?: any;

	public override render() {
		return html`<slot></slot>`;
	}

	public static override styles = [
		css`
		:host {
			display: grid;
			padding-inline: 12px;
			cursor: pointer;
			border: 1px solid transparent;
		}
		:host(:hover) {
			background-color: rgb(var(--mm-color-on-surface) / .05);
		}
		:host(.active) {
			background-color: rgb(var(--mm-color-on-surface) / .07);
		}
		`,
	];

}

MMTypeaheadItem.register();


declare global { interface HTMLElementTagNameMap {
	'mm-typeahead': MMTypeahead;
	'mm-typeahead-item': MMTypeaheadItem;
} }
