import { css } from 'lit';


export const sharedStyles = css`
	@layer reset {
		/* remove margin form all H tags */
		h1, h2, h3, h4, h5, h6, p {
			margin: 0;
		}
		a, button {
			all: unset;
			cursor: revert;
		}
		/* Remove list styles (bullets/numbers) */
		ol, ul, menu {
			list-style: none;
		}
		:host([invisible]),
		:where([invisible]) {
			visibility: hidden !important;
		}
		:host([hidden]),
		:where([hidden]) {
			display: none !important;
		}
		:host, *, *::before, *::after {
			box-sizing: border-box;
			min-width: 0;
			-webkit-tap-highlight-color: transparent;
		}
		:host::-webkit-scrollbar,
		*::-webkit-scrollbar {
			width: var(--scrollbar-width, 0.6rem);
			height: var(--scrollbar-height, 0.6rem);
		}
		:host::-webkit-scrollbar-track,
		*::-webkit-scrollbar-track {
			background: var(--scrollbar-track, inherit);
		}
		:host::-webkit-scrollbar-thumb,
		*::-webkit-scrollbar-thumb {
			background: var(--scrollbar-thumb-bg, hsl(0, 0%, 70%));
			border-radius: var(--scrollbar-thumb-border-radius, 2px);
			background-clip: padding-box;
		}
		:host::-webkit-scrollbar-corner,
		*::-webkit-scrollbar-corner {
			background: var(--scrollbar-corner, var(--scrollbar-track, inherit));
		}
	}
`;
