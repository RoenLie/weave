import { AdapterElement, css, type CSSStyle, customElement } from '@roenlie/custom-element/adapter';
import { toJSX } from 'jsx-lit';

import { Badge } from '../components/badge.cmp.tsx';


@customElement('ho-badge-page')
export class BadgePageCmp extends AdapterElement {

	protected override render(): unknown {
		return (
			<>
				<Badge variant="default">
					Badge
				</Badge>
				<Badge variant="secondary">
					Badge
				</Badge>
				<Badge variant="outline">
					Badge
				</Badge>
				<Badge variant="destructive">
					Badge
				</Badge>
			</>
		);
	}

	static override styles: CSSStyle = css`
		:host {
			display: grid;
			grid-auto-flow: column;
			place-items: center;
		}
	`;

}


export const BadgePage = toJSX(BadgePageCmp);
