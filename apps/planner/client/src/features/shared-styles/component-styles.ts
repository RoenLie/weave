import { css } from 'lit';

import { cssReset } from './css-reset.js';


export const componentStyles = css`
	@layer reset, default;

	${ cssReset }
	:host([invisible]),
	[invisible] {
		visibility: hidden !important;
	}
	:host([hidden]),
	[hidden] {
		display: none !important;
  	}
	:host, *, *::before, *::after {
		box-sizing: border-box;
		-webkit-tap-highlight-color: transparent;
	}
	:host {
		display: block;

		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		text-rendering: optimizeLegibility;

		font-family: var(--typescale-body-medium-font-family-name);
		font-weight: var(--typescale-body-medium-font-weight);
		font-size: var(--typescale-body-medium-font-size);
		line-height: var(--typescale-body-medium-line-height);
		letter-spacing: var(--typescale-body-medium-letter-spacing);
	}
	:host::-webkit-scrollbar, :host *::-webkit-scrollbar {
		width: var(--scrollbar-width, 0.6rem);
		height: var(--scrollbar-height, 0.6rem);
	}
	:host::-webkit-scrollbar-track, :host *::-webkit-scrollbar-track {
		background: var(--scrollbar-track, inherit);
	}
	:host::-webkit-scrollbar-thumb, :host *::-webkit-scrollbar-thumb {
		background: var(--scrollbar-thumb-bg, hsl(0, 0%, 70%));
		border-radius: var(--scrollbar-thumb-border-radius, 0.2rem);
		-webkit-background-clip: padding-box;
		background-clip: padding-box;
	}
	:host::-webkit-scrollbar-corner, :host *::-webkit-scrollbar-corner {
		background: var(--scrollbar-corner, rgba(0, 0, 0, 0));
	}
`;
