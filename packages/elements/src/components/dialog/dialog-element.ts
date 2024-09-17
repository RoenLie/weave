import { resolvablePromise } from '@roenlie/core/async';
import { customElement, MimicElement } from '@roenlie/lit-utilities/element';
import { sharedStyles } from '@roenlie/lit-utilities/styles';
import { css, CSSResult, html } from 'lit';
import { property, query } from 'lit/decorators.js';


declare global {
	interface HTMLElementTagNameMap {
		'mm-dialog': MMDialog;
	}
}


export type DialogOptions = Partial<{ modal: boolean; closeOnBlur: boolean; }>;
export type StateConfigFn = (dialog: MMDialog) => (Promise<any> | any);
export type ActionConfigFn<T extends StateConfigFn> = (
	dialog: MMDialog,
	state: Awaited<ReturnType<T>>
) => any;
export interface TemplateConfigFn<
	TState extends StateConfigFn,
	TActions extends ActionConfigFn<TState>
> {
	initialize?: (
		dialog: MMDialog,
		state: Awaited<ReturnType<TState>>,
		actions: ReturnType<TActions>
	) => (Promise<any> | any);
	afterConnected?: (
		dialog: MMDialog,
		state: Awaited<ReturnType<TState>>,
		actions: ReturnType<TActions>
	) => (Promise<any> | any);
	render: (
		dialog: MMDialog,
		state: Awaited<ReturnType<TState>>,
		actions: ReturnType<TActions>
		) => unknown,
	style?: CSSResult
}


export class DialogConfig {

	public options:         DialogOptions;
	public stateCreator:    StateConfigFn;
	public actionCreator:   ActionConfigFn<any>;
	public templateCreator: TemplateConfigFn<any, any>;

	public config(options: DialogOptions) {
		this.options = options;

		return {
			state: <T extends StateConfigFn>(stateCreator?: T) => {
				this.stateCreator = stateCreator ?? (() => {});

				return {
					actions: <TActions extends ActionConfigFn<T>>(actionCreator?: TActions) => {
						this.actionCreator = actionCreator ?? (() => {});

						return {
							template: (templateCreator: TemplateConfigFn<T, TActions>) => {
								this.templateCreator = templateCreator;

								return this as DialogConfig;
							},
						};
					},
				};
			},
		};
	}

	public create(host: HTMLElement) {
		const appendFn = host.shadowRoot
			? (el: MMDialog) => host.shadowRoot!.append(el)
			: (el: MMDialog) => host.insertAdjacentElement('afterend', el);

		const dialogEl = document.createElement(MMDialog.tagName) as MMDialog;
		dialogEl.config = this;

		appendFn(dialogEl);

		return dialogEl;
	}

}


@customElement('mm-dialog')
export class MMDialog extends MimicElement {

	@property({ type: Object }) public config?: DialogConfig;

	public modal?:       boolean;
	public closeOnBlur?: boolean;

	@query('.host') public innerDialog?: HTMLDivElement;
	@query('dialog') public dialog?:     HTMLDialogElement;
	protected parsedConfig?: {
		render: () => unknown;
		style:  CSSResult;
	};

	public complete = resolvablePromise();

	public override async connectedCallback() {
		super.connectedCallback();

		if (!this.config)
			throw new Error('No config supplied to dialog.');

		this.modal = this.config.options.modal;
		this.closeOnBlur = this.config.options.closeOnBlur;

		await this.updateComplete;

		const awaitedState = await this.config?.stateCreator?.(this) ?? {};
		const state = new Proxy(
			awaitedState, {
				set: (target, p, newValue) => {
					const oldValue = target[p];
					if (oldValue !== newValue) {
						target[p] = newValue;
						this.requestUpdate();

						return true;
					}

					return true;
				},
			},
		);

		this.parsedConfig = {
			render: () => this.config!.templateCreator.render(this, state, actions),
			style:  this.config.templateCreator.style ?? css``,
		};

		const actions = this.config.actionCreator?.(this, state) ?? {};
		await this.config.templateCreator.initialize?.(this, state, actions);

		this.requestUpdate();
		await this.updateComplete;

		if (this.modal)
			this.dialog?.showModal();
		else
			this.dialog?.show();

		this.config.templateCreator.afterConnected?.(this, state, actions);
	}

	public close(returnValue?: any) {
		this.dialog?.close(returnValue);
		this.complete.resolve(returnValue);
	}

	protected handleClose(ev?: CloseEvent) {
		const event = new CloseEvent('close', { ...ev });
		this.dispatchEvent(event);

		this.remove();
	}

	protected handleMousedown(ev: PointerEvent) {
		if (!this.closeOnBlur)
			return;

		const path = ev.composedPath() as HTMLElement[];
		if (!path.some(el => el === this.innerDialog))
			return this.dialog!.close();
	}

	protected override render() {
		return html`
		<style>${ this.parsedConfig?.style }</style>

		<dialog part="dialog"
			@close=${ (ev: CloseEvent) => this.handleClose(ev) }
			@mousedown=${ this.handleMousedown }
		>
			<div class="host">
				${ this.parsedConfig?.render() }
			</div>
		</dialog>
		`;
	}

	public static override styles = [
		sharedStyles,
		css` /* variables */
		/* Here the props are on the inner host, as that's where we can override them from config. */
		.host {
			--_dialog-bg-color: var(--mm-dialog-bg-color, var(--mm-surface));
			--_dialog-txt-color: var(--mm-dialog-txt-color, var(--mm-on-surface));
			--_dialog-border-color: var(--mm-dialog-border-color: var(--mm-outline-decoration-secondary-gradient));
		}
		`,
		css`
		:host {
			display: contents;
		}
		dialog {
			padding: 0px;
			overflow: hidden;
			background: transparent;
			border: none;
			outline: none;
		}
		:where(.host) {
			display: grid;
			grid-auto-flow: row;
			grid-auto-rows: max-content;
			height: 100%;
			gap: 8px;
			padding: 6px;
			color: var(--_dialog-txt-color);
			background-color: var(--_dialog-bg-color);
			border: 2px solid var(--_dialog-border-color);
			border-radius: 16px;
		}
		`,
	];

}
