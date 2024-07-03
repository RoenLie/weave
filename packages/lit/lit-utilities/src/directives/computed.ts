import { type RecordOf } from '@roenlie/core/types';
import { LitElement, type PropertyValues } from 'lit';


export const computed = (options: {
	events: ('willUpdate' | 'update' | 'updated')[],
	props: string[],
}) => (
	target: LitElement,
	property: string,
) => {
	const element = target as unknown as RecordOf<{
		connectedCallback: () => void;
		willUpdate:        (_props: PropertyValues) => void;
		update:            (_props: PropertyValues) => void;
		updated:           (_props: PropertyValues) => void;
	}>;

	const props = options.props;
	let events = options.events;
	if (!events.length)
		events = [ 'update' ];

	const { willUpdate, update, updated, connectedCallback } = element;

	let fn: () => any;
	let firstRun = true;

	element.connectedCallback = function() {
		if (firstRun) {
			fn = this[property];
			firstRun = false;
		}

		this[property] = fn();
		connectedCallback.call(this);
	};

	if (events.includes('willUpdate')) {
		element.willUpdate = function(changedProps: PropertyValues) {
			if (props.length && props.some(prop => changedProps.has(prop)))
				this[property] = fn();
			else
				this[property] = fn();

			willUpdate.call(this, changedProps);
		};
	}
	if (events.includes('update')) {
		element.update = function(changedProps: PropertyValues) {
			if (props.length && props.some(prop => changedProps.has(prop)))
				this[property] = fn();
			else
				this[property] = fn();

			update.call(this, changedProps);
		};
	}
	if (events.includes('updated')) {
		element.updated = function(changedProps: PropertyValues) {
			if (props.length && props.some(prop => changedProps.has(prop)))
				this[property] = fn();
			else
				this[property] = fn();

			updated.call(this, changedProps);
		};
	}
};


computed.create = <T>(fn: () => T): T => fn as any;
