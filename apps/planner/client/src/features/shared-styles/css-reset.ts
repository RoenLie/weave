import { css } from 'lit';

export const cssReset = css`
@layer reset {
	/***
		The new CSS reset - version 1.7.2 (last updated 23.6.2022)
		GitHub page: https://github.com/elad2412/the-new-css-reset
	***/

	/*
		Remove all the styles of the "User-Agent-Stylesheet", except for the 'display' property
		- The "symbol *" part is to solve Firefox SVG sprite bug
	*/
	/**:where(:not(html, iframe, canvas, img, svg, video):not(svg *, symbol *)) {
		all: unset;
		display: revert;
		box-sizing: border-box;
	}*/

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
	:where(a),
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

	/* Remove list styles (bullets/numbers) */
	ol, ul, menu {
		list-style: none;
	}

	/* For images to not be able to exceed their container */
	img {
		max-width: 100%;
	}

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
}
`;
