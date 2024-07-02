import { css } from 'lit';

import { joinSelectors } from './join-selectors.js';


export const scrollstyle = (selectors: string[] = [ ':host', '*' ]) => css`
${ joinSelectors(selectors, '::-webkit-scrollbar') } {
	width:                     var(--scrollbar-width, 0.6rem);
	height:                    var(--scrollbar-height, 0.6rem);
}
${ joinSelectors(selectors, '::-webkit-scrollbar-track') } {
	background:                var(--scrollbar-track, inherit);
}
${ joinSelectors(selectors, '::-webkit-scrollbar-thumb') } {
	background:                var(--scrollbar-thumb-bg, hsl(0, 0%, 70%));
	border-radius:             var(--scrollbar-thumb-border-radius, 2px);
	background-clip:           padding-box;
}
${ joinSelectors(selectors, '::-webkit-scrollbar-corner') } {
	background:                var(--scrollbar-corner, var(--scrollbar-track, inherit));
}
`;
