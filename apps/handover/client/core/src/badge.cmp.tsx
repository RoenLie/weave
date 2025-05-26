import { AdapterElement, css, customElement } from '@roenlie/custom-element/adapter';
import { toJSX } from '@roenlie/lit-jsx';


const Kake = () => (
	<div>
		<span>Test</span>
	</div>
);


@customElement('ho-badge')
export class BadgeElement extends AdapterElement {

	override connected(): void {
		super.connected();
	}

	protected override render(): unknown {
		return (
			<>
				<span class="badge">
					<slot>Default Badge</slot>
				</span>
				<Kake />
			</>
		);
	}

	static override styles = css`
	`;

}

export const Badge = toJSX(BadgeElement);
