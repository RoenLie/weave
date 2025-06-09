import { AdapterElement, css, customElement, property } from '@roenlie/custom-element/adapter';
import { cva, type VariantProps } from 'class-variance-authority';
import { toJSX } from 'jsx-lit';

import { cn } from './utils.ts';


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

	@property(String) accessor variant: VariantProps<typeof badgeVariants>['variant'] = 'default';

	override connected(): void {
		super.connected();
	}

	protected override beforeUpdate(changedProps: Map<keyof this, any>): void {
		super.beforeUpdate(changedProps);
	}

	protected override render(): unknown {
		return (
			<span class={cn(badgeVariants({ variant: this.variant }))}>
				<slot></slot>
			</span>
		);
	}

	static override styles = css`
	`;

}

export const Badge = toJSX(BadgeElement);


declare global {

	namespace JSX {
		interface HTMLElementTags {
			'ho-badge': JSXProps<BadgeElement>;
		}
	}
}
