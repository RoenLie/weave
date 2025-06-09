import { AdapterElement, css, customElement, property } from '@roenlie/custom-element/adapter';
import { ifDefined } from '@roenlie/custom-element/shared';
import { toJSX } from 'jsx-lit';

import { cssreset } from '../styles/css-reset.ts';


@customElement('ho-badge')
export class BadgeElement extends AdapterElement {

	@property(String) accessor variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
	@property(String) accessor href: string | undefined;

	protected override render(): unknown {
		const Tag = this.href ? 'a' : 'span';

		return (
			<Tag
				id="base"
				tabindex="0"
				href={ ifDefined(this.href) }
				classList={{ [this.variant]: true }}
			>
				<slot></slot>
			</Tag>
		);
	}

	static override styles = [
		cssreset,
		css`
		:host {
			flex-shrink: 0;
			display: inline-flex;
			width: fit-content;
		}
		#base {
			overflow: hidden;
			display: grid;
			align-items: center;
			justify-content: center;
			gap: var(--gap-1);

			border: 1px solid transparent;
			border-radius: var(--rounded-md);
			padding-block: var(--padding-0_5);
			padding-inline: var(--padding-2);

			font-size: var(--text-xs);
    		line-height: var(--text-xs--line-height);
			font-weight: var(--font-weight-medium);
			white-space: nowrap;

			transition-property: color, box-shadow;
			transition-timing-function: var(--default-transition-timing-function);
			transition-duration: var(--default-transition-duration);

			--tw-ring-color: color-mix(in oklab, var(--ring) 50%, transparent);
			--tw-ring-shadow: 0 0 0 calc(3px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);

			&:focus-visible {
				border-color: var(--ring);
        		box-shadow:
					var(--tw-inset-shadow),
					var(--tw-inset-ring-shadow),
					var(--tw-ring-offset-shadow),
					var(--tw-ring-shadow),
					var(--tw-shadow);
			}
		}
		:host([variant='default']) #base {
			background-color: var(--primary);
			color: var(--primary-foreground);

			&:hover {
				background-color: var(--primary_90);
			}
		}
		:host([variant='secondary']) #base {
			background-color: var(--secondary);
			color: var(--secondary-foreground);

			&:hover {
				background-color: var(--secondary_90);
			}
		}
		:host([variant='outline']) #base {
			background-color: var(--background);
			color: var(--foreground);
			border-color: var(--border);

			&:hover {
				background-color: var(--accent);
				color: var(--accent-foreground);
			}
		}
		:host([variant='destructive']) #base {
			background-color: var(--destructive);
			color: var(--color-white);

			&:hover {
				background-color: var(--destructive_90);
			}
			&:focus-visible {
				--tw-ring-color: var(--destructive_20);
			}

			@container style(--scheme: dark) {
				background-color: var(--destructive_60);

				&:focus-visible {
					--tw-ring-color: var(--destructive_40);
				}
			}
		}
		`,
	];

}


export const Badge = toJSX(BadgeElement);


declare global {
	namespace JSX {
		interface CustomElementTags {
			/**
			 * {@link BadgeElement}
			 */
			'ho-badge': JSXProps<BadgeElement>;
		}
	}
}
