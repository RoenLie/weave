import { sleep } from '@roenlie/core/async';
import type { stringliteral } from '@roenlie/core/types';
import { AdapterElement, css, customElement, property, SlotController, state } from '@roenlie/custom-element/adapter';
import { ifDefined, type ReactiveController, when } from '@roenlie/custom-element/shared';
import { toJSX } from '@roenlie/lit-jsx';
import { cva, type VariantProps } from 'class-variance-authority';

import { cssreset } from '../css-reset.ts';
import { typography } from '../typography.ts';


const badgeVariants = cva(
	'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
	{
		variants: {
			variant: {
				default:
          'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
				secondary:
          'border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
				destructive:
          'border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
				outline:
          'text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	},
);


@customElement('ho-badge')
export class BadgeElement extends AdapterElement {

	@property(String) accessor variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
	@property(String) accessor href: string | undefined;

	protected slotCtrl = new SlotController(this);

	override connected(): void {
		super.connected();
	}

	protected override render(): unknown {
		const Tag = this.href ? 'a' : 'span';

		console.log('logged');

		return (
			<Tag
				id="base"
				tabindex="0"
				class="text-xs_leading-normal_semibold"
				href={ ifDefined(this.href) }
			>
				<slot></slot>
			</Tag>
		);
	}

	static override styles = [
		cssreset,
		typography,
		css`
		:host {
			display: inline-flex;
		}
		#base {
			border: var(--border-width_border) solid var(--base_transparent);
			border-radius: var(--border-radius_rounded-md);
			padding-block: var(--spacing_0-5);
			padding-inline: var(--spacing_2);
		}
		:host([variant='default']) #base {
			background-color: var(--base_primary);
			color: var(--base_primary-foreground);
		}
		:host([variant='secondary']) #base {
			background-color: var(--base_secondary);
			color: var(--base_secondary-foreground);
		}
		:host([variant='outline']) #base {
			background-color: var(--base_background);
			color: var(--base_foreground);
			border-color: var(--base_border);
		}
		:host([variant='destructive']) #base {
			background-color: var(--base_destructive_70);
			color: var(--base_destructive-foreground);

			&:hover {
				background-color: var(--base_destructive_90);
			}
		}
		`,
	];

}


export const Badge = toJSX(BadgeElement);
