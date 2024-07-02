import { css } from 'lit';

export const sharedStyles = css`
:host {
	box-sizing: border-box;
}
* {
	box-sizing: border-box;
}
h1, h2, h3, h4, h5, h6 {
	all: unset;
	box-sizing: border-box;
}
ul, li {
	all: unset;
	display: block;
	box-sizing: border-box;
}
:host::-webkit-scrollbar, *::-webkit-scrollbar {
	width: var(--scrollbar-width, 8px);
	height: var(--scrollbar-height, 8px);
}

:host::-webkit-scrollbar-track, *::-webkit-scrollbar-track {
	background: var(--scrollbar-track, transparent);
}

:host::-webkit-scrollbar-thumb, *::-webkit-scrollbar-thumb {
	background: var(--scrollbar-thumb-bg, rgba(255,255,255, 0.2));
	border-radius: var(--scrollbar-thumb-border-radius, 0.2rem);
	-webkit-background-clip: padding-box;
	background-clip: padding-box;
}

:host::-webkit-scrollbar-corner, *::-webkit-scrollbar-corner {
	background: var(--scrollbar-corner, rgba(0, 0, 0, 0));
}
`;
