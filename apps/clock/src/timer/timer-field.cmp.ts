import { component } from '@roenlie/lit-fabric/core';
import {
	useController, useProperty,
	useState, useWillUpdate,
} from '@roenlie/lit-fabric/hooks';
import { emitEvent } from '@roenlie/core/dom';
import { curryDebounce } from '@roenlie/core/timing';
import { KeyboardController } from '@roenlie/lit-utilities/controllers';
import { sharedStyles } from '@roenlie/lit-utilities/styles';
import { css, html, LitElement } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { map } from 'lit/directives/map.js';
import { when } from 'lit/directives/when.js';


export interface TimeFieldElement extends LitElement {
	value: string;
}


export const ClkTimeField = component('clk-time-field', element => {
	const [ value, setValue ] = useProperty('value', '0:0:0');
	const [ activeIndex, setActiveIndex ] = useState('activeIndex', 0);
	const [ time, setTime ] = useState<[
		hours: number, minutes: number, seconds: number,
	]>('time', [ 0, 0, 0 ]);

	let updateLocation = -1;
	const startUpdate = curryDebounce(500, () => updateLocation = -1);

	useController(new KeyboardController({
		host:    element,
		target:  element,
		keylist: [
			{ key: '1' },
			{ key: '2' },
			{ key: '3' },
			{ key: '4' },
			{ key: '5' },
			{ key: '6' },
			{ key: '7' },
			{ key: '8' },
			{ key: '9' },
			{ key: '0' },
		],
		listener: (ev) => {
			startUpdate();

			const mutateTime = (limit = Infinity) => {
				if (updateLocation === -1)
					time.value[activeIndex.value] = 0;

				const currentTime = time.value[activeIndex.value]?.toString() ?? '0:0:0';
				const newTimeArr = currentTime.split('');

				const updateIndex = Math.max(0, Math.abs(updateLocation) - 1);

				newTimeArr[updateIndex] = ev.key;
				time.value[activeIndex.value] = Math.min(limit, parseInt(newTimeArr.join('')));
				updateLocation = Math.max(-2, updateLocation - 1);
			};

			if (activeIndex.value === 0)
				mutateTime(23);
			else if (activeIndex.value === 1)
				mutateTime(59);
			else if (activeIndex.value === 2)
				mutateTime(59);

			computeTime();
		},
	}));

	useWillUpdate(() => {
		const newTime = (() => {
			const split = value.value.split(':');
			while (split.length !== 3) {
				if (split.length > 3)
					split.pop();
				if (split.length < 3)
					split.push('0');
			}

			return [
				parseInt(split[0]!),
				parseInt(split[1]!),
				parseInt(split[2]!),
			] satisfies typeof time.value;
		})();

		setTime(newTime);
	}, [ 'time' ]);

	const incrementTime = (index: number) => {
		if (index === 0) {
			time.value[index] = time.value[index] + 1;
			if (time.value[index] >= 24)
				time.value[index] = 0;
		}
		else if (index === 1) {
			time.value[index] = time.value[index] + 1;
			if (time.value[index] >= 60)
				time.value[index] = 0;
		}
		else if (index === 2) {
			time.value[index] = time.value[index] + 1;
			if (time.value[index] >= 60)
				time.value[index] = 0;
		}

		setActiveIndex(index);
		computeTime();
	};

	const decrementTime = (index: number) => {
		if (index === 0) {
			time.value[index] = time.value[index] - 1;
			if (time.value[index] < 0)
				time.value[index] = 23;
		}
		else if (index === 1) {
			time.value[index] = time.value[index] - 1;
			if (time.value[index] < 0)
				time.value[index] = 59;
		}
		else if (index === 2) {
			time.value[index] = time.value[index] - 1;
			if (time.value[index] < 0)
				time.value[index] = 59;
		}

		setActiveIndex(index);
		computeTime();
	};

	const computeTime = () => {
		const oldValue = value.value;
		setValue(time.value.join(':'));

		if (value.value !== oldValue)
			emitEvent(element, 'change');
	};

	return ({
		render: () => html`
		<div class="top">
			${ map(time.value, (_, idx) => html`
			<mm-button
				type="icon"
				variant="text"
				size="x-small"
				@click=${ () => incrementTime(idx) }
			>
				<mm-icon
					url="https://icons.getbootstrap.com/assets/icons/chevron-up.svg"
				></mm-icon>
			</mm-button>
			`) }
		</div>

		<div class="middle">
			${ map(time.value, (_time, idx) => html`
			<mm-text
				tabindex=0
				class=${ classMap({
					time:   true,
					active: idx === activeIndex.value,
				}) }
				type="headline-large"
				@click=${ () => setActiveIndex(idx) }
				@focus=${ () => setActiveIndex(idx) }
			>
				${ _time.toString().length < 2 ? '0' + _time : _time }
			</mm-text>
			${ when(idx !== time.value.length - 1, () => html`
			<mm-text type="headline-large">:</mm-text>
			`) }
			`) }
		</div>

		<div class="bottom">
			${ map(time.value, (_, idx) => html`
			<mm-button
				type="icon"
				variant="text"
				size="x-small"
				@click=${ () => decrementTime(idx) }
			>
				<mm-icon
					url="https://icons.getbootstrap.com/assets/icons/chevron-down.svg"
				></mm-icon>
			</mm-button>
			`) }
		</div>
		`,
		styles: [
			sharedStyles,
			css`
			:host {
				display: grid;
				place-items: center;
				grid-template-rows: auto 1fr auto;
				gap: 4px;
				outline: none;
				--time-gap: 50px;
			}
			.top, .bottom {
				display: grid;
				grid-template-columns: var(--time-gap) var(--time-gap) var(--time-gap);
				gap: 10px;
				justify-items: center;
			}
			.middle {
				display: grid;
				grid-template-columns: var(--time-gap) 10px var(--time-gap) 10px var(--time-gap);
				background-color: rgb(30 30 30 / 75%);
				border-radius: 4px;
				padding: 4px;
				border: 1px solid rgb(200 200 200 / 50%);
			}
			:host(:focus-within) .middle .time.active,
			:host(:focus-within) .middle .time:hover {
				background-color: rgb(50 50 50 / 50%);
			}
			mm-icon {
				pointer-events: none;
			}
			mm-text {
				text-align: center;
				outline: none;
			}
			`,
		],
	});
});
