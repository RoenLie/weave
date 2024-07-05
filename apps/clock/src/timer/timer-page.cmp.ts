import '@roenlie/elements/button';
import '@roenlie/elements/icon';

import { component } from '@roenlie/lit-fabric/core';
import { useOnEvent } from '@roenlie/lit-fabric/hooks';
import { swapItems } from '@roenlie/core/array';
import { domId, type EventOf } from '@roenlie/core/dom';
import { DialogConfig } from '@roenlie/elements/dialog';
import { sharedStyles } from '@roenlie/lit-utilities/styles';
import { css, html } from 'lit';
import { map } from 'lit/directives/map.js';

import { Timer, type TimerElement } from './timer.cmp.js';
import type { TimeFieldElement } from './timer-field.cmp.js';

Timer.register();


interface Timer {
	id: string;
	label: string;
	time: string;
}


export const TimePage = component('clk-timer-page', element => {
	const timers: Timer[] = JSON.parse(localStorage.getItem('clk-timers') ?? '[]');

	useOnEvent('update', (ev: CustomEvent) => {
		console.log('update event');

		const target = ev.composedPath().at(0) as TimerElement;
		const timer = timers.find(t => t.id === target.id);
		console.log({ timer });


		if (timer) {
			timer.label = target.label;
			timer.time = target.time;


			updateLocalStorage();
		}
	});

	useOnEvent('remove', (ev: CustomEvent, element) => {
		const target = ev.composedPath().at(0) as TimerElement;

		const timer = timers.find(t => t.id === target.id);
		if (timer) {
			const indexToRemove = timers.indexOf(timer);
			timers.splice(indexToRemove, 1);
			updateLocalStorage();

			element.requestUpdate();
		}
	});

	const updateLocalStorage = () => {
		localStorage.setItem('clk-timers', JSON.stringify(timers));
	};

	const newDialog = () => {
		new DialogConfig().config({
			modal:       true,
			closeOnBlur: true,
		}).state(() => {
			return {
				label: '',
				time:  '0:0:0',
			};
		}).actions((dialog, state) => {
			return {
				save: () => {
					const timer = { id: domId(), label: state.label, time: state.time };
					timers.push(timer);
					updateLocalStorage();

					element.requestUpdate();

					dialog.close();
				},
			};
		}).template({
			render: (dialog, state, actions) => html`
				<div class="header">
					<mm-text>
						Add new timer
					</mm-text>
				</div>

				<div class="body">
					<clk-time-field
						style="grid-area: time;"
						.value=${ state.time }
						@change=${ (ev: EventOf<TimeFieldElement>) => state.time = ev.target.value }
					></clk-time-field>
					<mm-icon
						style="grid-area: icon;font-size:18px;"
						url="https://icons.getbootstrap.com/assets/icons/pencil-square.svg"
					></mm-icon>
					<mm-input
						style="grid-area: field;"
						label="Name"
						size="large"
						.value=${ state.label }
						@input=${ (ev: EventOf<HTMLInputElement>) => state.label = ev.target.value }
					></mm-input>
				</div>

				<div class="footer">
					<mm-button
						size="small"
						shape="rounded"
						@click=${ actions.save }
					>
						<mm-icon slot="prefix" url="https://icons.getbootstrap.com/assets/icons/save.svg"></mm-icon>
						<mm-text type="body-large">Save</mm-text>
					</mm-button>

					<mm-button
						size="small"
						shape="rounded"
						variant="text"
						@click=${ () => dialog.close() }
					>
						<mm-icon slot="prefix" url="https://icons.getbootstrap.com/assets/icons/x-lg.svg"></mm-icon>
						<mm-text type="body-large">Cancel</mm-text>
					</mm-button>
				</div>
				`,
			style: css`
				dialog::backdrop {
					backdrop-filter: blur(1px);
				}
				.base {
					outline: none;
				}
				.host {
					display: grid;
					grid-template-rows: auto 1fr;
					border-radius: 8px;
					background-color: rgba(40,40,40,1);
					padding-bottom: 12px;
					border: 1px solid rgb(200 200 200 / 50%);
					gap: 12px;
				}
				.header {
					display: grid;
					grid-template-columns: 1fr auto;
					align-items: center;
					padding-left: 12px;
				}
				mm-icon {
					pointer-events: none;
				}
				.body {
					display: grid;
					justify-content: center;
					grid-template: "time time" 1fr
										"icon field" auto
										/ auto 1fr;
					padding-inline: 12px;
					align-items: center;
					gap: 8px;
				}
				.footer {
					display: grid;
					place-items: center;
					grid-template-columns: 1fr 1fr;
					gap: 6px;
					padding-inline: 12px;
					padding-top: 12px;
				}
				`,
		}).create(element);
	};

	return ({
		render: () => html`
		${ map(timers, timer => html`
			<clk-timer
				id   =${ timer.id }
				.label=${ timer.label }
				.time =${ timer.time }
				draggable="true"
				@dragstart=${ (ev: DragEvent) => {
					ev.dataTransfer!.effectAllowed = 'move';
					ev.dataTransfer?.setData('clock-id', timer.id);
				} }
				@dragenter=${ (ev: DragEvent) => ev.preventDefault() }
				@dragover=${ (ev: DragEvent) => ev.preventDefault() }
				@drop=${ (ev: DragEvent) => {
					const dropId = ev.dataTransfer!.getData('clock-id');
					if (dropId !== timer.id) {
						const fromIndex = timers.findIndex(t => t.id === dropId);
						const toIndex = timers.findIndex(t => t.id === timer.id);

						swapItems(timers, fromIndex, toIndex);
						updateLocalStorage();

						element.requestUpdate();
					}
				} }
			></clk-timer>
		`) }

		<div class="controls">
			<mm-button
				type="icon"
				variant="text"
				@click=${ newDialog }
			>
				<mm-icon
					style="font-size:20px;"
					url="https://icons.getbootstrap.com/assets/icons/plus-lg.svg"
				></mm-icon>
			</mm-button>
		</div>
		`,
		styles: [
			sharedStyles,
			css`
			:host {
				overflow: auto;
				display: flex;
				gap: 12px;
				padding-block: 16px;
				padding-inline: 22px;
				flex-flow: row wrap;
				 justify-content: center;
				align-content: start;
			}
			.controls {
				position: absolute;
				right: 25px;
				bottom: 25px;
				display: flex;
				background-color: rgb(50 50 50 / 50%);
				box-shadow: var(--box-shadow-s);
				padding: 8px;
				border: 1px solid rgb(200 200 200 / 25%);
				border-radius: 6px;
				gap: 8px;
			}
			`,
		],
	});
});
