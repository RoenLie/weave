import { animateTo, animationSpeed, stopAnimations } from '@roenlie/core/animation';
import { paintCycle } from '@roenlie/core/async';
import { emitEvent, scrollIntoView } from '@roenlie/core/dom';
import { oneOf } from '@roenlie/core/validation';
import { KeyboardController, LocalizeController } from '@roenlie/lit-utilities/controllers';
import { watch } from '@roenlie/lit-utilities/decorators';
import { css, html, LitElement } from 'lit';
import { customElement, property, query, queryAssignedElements, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { when } from 'lit/directives/when.js';

import { componentStyles } from '../../features/shared-styles/component-styles.js';
import { TabCmp } from './tab.cmp.js';
import { TabPanelCmp } from './tab-panel.cmp.js';


/**
 * @slot default                    - Used for grouping tab panels in the tab group.
 * @slot nav                        - Used for grouping tabs in the tab group.
 *
 * @event {name: string} pl-tab-show - Emitted when a tab is shown.
 * @event {name: string} pl-tab-hide - Emitted when a tab is hidden.
 *
 * @csspart base                    - The component's internal wrapper.
 * @csspart nav                     - The tab group navigation container.
 * @csspart tabs                    - The container that wraps the slotted tabs.
 * @csspart active-tab-indicator    - An element that displays the currently selected tab..
 * @csspart body                    - The tab group body where tab panels are slotted in.
 * @csspart scroll-button           - The previous and next scroll buttons that appear when tabs are scrollable.
 * @csspart scroll-button--start    - Targets the starting scroll button.
 * @csspart scroll-button--end      - Targets the ending scroll button.
 * @csspart scroll-button__base     - The scroll button's `base` part.
 *
 * @cssproperty --indicator-color - The color of the active tab indicator.
 * @cssproperty --track-color - The color of the indicator's track (i.e. the line that separates tabs from panels).
 * @cssproperty --track-width - The width of the indicator's track (the line that separates tabs from panels).
 */
@customElement('pl-tab-group')
export class TabGroupCmp extends LitElement {

	//#region properties
	/** Disables the scroll arrows that appear when tabs overflow. */
	@property({ type: Boolean, attribute: 'no-scroll-controls' }) public noScrollControls = false;

	/** The placement of the tabs. */
	@property() public placement: 'top' | 'bottom' | 'start' | 'end' = 'top';

	/** The locale to render the component in. */
	@property() public override lang: string;

	/**
	 * When set to auto, navigating tabs with the arrow keys will instantly
	 * show the corresponding tab panel.
	 * When set to manual, the tab will receive focus but will
	 * not show until the user presses spacebar or enter.
	 */
	@property() public activation: 'auto' | 'manual' = 'auto';

	@state() protected hasScrollControls = false;

	protected get isRtl() {
		return this.localizeCtrl.dir() === 'rtl';
	}

	public activeTab?: TabCmp;
	protected blockAnimation = false;
	protected tabs: TabCmp[] = [];
	protected  panels: TabPanelCmp[] = [];
	//#endregion


	//#region controllers
	protected readonly localizeCtrl = new LocalizeController({ host: this });

	protected readonly keyboardFocusCtrl = new KeyboardController({
		host:    this,
		target:  () => this.tabGroupQry,
		keylist: [
			{ key: 'enter' },
			{ key: 'space' },
		],
		listener: (ev) => {
			const target = ev.target as HTMLElement;
			const tab = target.closest<TabCmp>('pl-tab');
			const tabGroup = tab?.closest<TabGroupCmp>('pl-tab-group');

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
			const tab = target.closest<TabCmp>('pl-tab');
			const tabGroup = tab?.closest<TabGroupCmp>('pl-tab-group');
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
				this.isRtl ? index ++ : index --;
			if ([ 'ArrowDown', 'ArrowRight' ].includes(key))
				this.isRtl ? index -- : index ++;

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
	@queryAssignedElements({ slot: 'nav' }) protected navSlot: HTMLElement[];
	@queryAssignedElements()        protected defaultSlot: HTMLElement[];
	@query('.tab-group')            protected tabGroupQry: HTMLElement;
	@query('.tab-group__nav')       protected navQry: HTMLElement;
	@query('.tab-group__tabs')      protected indicatorParentQry: HTMLElement;
	@query('.tab-group__indicator') protected indicatorQry: HTMLElement;
	//#endregion


	//#region lifecycle
	public override connectedCallback() {
		super.connectedCallback();

		this.updateComplete.then(() => {
			this.syncTabsAndPanels();
			this.resizeObserver.observe(this.navQry);
			this.mutationObserver.observe(this, { attributes: true, childList: true, subtree: true });
			this.intersectionObserver.observe(this.tabGroupQry);
		});
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
		return (this.navSlot as TabCmp[])
			.filter(el => el.tagName === 'PL-TAB' && (includeDisabled || !el.disabled));
	}

	protected getAllPanels() {
		return (this.defaultSlot as TabPanelCmp[])
			.filter(el => el.tagName === 'PL-TAB-PANEL');
	}

	protected getActiveTab() {
		return this.tabs.find(el => el.active);
	}

	protected handleClick(event: MouseEvent) {
		const target = event.target as HTMLElement;
		const tab = target.closest<TabCmp>('pl-tab');
		const tabGroup = tab?.closest<TabGroupCmp>('pl-tab-group');

		// Ensure the target tab is in this tab group
		if (tabGroup !== this)
			return;

		if (tab !== null)
			this.setActiveTab(tab, { scrollBehavior: 'smooth' });
	}

	protected handleScrollTo(placement: TabGroupCmp['placement']) {
		({
			top: () => {
				this.navQry.scroll({
					top:      this.navQry.scrollTop - this.navQry.clientHeight,
					behavior: 'smooth',
				});
			},
			bottom: () => {
				this.navQry.scroll({
					top:      this.navQry.scrollTop + this.navQry.clientHeight,
					behavior: 'smooth',
				});
			},
			start: () => {
				this.navQry.scroll({
					left: this.localizeCtrl.dir() === 'rtl'
						? this.navQry.scrollLeft + this.navQry.clientWidth
						: this.navQry.scrollLeft - this.navQry.clientWidth,
					behavior: 'smooth',
				});
			},
			end: () => {
				this.navQry.scroll({
					left: this.localizeCtrl.dir() === 'rtl'
						? this.navQry.scrollLeft - this.navQry.clientWidth
						: this.navQry.scrollLeft + this.navQry.clientWidth,
					behavior: 'smooth',
				});
			},
		})[placement]();
	}

	protected handleWheelScroll(ev: WheelEvent) {
		if (![ 'top', 'bottom' ].includes(this.placement))
			return;

		ev.preventDefault();
		this.navQry.scrollLeft += ev.deltaY;
	}

	protected setActiveTab(
		tab: TabCmp,
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
				emitEvent(this, 'pl-tab-hide', { detail: { name: previousTab.panel } });

			emitEvent(this, 'pl-tab-show', { detail: { name: this.activeTab.panel } });
		}

		// Potential way to cause a disconnect/reconnect of the panel component.
		//const activePanel = this.panels.find(el => el.active);
		//activePanel?.replaceWith(activePanel);
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
		const horizontalScroll = this.navQry.scrollWidth > this.navQry.clientWidth;
		const verticalScroll = this.navQry.scrollHeight > this.navQry.clientHeight;

		this.hasScrollControls = !(disabledScroll || (!horizontalScroll && !verticalScroll));
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
	protected syncTabsAndPanels() {
		paintCycle().then(() => {
			this.tabs = this.getAllTabs();
			this.panels = this.getAllPanels();

			if (this.tabs.length)
				this.show(this.tabs.at(0)!.panel);
		});
	}

	// This currently blocks touch events in the panel, do not use before fixing.
	protected handleSwipe(ev: TouchEvent) {
		const target = ev.target;
		if (!target)
			return;

		type SwipeDir = 'none' | 'left' | 'right' | 'up' | 'down';

		ev.preventDefault();

		const threshold      = 100; // required min distance traveled to be considered swipe
		const restraint      = 100; // maximum distance allowed at the same time in perpendicular direction
		const allowedTime    = 500; // maximum time allowed to travel that distance

		const initialTouch   = ev.changedTouches[0]!;
		const startTime      = Date.now(); // record time when finger first makes contact with surface
		const startX         = initialTouch.pageX;
		const startY         = initialTouch.pageY;
		let swipedir         = 'none' as SwipeDir;

		const onTouchMove = (ev: TouchEvent) => ev.preventDefault();
		target.addEventListener('touchmove', onTouchMove as any);

		const onTouchEnd = (ev: TouchEvent) => {
			target.removeEventListener('toucmove', onTouchMove as any);
			target.removeEventListener('touchend', onTouchEnd as any);
			ev.preventDefault();

			const touchobj    = ev.changedTouches[0]!;
			const distX       = touchobj.pageX - startX; // get horizontal dist traveled by finger while in contact with surface
			const distY       = touchobj.pageY - startY; // get vertical dist traveled by finger while in contact with surface
			const elapsedTime = Date.now() - startTime; // get time elapsed

			const validTime       = elapsedTime <= allowedTime;
			const validHorizontal = Math.abs(distX) >= threshold && Math.abs(distY) <= restraint;
			// const validVertical   = Math.abs(distY) >= threshold && Math.abs(distX) <= restraint;

			if (validTime) {
				if (validHorizontal) // if dist traveled is negative, it indicates left swipe
					swipedir = (distX < 0) ? 'left' : 'right';
				// else if (validVertical) // if dist traveled is negative, it indicates up swipe
				//	swipedir = (distY < 0) ? 'up' : 'down';
			}

			if (swipedir === 'none')
				return;

			const tab = this.activeTab;
			const tabGroup = tab?.closest<TabGroupCmp>('pl-tab-group');
			const maxIndex = this.tabs.length - 1;
			const minIndex = 0;

			// Ensure the target tab is in this tab group
			if (tabGroup !== this)
				return;

			ev.preventDefault();
			let index = this.tabs.indexOf(tab!);

			if ([ 'up', 'left' ].includes(swipedir))
				this.isRtl ? index -- : index ++;
			if ([ 'down', 'right' ].includes(swipedir))
				this.isRtl ? index ++ : index --;

			if (index < minIndex)
				index = maxIndex;
			if (index > maxIndex)
				index = minIndex;

			const nextTab = this.tabs[index];
			if (!nextTab)
				return console.error('New tab does not exist');

			this.setActiveTab(nextTab, { scrollBehavior: 'smooth' });

			if (this.hasScrollControls)
				scrollIntoView(nextTab, this.navQry, 'both');
		};
		target?.addEventListener('touchend', onTouchEnd as any);
	}
	//#endregion


	//#region template
	protected navTpl(placement: 'first' | 'last') {
		const iconProps: Record<string, {
			part: string;
			class: string;
			icon: string;
			click: Parameters<TabGroupCmp['handleScrollTo']>[0];
		}> = {
			topfirst: {
				part:  'scroll-button--start',
				class: 'tab-group__scroll-button--start',
				icon:  this.isRtl ? 'chevron-right' : 'chevron-left',
				click: 'start',
			},
			toplast: {
				part:  'scroll-button--end',
				class: 'tab-group__scroll-button--end',
				icon:  this.isRtl ? 'chevron-left' : 'chevron-right',
				click: 'end',
			},

			bottomfirst: {
				part:  'scroll-button--start',
				class: 'tab-group__scroll-button--start',
				icon:  this.isRtl ? 'chevron-right' : 'chevron-left',
				click: 'start',
			},
			bottomlast: {
				part:  'scroll-button--end',
				class: 'tab-group__scroll-button--end',
				icon:  this.isRtl ? 'chevron-left' : 'chevron-right',
				click: 'end',
			},

			startfirst: {
				part:  'scroll-button--top',
				class: 'tab-group__scroll-button--top',
				icon:  'chevron-up',
				click: 'top',
			},
			startlast: {
				part:  'scroll-button--bottom',
				class: 'tab-group__scroll-button--bottom',
				icon:  'chevron-down',
				click: 'bottom',
			},

			endfirst: {
				part:  'scroll-button--top',
				class: 'tab-group__scroll-button--top',
				icon:  'chevron-up',
				click: 'top',
			},
			endlast: {
				part:  'scroll-button--bottom',
				class: 'tab-group__scroll-button--bottom',
				icon:  'chevron-down',
				click: 'bottom',
			},
		};

		const props = iconProps[this.placement + placement]!;

		return when(this.hasScrollControls, () => html`
		<pl-button
			part       =${ 'scroll-button ' + props.part }
			exportparts="base:scroll-button__base"
			type       ="icon"
			variant    ="elevated"
			shape      ="rounded"
			size       ="x-small"
			label      =${ this.localizeCtrl.term('scrollToStart') }
			class      =${ classMap({
				'tab-group__scroll-button': true,
				[props.class]:              true,
			}) }
			@click     =${ () => this.handleScrollTo(props.click) }
		>
			<pl-boot-icon
				icon=${ props.icon }
			></pl-boot-icon>
		</pl-button>
	`);
	}

	public override render() {
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
		componentStyles,
		css` /* variables */
		:host {
			--indicator-color: var(--primary);
			--track-color: var(--surface-variant);
			--track-width: 2px;
		}
		`,
		css` /* defaults */
		:host {
			display: block;
			overflow: hidden;
		}
		.tab-group {
			display: flex;
			border: solid 1px transparent;
			border-radius: 0;
		}
		.tab-group .tab-group__tabs {
			position: relative;
			display: flex;
			gap: var(--spacing-s);
		}
		.tab-group__nav-container {
			position: relative;
			display: grid;
			overflow: hidden;
		}
		.tab-group__nav {
			display: grid;
			padding: var(--spacing-xs);

		}
		.tab-group .tab-group__indicator {
			position: absolute;
		}
		.tab-group__scroll-button {
			position: absolute;
			display: grid;
			place-items: center;
		}
		.tab-group__body {
			display: grid;
			overflow: hidden;
		}

		/* Hide scrollbar in Firefox */
		.tab-group__nav {
			scrollbar-width: none;
		}
		/* Hide scrollbar in Chrome/Safari */
		.tab-group__nav::-webkit-scrollbar {
			width: 0;
			height: 0;
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
			top: 0;
			height: 100%;
		}
		.tab-group--top .tab-group__scroll-button:first-of-type {
			left: 0;
		}
		.tab-group--top .tab-group__scroll-button:last-of-type {
			right: 0;
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
			padding-bottom: var(--spacing-xs);
			border-bottom: solid var(--track-width) var(--track-color);
		}
		.tab-group--top .tab-group__indicator {
			bottom: calc(-1 * var(--track-width));
			border-bottom: solid var(--track-width) var(--indicator-color);
		}
		.tab-group--top .tab-group__body {
			order: 2;
		}
		.tab-group--top ::slotted(pl-tab-panel) {
			--padding: var(--spacing-s) 0;
		}
		.tab-group--top.tab-group--has-scroll-controls .tab-group__nav-container {
			padding: 0 var(--spacing-xl);
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
		.tab-group--bottom .tab-group__nav-container {
			order: 2;
		}
		.tab-group--bottom .tab-group__nav {
			overflow-x: auto;
			padding-top: 0px;
		}
		.tab-group--bottom .tab-group__tabs {
			flex-direction: row;
			padding-top: var(--spacing-xs);
			border-top: solid var(--track-width) var(--track-color);
		}
		.tab-group--bottom .tab-group__indicator {
			top: calc(-1 * var(--track-width));
			border-top: solid var(--track-width) var(--indicator-color);
		}
		.tab-group--bottom .tab-group__body {
			order: 1;
		}
		.tab-group--bottom ::slotted(pl-tab-panel) {
			--padding: var(--spacing-s) 0;
		}
		.tab-group--bottom.tab-group--has-scroll-controls .tab-group__nav-container {
			padding: 0 var(--spacing-xl);
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
			padding-right: var(--spacing-xs);
			border-inline-end: solid var(--track-width) var(--track-color);
		}
		.tab-group--start .tab-group__indicator {
			right: calc(-1 * var(--track-width));
			border-right: solid var(--track-width) var(--indicator-color);
		}
		.tab-group--start .tab-group__body {
			order: 2;
		}
		.tab-group--start ::slotted(pl-tab-panel) {
			--padding: 0 var(--spacing-s);
		}
		.tab-group--start.tab-group--has-scroll-controls .tab-group__nav-container {
			padding: var(--spacing-xl) 0;
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
			padding-left: var(--spacing-xs);
			border-left: solid var(--track-width) var(--track-color);
		}
		.tab-group--end .tab-group__indicator {
			left: calc(-1 * var(--track-width));
			border-inline-start: solid var(--track-width) var(--indicator-color);
		}
		.tab-group--end .tab-group__body {
			order: 1;
		}
		.tab-group--end ::slotted(pl-tab-panel) {
			--padding: 0 var(--spacing-s);
		}
		.tab-group--end.tab-group--has-scroll-controls .tab-group__nav-container {
			padding: var(--spacing-xl) 0;
		}
		`,
	];
	//#endregion

}


declare global {
	interface HTMLElementTagNameMap {
		'pl-tab-group': TabGroupCmp;
	}
}
