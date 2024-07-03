import { resolveValueProvider } from '@roenlie/core/function';
import { LitElement, ReactiveController, ReactiveControllerHost } from 'lit';

import { IConstraints } from './controller.types.js';


/** @internalexport */
export class ResizeController<T extends LitElement> implements ReactiveController {

	private _host: T;
	private _resizeObserver: ResizeObserver;
	private _mutObserver: MutationObserver = new MutationObserver(() => this._handleMutation());

	private _handleMutation() {
		if (this._resizable()) {
			this._host.classList.add('resizable');
			this._resizeObserver.observe((this._host as LitElement));
		}
		else {
			this._host.classList.remove('resizable');
			this._resizeObserver.unobserve((this._host as LitElement));
		}
	}

	private _resizable() {
		return this._host.getAttribute('resizable') !== null;
	}

	constructor(
		host: ReactiveControllerHost,
		private constraints: () => IConstraints,
		private xy: () => Promise<readonly [string, string]>,
	) {
		host.addController(this);
		this._host = host as T;
	}

	public async hostConnected() {
		this._resizeObserver = new ResizeObserver(this._resizeDialog);
		this._mutObserver.observe(this._host, {
			attributes: true, attributeFilter: [ 'resizable' ],
		});
		this._handleMutation();
	}

	public hostDisconnected() {
		this._resizeObserver?.disconnect();
		this._mutObserver.disconnect();
	}

	private _resizeDialog = () => requestIdleCallback(async () => {
		const { x, y } = this.constraints();
		const [ elX, elY ] = (await this.xy()).map(xy => Number(xy.replaceAll('px', '')));

		const upperLimitX = resolveValueProvider(x[1]);
		const upperLimitY = resolveValueProvider(y[1]);

		let maxElWidth = upperLimitX;
		let maxElHeight = upperLimitY;
		if (!this._host.style.margin) {
			maxElWidth = upperLimitX - elX!;
			maxElHeight = upperLimitY - elY!;
		}

		this._host.style.setProperty('max-width', maxElWidth + 'px');
		this._host.style.setProperty('max-height', maxElHeight + 'px');
	});

}
