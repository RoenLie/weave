import { animateTo, getAnimation, setDefaultAnimation, shimKeyframesHeightAuto, stopAnimations } from '@roenlie/core/animation';
import { sleep, waitForPromiseSet } from '@roenlie/core/async';
import { Submission } from '@rotul/planner-entities';
import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { map } from 'lit/directives/map.js';
import { when } from 'lit/directives/when.js';

import { componentStyles } from '../../../features/shared-styles/component-styles.js';


@customElement('pl-pending-submissions')
export class PendingSubmissionsCmp extends LitElement {

	protected list: Submission[] = [];
	protected selectedRows = new Set<Submission>();
	protected animationPool = new Set<Promise<any>>();

	private async openSubmission(element: Submission) {
		// Helper function for easily getting the elements we need for animations.
		const getRowElements = (id: string) => ({
			row:        this.renderRoot.querySelector<HTMLElement>(`#${ id }-expanded`),
			rowContent: this.renderRoot.querySelector<HTMLElement>(`#${ id }-expanded-div`),
		});

		// If it is the same row, close it.
		if (this.selectedRows.has(element)) {
			const { row, rowContent } = getRowElements(element.id);
			if (row && rowContent) {
				await stopAnimations(row);

				let { keyframes, options } = getAnimation(row, 'pending.submission.collapse');
				keyframes = shimKeyframesHeightAuto(keyframes, rowContent.scrollHeight);

				await animateTo(row, shimKeyframesHeightAuto(keyframes, rowContent.scrollHeight), options);
			}

			this.selectedRows.delete(element);
			this.requestUpdate();

			return;
		}

		// Add the new row to the selected set.
		this.selectedRows.add(element);

		// We request an update and await both the update and a sleep of 0, to be 100% sure that the element
		// has loaded in, so we are able to get the correct height for animation purposes.
		this.requestUpdate();
		await Promise.all([ await this.updateComplete, await sleep(0) ]);

		// Create an animation pool, so that we can await all open and closing animations.
		const animationPool: (() => Promise<any>)[] = [];

		// if rows are already selected, Initialize closing of those rows before proceeding.
		if (this.selectedRows.size) {
			this.selectedRows.forEach(selected => {
				const { row, rowContent } = getRowElements(selected.id);
				if (!row || !rowContent)
					return;

				const animationName = selected === element
					? 'pending.submission.expand'
					: 'pending.submission.collapse';

				let { keyframes, options } = getAnimation(row, animationName);
				keyframes = shimKeyframesHeightAuto(keyframes, rowContent.scrollHeight);

				animationPool.push(async () => {
					await stopAnimations(row);
					await animateTo(row, keyframes, options);
					if (selected !== element)
						this.selectedRows.delete(selected);
				});
			});
		}

		// Await all the animations then request an update to remove any collapsed rows.
		animationPool.forEach(anim => this.animationPool.add(anim()));
		await waitForPromiseSet(this.animationPool);
		this.requestUpdate();
	}

	public override render() {
		return html`
			<div>Home</div>
			<pl-button shape='rounded' variant='elevated'>
				not preboi
				<div slot='prefix'>
					preboi
				</div>

			</pl-button>
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Type</th>
						<th>From</th>
						<th>To</th>
						<th>Days</th>
						<th>Hours</th>
						<th>Status</th>
					</tr>
				</thead>
			<tbody>
				${ map(this.list, element => html`
					<tr
						id=${ element.id }
						class=${ classMap({
							'row-expanded-header': this.selectedRows.has(element),
						}) }
						@click = ${ () => this.openSubmission(element) }
					>
						<td>${ element.empName }</td>
						<td>${ element.absenceType }</td>
						<td>${ element.dateFrom.toLocaleDateString('en-GB') }</td>
						<td>${ element.dateTo.toLocaleDateString('en-GB') }</td>
						<td>${ element.days }</td>
						<td>${ element.hours }</td>
						<td>${ element.status }</td>
					</tr>

					${ when(this.selectedRows.has(element), () => html`
						<tr class='row-expanded' id='${ element.id }-expanded'>
							<td colspan="69">
								<div class="td-inner-wrapper">
									<div id='${ element.id }-expanded-div' class='div-expanded flex-container'>
										<pl-button shape='rounded' variant='success'>Accept</pl-button>
										<pl-button shape='rounded' variant='error'>Reject</pl-button>
										<pl-button shape='rounded' variant='warning'>Request change</pl-button>
										<pl-button shape='rounded' variant='secondary'>Show in calendar</pl-button>
										<pl-button shape='rounded' variant='secondary'>Open user</pl-button>
									</div>
								</div>
							</td>
						</tr>
					`) }
				`) }
			</tbody>
			</table>
		`;
	}

	public static override styles = [
		componentStyles,
		css`
		:host {
			display: grid;
			place-items: center;
		}
		table {
			width:100%;
			border-collapse: collapse;
			box-shadow: var(--box-shadow-s);
			max-width: 767px;
		}
		table, tr, td, th {
			border-collapse: collapse;
		}
		th {
			font-size: var(--typescale-title-medium-font-size);
			background-color: var(--surface-container);
		}
		tr {
			border-top: none;
			/*border-bottom: none;*/
			border-bottom: 1px solid var(--outline-variant);
		}
		td {
			height: 1px;
			font-size: var(--typescale-label-medium-font-size);
			text-align: center;
		}
		th, td {
			padding: 12px 15px;
		}
		.empName {
			font-size: var(--typescale-label-medium-font-size);
		}
		tr:not(.row-expanded, .row-expanded-header):nth-child(even),
		tr:nth-child(even).row-expanded td {
			background-color: var(--surface);
			color: var(--on-surface);
		}
		tr:not(.row-expanded, .row-expanded-header):nth-child(odd),
		tr:nth-child(odd).row-expanded td {
			background-color: var(--surface-press);
			color: var(--on-surface);
		}
		tbody tr:not(.row-expanded):hover{
			background-color: var(--surface-variant-hover);
		}
		tr.row-expanded {
			height: 0px;
			opacity: 0;
			position: relative;
			overflow: hidden;
		}
		tr.row-expanded td {
			margin: 0;
			padding: 0;
		}
		.row-expanded-header {
			background-color:var(--surface-variant);
			border-bottom: none;
		}
		.td-inner-wrapper {
			position: relative;
			display: grid;
			overflow: hidden;
			height: 100%;
		}
		.div-expanded {
			padding: 12px;
		}
		.flex-container{
			position: absolute;
			display: flex;
			flex-direction: row;
			gap: var(--spacing-s);
			overflow: hidden;
		}
	`,
	];

}


declare global {
	interface HTMLElementTagNameMap {
		'pl-pending-submissions': PendingSubmissionsCmp;
	}

}


setDefaultAnimation('pending.submission.expand', {
	keyframes: [
		{ height: '0px', opacity: '0' },
		{ height: 'auto', opacity: '1' },
	],
	options: { duration: 250, fill: 'forwards', easing: 'ease-out' },
	//options: { duration: 250, fill: 'forwards', easing: 'linear' },
});


setDefaultAnimation('pending.submission.collapse', {
	keyframes: [
		{ height: 'auto', opacity: '1' },
		{ height: '0px', opacity: '0' },
	],
	options: { duration: 250, fill: 'forwards', easing: 'ease-in' },
	//options: { duration: 250, fill: 'forwards', easing: 'linear' },
});
