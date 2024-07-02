import { css, unsafeCSS } from 'lit';

export const inputStyle = (
	selector: string,
) => css`
${ unsafeCSS(selector) } {
	all: unset;
	display: grid;
	width: 100%;
	outline: 1px solid var(--midoc-surface-variant);
	padding-inline: 12px;
	padding-block: 8px;
	border-radius: 4px;
}
`;
