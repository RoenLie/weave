import { css } from 'lit';


export const componentStyles = css`
	/* Reset */
	${ css`
	/* We use this instead of the more global one above,
	as using * also overrides all :host styles. */
	:where(article),
	:where(aside),
	:where(footer),
	:where(header),
	:where(main),
	:where(nav),
	:where(section),
	:where(button),
	:where(datalist),
	:where(fieldset),
	:where(form),
	:where(label),
	:where(meter),
	:where(optgroup),
	:where(option),
	:where(output),
	:where(progress),
	:where(select),
	:where(textarea),
	:where(menu),
	:where(ul),
	:where(li),
	:where(ol),
	:where(p) {
		all: unset;
		display: revert;
	}

	/* Preferred box-sizing value */
	:where(*),
	:where(*::before),
	:where(*::after) {
		box-sizing: border-box;
	}

	/* Reapply the pointer cursor for anchor tags */
	a, button {
		cursor: revert;
	}

	/*Remove list styles (bullets/numbers)
	ol, ul, menu {
		list-style: none;
	}*/

	/* removes spacing between cells in tables */
	table {
		border-collapse: collapse;
	}

	/* Safari - solving issue when using user-select:none on the <body> text input doesn't working */
	input, textarea {
		-webkit-user-select: auto;
	}

	/* revert the 'white-space' property for textarea elements on Safari */
	textarea {
		white-space: revert;
	}

	/* minimum style to allow to style meter element */
	meter {
		-webkit-appearance: revert;
		appearance: revert;
	}

	/* reset default text opacity of input placeholder */
	::placeholder {
		color: unset;
	}

	/* fix the feature of 'hidden' attribute.
		display:revert; revert to element instead of attribute */
	:where([hidden]) {
		display: none;
	}

	/* revert for bug in Chromium browsers
		- fix for the content editable attribute will work properly.
		- webkit-user-select: auto; added for Safari in case of using user-select:none on wrapper element*/
	:where([contenteditable]:not([contenteditable="false"])) {
		-moz-user-modify: read-write;
		-webkit-user-modify: read-write;
		overflow-wrap: break-word;
		line-break: auto;
		-webkit-line-break: after-white-space;
		-webkit-user-select: auto;
	}

	/* apply back the draggable feature - exist only in Chromium and Safari */
	:where([draggable="true"]) {
		-webkit-user-drag: element;
	}

	/* remove margin form all H tags */
	h1,
	h2,
	h3,
	h4,
	h5,
	h6,
	p {
		margin: 0;
	}
	` }

	/* General */
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
		font-family: "Open Sans", "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", "Oxygen",
		"Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue",
		sans-serif;
		font-size: 16px;
	}

	/* Scrollbars */
	:host::-webkit-scrollbar, *::-webkit-scrollbar {
		width: var(--scrollbar-width, 0.5rem);
		height: var(--scrollbar-height, 0.5rem);
	}
	:host::-webkit-scrollbar-track, *::-webkit-scrollbar-track {
		background: var(--scrollbar-track, inherit);
	}
	:host::-webkit-scrollbar-thumb, *::-webkit-scrollbar-thumb {
		background: var(--scrollbar-thumb-bg, hsl(0, 0%, 30%));
		border-radius: var(--scrollbar-thumb-border-radius, 2px);
		background-clip: padding-box;
	}
	:host::-webkit-scrollbar-corner, *::-webkit-scrollbar-corner {
		background: var(--scrollbar-corner, var(--scrollbar-track, inherit));
	}
`;
