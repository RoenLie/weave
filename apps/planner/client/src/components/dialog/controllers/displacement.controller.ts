import { arraySum } from '@roenlie/core/array';
import { resolveValueProvider } from '@roenlie/core/function';
import { LitElement, ReactiveController, ReactiveControllerHost } from 'lit';

import { IConstraints } from './controller.types.js';


/** @internalexport */
export class DisplacementController<T extends LitElement> implements ReactiveController {

	private _host: T;
	private _mutObserver: MutationObserver = new MutationObserver(() => this._handleMutation());

	private _handleMutation() {
		this._displaceable()
			? addEventListener('resize', this.windowResize)
			: removeEventListener('resize', this.windowResize);
	}

	private _displaceable() {
		return this._host.getAttribute('displaceable') !== null;
	}


	constructor(
		host: ReactiveControllerHost,
		private constraints: () => IConstraints,
		private setXY: (v: readonly [x: string, y: string]) => void,
		private setSize: (size: readonly [width: string, height: string]) => void,
	) {
		host.addController(this);
		this._host = host as T;
	}

	public async hostConnected() {
		this._mutObserver.observe(this._host, {
			attributes: true, attributeOldValue: true, attributeFilter: [ 'displaceable' ],
		});
		this._handleMutation();
	}

	public hostDisconnected() {
		removeEventListener('resize', this.windowResize);
		this._mutObserver.disconnect();
	}

	public windowResize = () => requestIdleCallback(async () => {
		// Getting dimensions from dom outside request animation frame,
		// this is to avoid double paints.
		const rects = this._host.getBoundingClientRect();
		const width = this._host.offsetWidth;
		const height = this._host.offsetHeight;

		const { x: constX, y: constY } = this.constraints();

		const lowerLimitX = resolveValueProvider(constX[0]);
		const upperLimitX = resolveValueProvider(constX[1]);
		const lowerLimitY = resolveValueProvider(constY[0]);
		const upperLimitY = resolveValueProvider(constY[1]);

		const x = rects.left >= lowerLimitX && rects.right < upperLimitX
			? rects.x : upperLimitX - rects.width >= lowerLimitX
				? upperLimitX - rects.width - 1 : lowerLimitX;

		const y = rects.top >= lowerLimitY && rects.bottom < upperLimitY
			? rects.y : upperLimitY - rects.height >= lowerLimitY
				? upperLimitY - rects.height - 1 : lowerLimitY;

		// If there is no difference in suggested and actual position, don't set the position again.
		const diff = Math.abs(arraySum([ x, y ]) - arraySum([ rects.x, rects.y ]));
		if (diff !== 0)
			this.setXY([ x + 'px', y + 'px' ] as const);

		let newWidth: string | undefined;
		let newHeight: string | undefined;

		const constraintWidth = upperLimitX - lowerLimitX;
		const constraintHeight = upperLimitY - lowerLimitY;
		if (width > constraintWidth)
			newWidth = constraintWidth + 'px';
		if (height > constraintHeight)
			newHeight = constraintHeight + 'px';

		if (newWidth || newHeight) {
			newWidth = newWidth || width + 'px';
			newHeight = newHeight || height + 'px';

			this.setSize([ newWidth, newHeight ]);
		}
	});

}
