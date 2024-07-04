import { css } from 'lit';


const buttonStyles = css`
@keyframes synapse-buttonclick {
	from {
		aspect-ratio: 1;
		background-color: rgb(255 255 255 / 0.5);
		width: 0px;
	}
	to {
		aspect-ratio: 1;
		width: 150%;
	}
}
button[synapse] {
	all: unset;

	--_hover-bg:;
	--_active-anim:;
	--_border-width: 0px;

	cursor: pointer;
	position: relative;
	border-radius: 999px;
	border: var(--_border-width) solid var(--outline);
	overflow: hidden;

	display: grid;
	grid-auto-flow: column;
	place-items: center;
	place-content: center;
	width: min-content;
	white-space: nowrap;
	height: 40px;
	padding-inline: 12px;
	gap: 4px;

	&::before, &::after {
		content: '';
		position: absolute;
		pointer-events: none;
		border-radius: inherit;
		inset: calc(-1*var(--_border-width));
	}
	&::before {
		background-color: var(--_hover-bg);
	}
	&::after {
		animation: var(--_active-anim);
		animation-delay: 0.1s;
		margin: auto;
	}
	&:hover {
		--_hover-bg: rgb(255 255 255 / 0.2);
	}
	&:focus-within:not(:active, :focus-visible) {
		--_active-anim: 1s ease-out synapse-buttonclick;
	}
	&:focus-visible {
		outline: 2px solid white;
		outline-offset: 2;
	}
	&[outlined=""] {
		--_border-width: 2px;
	}
	> *              { text-align: center; }
	> [slot="start"] { order: 1 }
	> :not([slot])   { order: 2 }
	> [slot="end"]   { order: 3 }
}
`;

const inputStyles = css`
input[synapse] {
	position: relative;
	height: 40px;
	padding-block: 0px;
	padding-inline: 20px;
	font-size: 16px;
	border-radius: 999px;
	border: 2px solid var(--outline);
	outline: none;
	background: none;

	&::-webkit-search-cancel-button {
		filter: grayscale(1);
		padding: 2px;
	}
	&:focus-within {
		outline: 2px solid var(--outline-strong);
	}
}
`;

const imgStyles = css`
img {
	object-fit: contain;
}
:where(img:not([width])) {
	width: 100%;
}
`;

const svgStyles = css`
svg[synapse] {
	overflow: hidden;
	display: grid;
	place-items: center;
	place-self: center;
	fill: currentColor;

	&:not([width][height]) {
		aspect-ratio: 1;
	}
	&:not([width], [height]) {
		width: 16px;
		height: 16px;
	}
}
`;


export const sharedStyles = css`
:where(*, *::before, *::after) {
	box-sizing: border-box;
	color: var(--color);
}
:where(a, p, h1, h2, h3, h4, h5, h6, ul, ol, li) {
	all: unset;
	display: flex;
}
:host {
	font-family: "Inter", sans-serif;
}
${ buttonStyles }
${ inputStyles }
${ imgStyles }
${ svgStyles }
`;
