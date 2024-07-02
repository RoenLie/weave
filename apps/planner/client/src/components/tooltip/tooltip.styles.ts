import { css } from 'lit';

import { componentStyles } from '../../features/shared-styles/component-styles.js';


/** @internalexport */
export const tooltipStyleProps = css`
:host {
	--tooltip-border-radius: var(--border-radius-s);
	--tooltip-arrow-size: 16px;
	--tooltip-index: var(--index-tooltip);
	--tooltip-background-color: var(--primary);
	--tooltip-color: var(--on-primary);
	--tooltip-padding: 6px 16px;
}
`;

export const tooltipStyles = [
	componentStyles,
	tooltipStyleProps,
	css`
	:host {
		--max-width: 20rem;
		--hide-delay: 0ms;
		--show-delay: 500ms;
		display: contents;
	}
	.tooltip-positioner {
		position: absolute;
		z-index: var(--tooltip-index);
		pointer-events: none;
	}

	:host([data-placement^='top']) .tooltip {
		transform-origin: bottom;
	}
	:host([data-placement^='top']) .tooltip__arrow {
		transform: rotate(180deg);
	}

	:host([data-placement^='bottom']) .tooltip {
		transform-origin: top;
	}
	:host([data-placement^='bottom']) .tooltip__arrow {
		transform: rotate(0deg);
	}

	:host([data-placement^='right']) .tooltip {
		transform-origin: right;
	}
	:host([data-placement^='right']) .tooltip__arrow {
		transform: rotate(270deg);
	}

	:host([data-placement^='left']) .tooltip {
		transform-origin: left;
	}
	:host([data-placement^='left']) .tooltip__arrow {
		transform: rotate(90deg);
	}

	.tooltip__content {
		padding: var(--tooltip-padding);
		border-radius: var(--tooltip-border-radius);
		background-color: var(--tooltip-background-color);
		color: var(--tooltip-color);
	}

	.tooltip__arrow {
		position: absolute;
		display: flex;
		flex-direction: column;
		align-items: center;
		width: calc(var(--tooltip-arrow-size) * 2);
		height: calc(var(--tooltip-arrow-size) * 2);
	}
	.tooltip__arrow svg path,
	.tooltip__arrow svg rect {
		fill: var(--tooltip-background-color);
	}
	`,
];
