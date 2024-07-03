import { animateTo, animationSpeed, stopAnimations } from '@roenlie/core/animation';
import { paintCycle } from '@roenlie/core/async';
import { emitEvent, scrollIntoView } from '@roenlie/core/dom';
import { oneOf } from '@roenlie/core/validation';
import { KeyboardController } from '@roenlie/lit-utilities/controllers';
import { watch } from '@roenlie/lit-utilities/decorators';
import { customElement, MimicElement } from '@roenlie/lit-utilities/element';
import { sharedStyles } from '@roenlie/lit-utilities/styles';
import { css, html } from 'lit';
import { property, query, queryAssignedElements, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { when } from 'lit/directives/when.js';

import { systemIcons } from '../../utilities/system-icons.js';
import { MMButton } from '../button/button.cmp.js';
import { MMIcon } from '../icon/icon-element.js';
import { MMTab } from './tab-element.js';
import { MMTabPanel } from './tab-panel-element.js';

MMTab.register();
MMTabPanel.register();
MMButton.register();
MMIcon.register();


declare global { interface HTMLElementTagNameMap {
	'mm-tab-group': MMTabGroup;
} }


interface IconProp {
	part: string;
	class: string;
	icon: keyof typeof systemIcons;
	click: Parameters<MMTabGroup['handleScrollTo']>[0];
}


/**
 * @slot default - Used for grouping tab panels in the tab group.
 * @slot nav     - Used for grouping tabs in the tab group.
 *
 * @event {name: string} mm-tab-show - Emitted when a tab is shown.
 * @event {name: string} mm-tab-hide - Emitted when a tab is hidden.
 */
@customElement('mm-tab-group')
export class MMTabGroup extends MimicElement {

	//#region properties
	/** Disables the scroll arrows that appear when tabs overflow. */
	@property({ type: Boolean, attribute: 'no-scroll-controls' }) public noScrollControls?: boolean;

	/** The placement of the tabs. */
	@property() public placement: 'top' | 'bottom' | 'start' | 'end' = 'top';

	/**
	 * When set to auto, navigating tabs with the arrow keys will instantly
	 * show the corresponding tab panel.
	 * When set to manual, the tab will receive focus but will
	 * not show until the user presses spacebar or enter.
	 */
	@property() public activation: 'auto' | 'manual' = 'auto';

	@state() protected hasScrollControls = false;

	public activeTab?: MMTab;
	public activeTabName?: string;
	protected blockAnimation = false;
	protected tabs: MMTab[] = [];
	protected panels: MMTabPanel[] = [];
	//#endregion


	//#region controllers
	protected readonly keyboardFocusCtrl = new KeyboardController({
		host:    this,
		target:  () => this.tabGroupQry,
		keylist: [
			{ key: 'enter' },
			{ key: 'space' },
		],
		listener: (ev) => {
			const target = ev.target as HTMLElement;
			const tab = target.closest<MMTab>('mm-tab');
			const tabGroup = tab?.closest<MMTabGroup>('mm-tab-group');

			// Ensure the target tab is in this tab group
			if (tabGroup !== this)
				return;

			// Activate a tab
			if (tab !== null) {
				this.setActiveTab(tab, { scrollBehavior: 'smooth' });
				if (this.activation === 'auto')
					ev.preventDefault();
			}
		},
	});

	protected readonly keyboardNavCtrl = new KeyboardController({
		host:    this,
		target:  () => this.tabGroupQry,
		keylist: [
			{ key: 'ArrowUp' },
			{ key: 'ArrowDown' },
			{ key: 'ArrowLeft' },
			{ key: 'ArrowRight' },
			{ key: 'Home' },
			{ key: 'End' },
			{
				key:      'Delete',
				listener: () => {
					if (this.activeTab?.closable)
						this.activeTab?.handleCloseClick();
				},
			},
		],
		listener: (ev, options) => {
			const key = Array.isArray(options.key) ? options.key.at(0)! : options.key;
			const target = ev.target as HTMLElement;
			const tab = target.closest<MMTab>('mm-tab');
			const tabGroup = tab?.closest<MMTabGroup>('mm-tab-group');
			const maxIndex = this.tabs.length - 1;
			const minIndex = 0;

			// Ensure the target tab is in this tab group
			if (tabGroup !== this)
				return;

			ev.preventDefault();
			let index = this.tabs.indexOf(tab!);

			if (options.key === 'Home')
				index = minIndex;

			if (options.key === 'End')
				index = maxIndex;

			if ([ 'ArrowUp', 'ArrowLeft' ].includes(key))
				index --;
			if ([ 'ArrowDown', 'ArrowRight' ].includes(key))
				index ++;

			if (index < minIndex)
				index = maxIndex;

			if (index > maxIndex)
				index = minIndex;

			const nextTab = this.tabs[index];
			if (!nextTab)
				return console.error('New tab does not exist');

			nextTab.focus({ preventScroll: true });

			if (this.activation === 'auto')
				this.setActiveTab(nextTab, { scrollBehavior: 'smooth' });
			if (this.hasScrollControls)
				scrollIntoView(nextTab, this.navQry, 'both');
		},
	});
	//#endregion


	//#region observers
	/** sets aria attributes on dom mutations */
	protected readonly mutationObserver = new MutationObserver(mutations => {
		// Update aria labels when the DOM changes
		if (mutations.some(m => ![ 'aria-labelledby', 'aria-controls' ].includes(m.attributeName!)))
			paintCycle().then(() => this.setAriaLabels());

		// Sync tabs when disabled states change
		if (mutations.some(m => m.attributeName === 'disabled'))
			this.syncTabsAndPanels();
	});

	/** Updates indicator and scroll controll on resize */
	protected readonly resizeObserver = new ResizeObserver(() => {
		this.blockAnimation = true;
		this.repositionIndicator();
		this.updateScrollControls();
		this.blockAnimation = false;
	});

	/** Set initial tab state when the tabs first become visible */
	protected readonly intersectionObserver = new IntersectionObserver((entries, observer) => {
		if (entries[0]?.intersectionRatio ?? 0 > 0) {
			this.setAriaLabels();
			this.setActiveTab(this.getActiveTab() ?? this.tabs[0]!, { emitEvents: false });
			observer.unobserve(entries[0]!.target);
		}
	});
	//#endregion


	//#region queries
	@queryAssignedElements({ slot: 'nav' }) protected navSlot: MMTab[];
	@queryAssignedElements()        protected defaultSlot: HTMLElement[];
	@query('.tab-group')            protected tabGroupQry: HTMLElement;
	@query('.tab-group__nav')       protected navQry: HTMLElement;
	@query('.tab-group__tabs')      protected indicatorParentQry: HTMLElement;
	@query('.tab-group__indicator') protected indicatorQry: HTMLElement;
	//#endregion


	//#region lifecycle
	public override async connectedCallback() {
		super.connectedCallback();

		await this.updateComplete;

		this.syncTabsAndPanels();
		this.resizeObserver.observe(this.navQry);
		this.mutationObserver.observe(this, { attributes: true, childList: true, subtree: true });
		this.intersectionObserver.observe(this.tabGroupQry);
	}

	public override disconnectedCallback() {
		this.resizeObserver.disconnect();
		this.mutationObserver.disconnect();
		this.intersectionObserver.disconnect();
	}
	//#endregion


	//#region logic
	/** Shows the specified tab panel. */
	public show(panel: string) {
		const tab = this.tabs.find(el => el.panel === panel);
		tab && this.setActiveTab(tab, { scrollBehavior: 'smooth' });
	}

	protected getAllTabs(includeDisabled = false) {
		return this.navSlot.filter(el =>
			el.tagName === MMTab.tagName.toUpperCase() && (includeDisabled || !el.disabled));
	}

	protected getAllPanels() {
		return (this.defaultSlot as MMTabPanel[])
			.filter(el => el.tagName === MMTabPanel.tagName.toUpperCase());
	}

	protected getActiveTab() {
		return this.tabs.find(el => el.active);
	}

	protected handleClick(event: MouseEvent) {
		const target = event.target as HTMLElement;
		const tab = target.closest<MMTab>(MMTab.tagName);
		const tabGroup = tab?.closest<MMTabGroup>(MMTabGroup.tagName);

		// Ensure the target tab is in this tab group
		if (tabGroup !== this)
			return;

		if (tab !== null)
			this.setActiveTab(tab, { scrollBehavior: 'smooth' });
	}

	protected handleScrollTo(placement: MMTabGroup['placement']) {
		const scroll = {
			top:      undefined,
			left:     undefined,
			behavior: 'smooth',
		} as ScrollToOptions;

		switch (placement) {
		case 'top':
			scroll.top = this.navQry.scrollTop - this.navQry.clientHeight; break;
		case 'bottom':
			scroll.top = this.navQry.scrollTop + this.navQry.clientHeight; break;
		case 'start':
			scroll.left = this.navQry.scrollLeft - this.navQry.clientWidth; break;
		case 'end':
			scroll.left = this.navQry.scrollLeft + this.navQry.clientWidth; break;
		}

		this.navQry.scroll(scroll);
	}

	protected handleWheelScroll(ev: WheelEvent) {
		if (!oneOf(this.placement, 'top', 'bottom'))
			return;

		ev.preventDefault();
		this.navQry.scrollLeft += ev.deltaY;
	}

	protected setActiveTab(
		tab: MMTab,
		options?: { emitEvents?: boolean; scrollBehavior?: 'auto' | 'smooth' },
	) {
		options = {
			emitEvents:     true,
			scrollBehavior: 'auto',
			...options,
		};

		if (!tab || tab === this.activeTab || tab.disabled)
			return;

		const previousTab = this.activeTab;
		this.activeTab = tab;
		this.activeTabName = this.activeTab.panel;

		// Sync active tab and panel
		this.tabs.map(el => (el.active = (el === this.activeTab)));
		this.panels.map(el => (el.active = (el.name === this.activeTab?.panel)));
		this.syncIndicator();

		if ([ 'top', 'bottom' ].includes(this.placement))
			scrollIntoView(this.activeTab, this.navQry, 'horizontal', options.scrollBehavior);
		else if ([ 'start', 'end' ].includes(this.placement))
			scrollIntoView(this.activeTab, this.navQry, 'vertical', options.scrollBehavior);

		// Emit events
		if (options.emitEvents) {
			if (previousTab)
				emitEvent(this, 'mm-tab-hide', { detail: { name: previousTab.panel } });

			emitEvent(this, 'mm-tab-show', { detail: { name: this.activeTab.panel } });
		}
	}

	protected setAriaLabels() {
		// Link each tab with its corresponding panel
		this.tabs.forEach(tab => {
			const panel = this.panels.find(el => el.name === tab.panel);
			if (panel) {
				tab.setAttribute('aria-controls', panel.getAttribute('id')!);
				panel.setAttribute('aria-labelledby', tab.getAttribute('id')!);
			}
		});
	}

	@watch('placement', { waitUntilFirstUpdate: true })
	protected async syncIndicator() {
		const tab = this.getActiveTab();
		if (!tab) {
			const firstValidTab = this.getAllTabs().find(t => !t.disabled);
			if (firstValidTab)
				this.setActiveTab(this.tabs.at(0)!, { scrollBehavior: 'smooth' });
			else
				this.indicatorQry.style.display = 'none';

			return;
		}

		this.indicatorQry.style.display = 'block';
		this.repositionIndicator();
	}

	@watch('noScrollControls', { waitUntilFirstUpdate: true })
	protected updateScrollControls() {
		const disabledScroll = this.noScrollControls;

		if (this.placement === 'start' || this.placement === 'end') {
			const verticalScroll = this.navQry.scrollHeight > this.navQry.clientHeight;
			this.hasScrollControls = !(disabledScroll || !verticalScroll);
		}
		else {
			const horizontalScroll = this.navQry.scrollWidth > this.navQry.clientWidth;
			this.hasScrollControls = !(disabledScroll || !horizontalScroll);
		}
	}

	protected async repositionIndicator() {
		const currentTab = this.getActiveTab();
		if (!currentTab)
			return;

		const tabRect = currentTab.getBoundingClientRect();
		const parentRect = this.indicatorParentQry.getBoundingClientRect();
		const indicatorRect = this.indicatorQry.getBoundingClientRect();
		const animOptions = { easing: 'ease-out', duration: animationSpeed('fast') };
		let keyframes: Record<string, string>[] = [];

		if (oneOf(this.placement, 'top', 'bottom')) {
			if (!tabRect.width)
				return;

			keyframes = [
				{
					width: (indicatorRect.width || tabRect.width) + 'px',
					left:  `${ Math.max(0, indicatorRect.left - parentRect.left) }px`,
				},
				{
					width: tabRect.width + 'px',
					left:  `${ Math.max(0, tabRect.left - parentRect.left) }px`,
				},
			];
		}
		else if (oneOf(this.placement, 'start', 'end')) {
			if (!tabRect.height)
				return;

			keyframes = [
				{
					height: (indicatorRect.height || tabRect.height) + 'px',
					top:    `${ Math.max(0, indicatorRect.top - parentRect.top) }px`,
				},
				{
					height: tabRect.height + 'px',
					top:    `${ Math.max(0, tabRect.top - parentRect.top) }px`,
				},
			];
		}

		if (!this.blockAnimation) {
			await stopAnimations(this.indicatorQry);
			await animateTo(this.indicatorQry, keyframes, animOptions);
		}

		Object.assign(this.indicatorQry.style, keyframes.at(-1));
	}

	// This stores tabs and panels so we can refer to a cache instead of calling querySelectorAll() multiple times.
	protected async syncTabsAndPanels() {
		await paintCycle();

		this.tabs = this.getAllTabs();
		this.panels = this.getAllPanels();
		this.panels.map(el => (el.active = (el.name === this.activeTabName)));

		if (!this.activeTab && this.tabs.length)
			this.show(this.tabs[0]!.panel);
	}
	//#endregion


	//#region template
	protected navIconProps: Record<string, IconProp> = {
		topfirst: {
			part:  'scroll-button--start',
			class: 'tab-group__scroll-button--start',
			icon:  'chevronLeft',
			click: 'start',
		},
		toplast: {
			part:  'scroll-button--end',
			class: 'tab-group__scroll-button--end',
			icon:  'chevronRight',
			click: 'end',
		},

		bottomfirst: {
			part:  'scroll-button--start',
			class: 'tab-group__scroll-button--start',
			icon:  'chevronLeft',
			click: 'start',
		},
		bottomlast: {
			part:  'scroll-button--end',
			class: 'tab-group__scroll-button--end',
			icon:  'chevronRight',
			click: 'end',
		},

		startfirst: {
			part:  'scroll-button--top',
			class: 'tab-group__scroll-button--top',
			icon:  'chevronUp',
			click: 'top',
		},
		startlast: {
			part:  'scroll-button--bottom',
			class: 'tab-group__scroll-button--bottom',
			icon:  'chevronDown',
			click: 'bottom',
		},

		endfirst: {
			part:  'scroll-button--top',
			class: 'tab-group__scroll-button--top',
			icon:  'chevronUp',
			click: 'top',
		},
		endlast: {
			part:  'scroll-button--bottom',
			class: 'tab-group__scroll-button--bottom',
			icon:  'chevronDown',
			click: 'bottom',
		},
	};

	protected navTpl(placement: 'first' | 'last') {
		const props = this.navIconProps[this.placement + placement]!;

		return when(this.hasScrollControls, () => html`
		<mm-button
			part       =${ 'scroll-button ' + props.part }
			exportparts="base:scroll-button__base"
			type       ="icon"
			variant    ="text"
			shape      ="sharp"
			size       ="auto"
			class      =${ classMap({
				'tab-group__scroll-button': true,
				[props.class]:              true,
			}) }
			@click     =${ () => this.handleScrollTo(props.click) }
		>
			<mm-icon
				template=${ systemIcons[props.icon] }
			></mm-icon>
		</mm-button>
	`);
	}

	protected override render() {
		return html`
		<div
			part="base"
			class=${ classMap({
				'tab-group':                      true,
				['tab-group--' + this.placement]: true,
				'tab-group--has-scroll-controls': this.hasScrollControls,
			}) }
			@click=${ this.handleClick.bind(this) }
		>
			<div part="nav" class="tab-group__nav-container">
				<div class="tab-group__nav" @mousewheel=${ this.handleWheelScroll.bind(this) }>
					<div part="tabs" class="tab-group__tabs" role="tablist">
						<div
							part="active-tab-indicator"
							class="tab-group__indicator"
						></div>
						<slot name="nav" @slotchange=${ this.syncTabsAndPanels.bind(this) }></slot>
					</div>
				</div>

				${ when(this.hasScrollControls, () => this.navTpl('first')) }
				${ when(this.hasScrollControls, () => this.navTpl('last')) }
			</div>

			<div part="body" class="tab-group__body">
				<slot @slotchange=${ this.syncTabsAndPanels.bind(this) }></slot>
			</div>
		</div>
		`;
	}
	//#endregion


	//#region style
	public static override styles = [
		sharedStyles,
		css` /* variables */
		:host {
			--_tab-height:          var(--mm-tab-height,          30px);
			--_tab-color-neutral:   var(--mm-tab-color-neutral,   rgb(166 238 255));
			--_tab-color-primary:   var(--mm-tab-color-primary,   rgb(226 197 75));
			--_tab-color-focus:     var(--mm-tab-color-focus,     rgb(162 205 218));
			--_tab-color-indicator: var(--mm-tab-color-indicator, rgb(226 197 75));
			--_tab-indicator-width: var(--mm-tab-indicator-width, 3px);
			--_tab-color-track:     var(--mm-tab-color-track,     rgb(75 71 57));
			--_tab-track-width:     var(--mm-tab-track-width,     2px);
			--_tab-spacing-xs:      var(--mm-tab-spacing-xs,      4px);
			--_tab-spacing-s:       var(--mm-tab-spacing-s,       8px);
			--_tab-spacing-xl:      var(--mm-tab-spacing-xl,      20px);
			--_tab-border-radius:   var(--mm-tab-border-radius,   4px);
			--_tab-transition:      var(--mm-tab-transition,      200ms);
		}
		`,
		css` /* defaults */
		:host {
			display: block;
		}
		.tab-group {
			display: flex;
			border: solid 1px transparent;
			border-radius: 0;
		}
		.tab-group .tab-group__tabs {
			position: relative;
			display: flex;
			gap: var(--_tab-spacing-s);
		}
		.tab-group__nav-container {
			position: relative;
			display: grid;
		}
		.tab-group__nav {
			display: grid;
			padding: var(--_tab-spacing-xs);
		}
		.tab-group .tab-group__indicator {
			position: absolute;
		}
		.tab-group__scroll-button {
			position: absolute;
			display: grid;
			place-items: center;
		}
		.tab-group__scroll-button::part(button) {
			padding: 2px;
		}
		.tab-group__body {
			display: grid;
		}

		/* Hide scrollbar in Firefox */
		.tab-group__nav {
			scrollbar-width: none;
		}
		/* Hide scrollbar in Chrome/Safari */
		.tab-group__nav::-webkit-scrollbar {
			display: none;
		}
		`,
		css` /* Top */
		.tab-group--top {
			height: 100%;
			display: grid;
			grid-template-rows: auto 1fr;
			grid-template-columns: 1fr;
		}
		.tab-group--top .tab-group__scroll-button {
			top: 0px;
			height: 100%;
		}
		.tab-group--top .tab-group__scroll-button:first-of-type {
			left: 0px;
		}
		.tab-group--top .tab-group__scroll-button:last-of-type {
			right: 0px;
		}
		.tab-group--top .tab-group__nav-container {
			order: 1;
		}
		.tab-group--top .tab-group__nav {
			overflow-x: auto;
			padding-bottom: 0px;
		}
		.tab-group--top .tab-group__tabs {
			flex-direction: row;
			margin-inline: var(--_tab-spacing-xs);
			padding-bottom: var(--_tab-spacing-xs);
			border-bottom: var(--_tab-track-width) solid var(--_tab-color-track);
		}
		.tab-group--top .tab-group__indicator {
			bottom: calc(-1 * var(--_tab-track-width));
			border-bottom: var(--_tab-indicator-width) solid var(--_tab-color-indicator);
		}
		.tab-group--top .tab-group__body {
			order: 2;
		}
		.tab-group--top ::slotted(mm-tab-panel) {
			--_tab-padding: var(--_tab-spacing-s) 0;
		}
		.tab-group--top.tab-group--has-scroll-controls .tab-group__nav-container {
			padding: 0 var(--_tab-spacing-xl);
		}
		`,
		css` /* Bottom */
		.tab-group--bottom {
			height: 100%;
			display: grid;
			grid-template-rows: 1fr auto;
			grid-template-columns: 1fr;
		}
		.tab-group--bottom .tab-group__scroll-button {
			top: 0;
			bottom: 0;
		}
		.tab-group--bottom .tab-group__scroll-button:first-of-type {
			left: 0px;
		}
		.tab-group--bottom .tab-group__scroll-button:last-of-type {
			right: 0px;
		}
		.tab-group--bottom .tab-group__nav-container {
			order: 2;
		}
		.tab-group--bottom .tab-group__nav {
			overflow-x: auto;
			padding-top: 0px;
		}
		.tab-group--bottom .tab-group__tabs {
			flex-direction: row;
			margin-inline: var(--_tab-spacing-xs);
			padding-top: var(--_tab-spacing-xs);
			border-top: solid var(--_tab-track-width) var(--_tab-color-track);
		}
		.tab-group--bottom .tab-group__indicator {
			top: calc(-1 * var(--_tab-track-width));
			border-top: solid var(--_tab-indicator-width) var(--_tab-color-indicator);
		}
		.tab-group--bottom .tab-group__body {
			order: 1;
		}
		.tab-group--bottom ::slotted(mm-tab-panel) {
			--_tab-padding: var(--_tab-spacing-s) 0;
		}
		.tab-group--bottom.tab-group--has-scroll-controls .tab-group__nav-container {
			padding: 0 var(--_tab-spacing-xl);
		}
		`,
		css` /* Start */
		.tab-group--start {
			height: 100%;
			display: grid;
			grid-template-rows: 1fr;
			grid-template-columns: auto 1fr;
		}
		.tab-group--start .tab-group__scroll-button:first-of-type {
			top: 0;
			width: 100%;
		}
		.tab-group--start .tab-group__scroll-button:last-of-type {
			bottom: 0;
			width: 100%;
		}
		.tab-group--start .tab-group__nav-container {
			order: 1;
		}
		.tab-group--start .tab-group__nav {
			overflow-y: auto;
			padding-right: 0px;
		}
		.tab-group--start .tab-group__tabs {
			flex-direction: column;
			margin-block: var(--_tab-spacing-xs);
			padding-inline-end: var(--_tab-spacing-xs);
			border-inline-end: solid var(--_tab-track-width) var(--_tab-color-track);
		}
		.tab-group--start .tab-group__indicator {
			right: calc(-1 * var(--_tab-track-width));
			border-right: solid var(--_tab-indicator-width) var(--_tab-color-indicator);
		}
		.tab-group--start .tab-group__body {
			order: 2;
		}
		.tab-group--start ::slotted(mm-tab-panel) {
			--_tab-padding: 0 var(--_tab-spacing-s);
		}
		.tab-group--start.tab-group--has-scroll-controls .tab-group__nav-container {
			padding: var(--_spacing-xl) 0;
		}
		`,
		css` /* End */
		.tab-group--end {
			height: 100%;
			display: grid;
			grid-template-rows: 1fr;
			grid-template-columns: 1fr auto;
		}
		.tab-group--end .tab-group__scroll-button:first-of-type {
			top: 0;
			width: 100%;
		}
		.tab-group--end .tab-group__scroll-button:last-of-type {
			bottom: 0;
			width: 100%;
		}
		.tab-group--end .tab-group__nav-container {
			order: 2;
		}
		.tab-group--end .tab-group__nav {
			overflow-y: auto;
			padding-left: 0px;
		}
		.tab-group--end .tab-group__tabs {
			flex-direction: column;
			margin-block: var(--_tab-spacing-xs);
			padding-inline-start: var(--_tab-spacing-xs);
			border-inline-start: solid var(--_tab-track-width) var(--_tab-color-track);
		}
		.tab-group--end .tab-group__indicator {
			left: calc(-1 * var(--_tab-track-width));
			border-inline-start: solid var(--_tab-indicator-width) var(--_tab-color-indicator);
		}
		.tab-group--end .tab-group__body {
			order: 1;
		}
		.tab-group--end ::slotted(mm-tab-panel) {
			--_tab-padding: 0 var(--_tab-spacing-s);
		}
		.tab-group--end.tab-group--has-scroll-controls .tab-group__nav-container {
			padding: var(--_tab-spacing-xl) 0;
		}
		`,
	];
	//#endregion

}
