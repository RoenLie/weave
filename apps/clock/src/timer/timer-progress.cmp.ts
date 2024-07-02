import { component } from '@roenlie/lit-fabric/core';
import { useProperty, useQuery, useState, useWillUpdate } from '@roenlie/lit-fabric/hooks';
import { sharedStyles } from '@roenlie/lit-utilities/styles';
import { css, html, LitElement } from 'lit';


export interface ProgressRingElement extends LitElement {
	value: number;
	label: string;
}


export const ClkProgress = component('clk-progress-ring', element => {
	const [ value ] = useProperty('value', 0, { type: Number });
	const [ label ] = useProperty('label', '');
	const [ offset, setOffset ] = useState<string | undefined>('indicatorOffset', undefined);
	const indicator = useQuery<SVGCircleElement>('indicator', '.progress-ring__indicator');

	useWillUpdate((_) => {
		/**
		 * This hook is only required for Safari because it doesn't transition the circle when the custom properties
		 * change, possibly because of a mix of pixel + unit-less values in the calc() function. It seems like a Safari bug,
		 * but I couldn't pinpoint it so this works around the problem.
		 */
		if (!element.hasUpdated)
			return;

		const radius = parseFloat(getComputedStyle(indicator.value).getPropertyValue('r'));
		const circumference = 2 * Math.PI * radius;
		const offset = circumference - (value.value / 100) * circumference;

		setOffset(`${ offset }px`);
	}, [ 'value' ]);

	return ({
		render: () => html`
		<div
			part="base"
			class="progress-ring"
			role="progressbar"
			aria-label=${ label.value.length > 0 ? label.value : 'progress' }
			aria-valuemin="0"
			aria-valuemax="100"
			aria-valuenow="${ value.value }"
			style="--percentage: ${ value.value / 100 }"
		>
			<svg class="progress-ring__image">
				<circle class="progress-ring__track"></circle>
				<circle
					class="progress-ring__indicator"
					style="stroke-dashoffset: ${ offset.value }"
				></circle>
			</svg>
			<span part="label" class="progress-ring__label">
				<slot></slot>
			</span>
		</div>
		`,
		styles: [
			sharedStyles,
			css`
			:host {
				--size: 128px;
				--track-width: 8px;
				--track-color: var(--surface-variant);
				--indicator-width: var(--track-width);
				--indicator-color: var(--primary);
				display: inline-flex;
			}
			.progress-ring {
				display: inline-flex;
				align-items: center;
				justify-content: center;
				position: relative;
			}
			.progress-ring__image {
				width: var(--size);
				height: var(--size);
				transform: rotate(-90deg);
				transform-origin: 50% 50%;
			}
			.progress-ring__track,
			.progress-ring__indicator {
				--radius: calc(var(--size) / 2 - max(var(--track-width), var(--indicator-width)) * 0.5);
				--circumference: calc(var(--radius) * 2 * 3.141592654);
				fill: none;
				r: var(--radius);
				cx: calc(var(--size) / 2);
				cy: calc(var(--size) / 2);
			}
			.progress-ring__track {
				stroke: var(--track-color);
				stroke-width: var(--track-width);
			}
			.progress-ring__indicator {
				stroke: var(--indicator-color);
				stroke-width: var(--indicator-width);
				stroke-linecap: round;
				transition: 0.35s stroke-dashoffset;
				stroke-dasharray: var(--circumference) var(--circumference);
				stroke-dashoffset: calc(var(--circumference) - var(--percentage) * var(--circumference));
			}
			.progress-ring__label {
				display: flex;
				align-items: center;
				justify-content: center;
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				text-align: center;
				user-select: none;
			}
			`,
		],
	});
});
