import '@roenlie/elements/text';
import '@roenlie/elements/button';
import '@roenlie/elements/icon';
import '@roenlie/elements/input';

import { component } from '@roenlie/lit-fabric/core';
import { useDisconnected, useProperty, useState, useWillUpdate } from '@roenlie/lit-fabric/hooks';
import { askForNotificationPermissions, emitEvent, type EventOf, notification } from '@roenlie/core/dom';
import { accurateTimer } from '@roenlie/core/timing';
import type { stringliteral } from '@roenlie/core/types';
import { DialogConfig } from '@roenlie/elements/dialog';
import { sharedStyles } from '@roenlie/lit-utilities/styles';
import { css, html, LitElement } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

import { ClkTimeField, type TimeFieldElement } from './timer-field.cmp.js';
import { ClkProgress, type ProgressRingElement } from './timer-progress.cmp.js';

ClkProgress.register();
ClkTimeField.register();
askForNotificationPermissions();


declare global {
	interface HTMLElementTagNameMap {
		'clk-timer': TimerElement;
		'clk-time-field': TimeFieldElement;
		'clk-progress-ring': ProgressRingElement;
	}
}


export interface TimerElement extends LitElement {
	label: string;
	time: `${ string }:${ string }:${ string }` | stringliteral;
}


/**
 * @event update - Indicates that this element has had its values updated.
 * @event remove - Requests removal of this element.
 */
export const Timer = component('clk-timer', element => {
	const [ label, setLabel ] = useProperty('label', '');
	const [ time, setTime ] = useProperty<TimerElement['time']>('time', '0:0:0');

	const [ currentTime, setCurrentTime ] = useState('currentTime', time.value);
	const [ fullscreen, setFullscreen ] = useState('fullscreen', false);
	let cancelCountdown: (() => void) | undefined;

	const getTimePercentage = () => {
		const startDatetime = new Date(0, 0, 0, ...time.value.split(':').map(t => parseInt(t)));
		const currentDatetime = new Date(0, 0, 0, ...currentTime.value.split(':').map(t => parseInt(t)));
		const finishedDatetime = new Date(0, 0, 0, 0, 0, 0);

		const a = 0;
		const b = (currentDatetime.getTime() - finishedDatetime.getTime()) / 1000;
		const c = (startDatetime.getTime() - finishedDatetime.getTime()) / 1000;
		const percentage = ((b - a) / (c - a)) * 100;

		return isNaN(percentage) ? 100 : percentage;
	};

	const handleToggleClick = (ev: Event) => {
		ev.preventDefault();
		ev.stopPropagation();

		if (cancelCountdown) {
			cancelCountdown();
			cancelCountdown = undefined;
		}
		else {
			if (getTime(time.value) === 0)
				return;
			if (getTime(currentTime.value) === 0)
				setCurrentTime(time.value);

			cancelCountdown = accurateTimer(timerFn).cancel;
		}

		element.requestUpdate();
	};

	const timerFn = () => {
		const [ hours, minutes, seconds ] = currentTime.value
			.split(':').map(t => parseInt(t));

		const date = new Date(0, 0, 0, hours, minutes, seconds);
		const newTime = date.getTime() - 1000;
		date.setTime(newTime);

		const time = parseInt(
			date.toTimeString()
				.split(' ').at(0)!.replaceAll(':', '')!,
		);

		if (time === 0) {
			setCurrentTime(date.toTimeString().split(' ').at(0)!);

			cancelCountdown?.();
			cancelCountdown = undefined;
			element.requestUpdate();

			notification('Timer Complete!', label.value);

			return;
		}

		setCurrentTime(date.toTimeString().split(' ').at(0)!);
	};

	const handleEditClick = () => {
		editDialog();
	};

	const editDialog = () => {
		new DialogConfig().config({
			modal:       true,
			closeOnBlur: true,
		}).state(() => {
			return {
				label: label.value,
				time:  time.value,
			};
		}).actions((dialog, state) => {
			return {
				save: () => {
					setLabel(state.label);
					setTime(state.time);

					emitEvent(element, 'update');
					dialog.close();
				},
				delete: () => {
					emitEvent(element, 'remove');
					dialog.close();
				},
			};
		}).template({
			render: (dialog, state, actions) => html`
			<div class="header">
				<mm-text type="body-large">
					Edit timer
				</mm-text>

				<mm-button
					type="icon"
					size="small"
					variant="text"
					@click=${ actions.delete }
				>
					<mm-icon
						style="font-size: 18px;color: var(--error);"
						url="https://icons.getbootstrap.com/assets/icons/trash.svg"
					></mm-icon>
				</mm-button>
			</div>

			<div class="body">
				<clk-time-field
					style="grid-area:time;"
					.value=${ state.time }
					@change=${ (ev: EventOf<TimeFieldElement>) => state.time = ev.target.value }
				></clk-time-field>
				<mm-icon
					style="grid-area: icon;font-size:18px;"
					url="https://icons.getbootstrap.com/assets/icons/pencil-square.svg"
				></mm-icon>
				<mm-input
					style="grid-area:field;"
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
				border: 1px solid rgb(200 200 200 / 25%);
				gap: 12px;
				font-size: 16px;
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

	const handleResetClick = (ev: Event) => {
		ev.preventDefault();
		ev.stopPropagation();

		setCurrentTime(time.value);
	};

	const handleExpandClick = (ev: Event) => {
		ev.preventDefault();
		ev.stopPropagation();

		setFullscreen(!fullscreen.value);

		element.updateComplete.then(() => {
			if (fullscreen.value)
				element.renderRoot.querySelector('dialog')?.showModal();
		});
	};

	const getTime = (timeString: typeof time.value) => {
		const [ hours, minutes, seconds ] = timeString
			.split(':').map(t => parseInt(t));

		return parseInt(
			new Date(0, 0, 0, hours, minutes, seconds).toTimeString()
				.split(' ').at(0)!.replaceAll(':', '')!,
		);
	};

	useDisconnected(() => {
		cancelCountdown?.();
	});

	useWillUpdate(() => {
		setCurrentTime(time.value);
	}, [ 'time' ]);

	const fullscreenTemplate = () => {
		return html`
		<dialog>
			<div class="container fullscreen">
				<div class="header">
					<mm-text></mm-text>
					<mm-button
						type="icon"
						variant="text"
						size="small"
						@click=${ handleExpandClick }
					>
						<mm-icon
							style="font-size: 18px;"
							url="https://icons.getbootstrap.com/assets/icons/fullscreen-exit.svg"
						></mm-icon>
					</mm-button>
				</div>

				${ bodyTemplate() }
				${ footerTemplate() }
			</div>
		</dialog>
		`;
	};

	const bodyTemplate = () => {
		return html`
		<div class="body">
			<div class="time-display">
				<clk-progress-ring .value=${ getTimePercentage() }></clk-progress-ring>
				<mm-text type="display-medium">
					${ currentTime.value.split(':')
						.map(seg => seg.length < 2 ? '0' + seg : seg)
						.join(':') }
				</mm-text>
			</div>
		</div>
		`;
	};

	const footerTemplate = () => {
		return html`
		<div class="footer">
			<mm-button type="icon" size="small" @click=${ handleToggleClick }>
				<mm-icon
					style=${ styleMap({ translate: cancelCountdown ? '' : '2px' }) }
					url=${ cancelCountdown
						? 'https://icons.getbootstrap.com/assets/icons/pause-fill.svg'
						: 'https://icons.getbootstrap.com/assets/icons/play-fill.svg' }
				></mm-icon>
			</mm-button>
			<mm-button type="icon" size="small" @click=${ handleResetClick }>
				<mm-icon
					url="https://icons.getbootstrap.com/assets/icons/arrow-counterclockwise.svg"
				></mm-icon>
			</mm-button>
		</div>
		`;
	};

	return ({
		render: () => {
			if (fullscreen.value)
				return fullscreenTemplate();

			return html`
			<div class="container" @click=${ handleEditClick }>
				<div class="header">
					<mm-text>
						${ label.value }
					</mm-text>
					<mm-button
						type="icon"
						variant="text"
						size="small"
						@click=${ handleExpandClick }
					>
						<mm-icon
							style="font-size: 18px;"
							url="https://icons.getbootstrap.com/assets/icons/arrows-fullscreen.svg"
						></mm-icon>
					</mm-button>
				</div>

				${ bodyTemplate() }
				${ footerTemplate() }
			</div>
			`;
		},
		styles: [
			sharedStyles,
			css`
			:host {
				display: grid;
				height: max-content;
				 width: max-content;
			}
			dialog {
				inset: 0;
				background-color: transparent;
				border: none;
				outline: none;
				color: var(--on-background);
				scale: 1.5;
			}
			dialog::backdrop {
				background-color: rgb(40 40 40);
			}
			.container {
				display: grid;
				height: 360px;
				aspect-ratio: 1;
				background-color: rgb(40 40 40);
				border-radius: 6px;
				padding: 8px;
				padding-bottom: 12px;
				transition:
					translate 0.2s ease,
					box-shadow 0.2s ease;
			}
			.container:not(.fullscreen) {
				box-shadow: var(--box-shadow-s);
			}
			.container:not(.fullscreen):hover {
				box-shadow: var(--box-shadow-m);
				translate: 0px -2px;
			}
			.header {
				display: grid;
				grid-template-columns: 1fr auto;
				align-items: center;
				padding-left: 12px;
			}
			.body {
				display: grid;
				place-items: start center;
			}
			.time-display {
				display: grid;
				place-items: center;
			}
			.time-display > * {
				grid-row: 1/2;
				grid-column: 1/2;
			}

			clk-progress-ring {
				--size: 250px;
				--track-width: 18px;
			}
			mm-icon {
				font-size: 22px;
			}
			.footer {
				display: grid;
				grid-auto-flow: column;
				grid-auto-columns: max-content;
				align-items: center;
				justify-content: center;
				gap: 12px;
			}
			`,
		],
	});
});
