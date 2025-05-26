import type * as csstype from 'csstype';
import type { nothing, TemplateResult } from 'lit-html';
import type { DirectiveResult } from 'lit-html/async-directive.js';
import type { RefOrCallback } from 'lit-html/directives/ref.js';


/*
 * Based on SolidJS JSX types
 *
 * Changed to support Lit-html
 */

type DOMElement = Element;

declare global {
	namespace JSX {
		type JSXElement = [
			Generator,
			DirectiveResult<any>,
			typeof nothing,
			TemplateResult<any>,
			Node,
			JSXElement[],
			(string & {}),
			number,
			boolean,
			null,
			undefined,
		][number];

		type Element = TemplateResult; // This is the return type of a JSX template
		type ElementType = string | JSXElement;
		interface ElementClass { /* empty, libs can define requirements downstream */ }
		interface ElementAttributesProperty { /* empty, libs can define requirements downstream */ }
		interface ElementChildrenAttribute { children: {}; }

		type EventHandler<T, E extends Event> = (e: E & {
			currentTarget: T;
			target:        DOMElement;
		}) => void;
		interface BoundEventHandler<
			T, E extends Event, EHandler extends EventHandler<T, any> = EventHandler<T, E>,
		> {
			0: (data: any, ...e: Parameters<EHandler>) => void;
			1: any;
		}
		type EventHandlerUnion<T, E extends Event, EHandler extends EventHandler<T, any> = EventHandler<T, E>> =
			EHandler | BoundEventHandler<T, E, EHandler>;

		interface EventHandlerWithOptions<
			T, E extends Event, EHandler = EventHandler<T, E>,
		> extends AddEventListenerOptions {
			handleEvent: EHandler;
		}
		type EventHandlerWithOptionsUnion<
			T, E extends Event, EHandler extends EventHandler<T, any> = EventHandler<T, E>,
		> = EHandler | EventHandlerWithOptions<T, E, EHandler>;
		type InputEventHandler<T, E extends InputEvent> = (e: E & {
			currentTarget: T;
			target:        T extends HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement ? T : DOMElement;
		}) => void;
		type InputEventHandlerUnion<T, E extends InputEvent> = EventHandlerUnion<T, E, InputEventHandler<T, E>>;
		type ChangeEventHandler<T, E extends Event> = (e: E & {
			currentTarget: T;
			target:        T extends HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement ? T : DOMElement;
		}) => void;
		type ChangeEventHandlerUnion<T, E extends Event> = EventHandlerUnion<T, E, ChangeEventHandler<T, E>>;
		type FocusEventHandler<T, E extends FocusEvent> = (e: E & {
			currentTarget: T;
			target:        T extends HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement ? T : DOMElement;
		}) => void;
		type FocusEventHandlerUnion<T, E extends FocusEvent> = EventHandlerUnion< T, E, FocusEventHandler<T, E>>;

		const SERIALIZABLE: unique symbol;
		interface SerializableAttributeValue {
			toString(): string;
			[SERIALIZABLE]: never;
		}
		interface CustomAttributes<T> {
			ref?:       RefOrCallback<T>;
			classList?: { [k: string]: boolean | undefined; } | undefined;
		}
		interface CustomEvents {}
		type OnAttributes<T> = {
			[Key in keyof CustomEvents as `on-${ Key }`]?: EventHandlerWithOptionsUnion<T, CustomEvents[Key]>;
		};
		interface DOMAttributes<T> extends
			CustomAttributes<T>,
			OnAttributes<T>,
			CustomEventHandlersCamelCase<T>,
			CustomEventHandlersNamespaced<T>,
			Partial<{
				children:               JSXElement;
				innerHTML:              string;
				innerText:              string | number;
				textContent:            string | number;
				// camel case events
				onCopy:                 EventHandlerUnion<T, ClipboardEvent>;
				onCut:                  EventHandlerUnion<T, ClipboardEvent>;
				onPaste:                EventHandlerUnion<T, ClipboardEvent>;
				onCompositionEnd:       EventHandlerUnion<T, CompositionEvent>;
				onCompositionStart:     EventHandlerUnion<T, CompositionEvent>;
				onCompositionUpdate:    EventHandlerUnion<T, CompositionEvent>;
				onFocusOut:             FocusEventHandlerUnion<T, FocusEvent>;
				onFocusIn:              FocusEventHandlerUnion<T, FocusEvent>;
				onEncrypted:            EventHandlerUnion<T, Event>;
				onDragExit:             EventHandlerUnion<T, DragEvent>;
				// kebab case events
				'on-copy':              EventHandlerWithOptionsUnion<T, ClipboardEvent>;
				'on-cut':               EventHandlerWithOptionsUnion<T, ClipboardEvent>;
				'on-paste':             EventHandlerWithOptionsUnion<T, ClipboardEvent>;
				'on-compositionend':    EventHandlerWithOptionsUnion<T, CompositionEvent>;
				'on-compositionstart':  EventHandlerWithOptionsUnion<T, CompositionEvent>;
				'on-compositionupdate': EventHandlerWithOptionsUnion<T, CompositionEvent>;
				'on-focusout':          | EventHandlerWithOptionsUnion<T, FocusEvent, FocusEventHandler<T, FocusEvent>>;
				'on-focusin':           EventHandlerWithOptionsUnion<T, FocusEvent, FocusEventHandler<T, FocusEvent>>;
				'on-encrypted':         EventHandlerWithOptionsUnion<T, Event>;
				'on-dragexit':          EventHandlerWithOptionsUnion<T, DragEvent>;
			}> {}
		interface CustomEventHandlersCamelCase<T> extends Partial<{
			onAbort:              EventHandlerUnion<T, Event>;
			onAnimationEnd:       EventHandlerUnion<T, AnimationEvent>;
			onAnimationIteration: EventHandlerUnion<T, AnimationEvent>;
			onAnimationStart:     EventHandlerUnion<T, AnimationEvent>;
			onAuxClick:           EventHandlerUnion<T, MouseEvent>;
			onBeforeInput:        InputEventHandlerUnion<T, InputEvent>;
			onBeforeToggle:       EventHandlerUnion<T, ToggleEvent>;
			onBlur:               FocusEventHandlerUnion<T, FocusEvent>;
			onCanPlay:            EventHandlerUnion<T, Event>;
			onCanPlayThrough:     EventHandlerUnion<T, Event>;
			onChange:             ChangeEventHandlerUnion<T, Event>;
			onClick:              EventHandlerUnion<T, MouseEvent>;
			onContextMenu:        EventHandlerUnion<T, MouseEvent>;
			onDblClick:           EventHandlerUnion<T, MouseEvent>;
			onDrag:               EventHandlerUnion<T, DragEvent>;
			onDragEnd:            EventHandlerUnion<T, DragEvent>;
			onDragEnter:          EventHandlerUnion<T, DragEvent>;
			onDragLeave:          EventHandlerUnion<T, DragEvent>;
			onDragOver:           EventHandlerUnion<T, DragEvent>;
			onDragStart:          EventHandlerUnion<T, DragEvent>;
			onDrop:               EventHandlerUnion<T, DragEvent>;
			onDurationChange:     EventHandlerUnion<T, Event>;
			onEmptied:            EventHandlerUnion<T, Event>;
			onEnded:              EventHandlerUnion<T, Event>;
			onError:              EventHandlerUnion<T, Event>;
			onFocus:              FocusEventHandlerUnion<T, FocusEvent>;
			onGotPointerCapture:  EventHandlerUnion<T, PointerEvent>;
			onInput:              InputEventHandlerUnion<T, InputEvent>;
			onInvalid:            EventHandlerUnion<T, Event>;
			onKeyDown:            EventHandlerUnion<T, KeyboardEvent>;
			onKeyPress:           EventHandlerUnion<T, KeyboardEvent>;
			onKeyUp:              EventHandlerUnion<T, KeyboardEvent>;
			onLoad:               EventHandlerUnion<T, Event>;
			onLoadedData:         EventHandlerUnion<T, Event>;
			onLoadedMetadata:     EventHandlerUnion<T, Event>;
			onLoadStart:          EventHandlerUnion<T, Event>;
			onLostPointerCapture: EventHandlerUnion<T, PointerEvent>;
			onMouseDown:          EventHandlerUnion<T, MouseEvent>;
			onMouseEnter:         EventHandlerUnion<T, MouseEvent>;
			onMouseLeave:         EventHandlerUnion<T, MouseEvent>;
			onMouseMove:          EventHandlerUnion<T, MouseEvent>;
			onMouseOut:           EventHandlerUnion<T, MouseEvent>;
			onMouseOver:          EventHandlerUnion<T, MouseEvent>;
			onMouseUp:            EventHandlerUnion<T, MouseEvent>;
			onPause:              EventHandlerUnion<T, Event>;
			onPlay:               EventHandlerUnion<T, Event>;
			onPlaying:            EventHandlerUnion<T, Event>;
			onPointerCancel:      EventHandlerUnion<T, PointerEvent>;
			onPointerDown:        EventHandlerUnion<T, PointerEvent>;
			onPointerEnter:       EventHandlerUnion<T, PointerEvent>;
			onPointerLeave:       EventHandlerUnion<T, PointerEvent>;
			onPointerMove:        EventHandlerUnion<T, PointerEvent>;
			onPointerOut:         EventHandlerUnion<T, PointerEvent>;
			onPointerOver:        EventHandlerUnion<T, PointerEvent>;
			onPointerUp:          EventHandlerUnion<T, PointerEvent>;
			onProgress:           EventHandlerUnion<T, ProgressEvent>;
			onRateChange:         EventHandlerUnion<T, Event>;
			onReset:              EventHandlerUnion<T, Event>;
			onScroll:             EventHandlerUnion<T, Event>;
			onScrollEnd:          EventHandlerUnion<T, Event>;
			onSeeked:             EventHandlerUnion<T, Event>;
			onSeeking:            EventHandlerUnion<T, Event>;
			onSelect:             EventHandlerUnion<T, Event>;
			onStalled:            EventHandlerUnion<T, Event>;
			onSubmit:             EventHandlerUnion<T, SubmitEvent>;
			onSuspend:            EventHandlerUnion<T, Event>;
			onTimeUpdate:         EventHandlerUnion<T, Event>;
			onToggle:             EventHandlerUnion<T, ToggleEvent>;
			onTouchCancel:        EventHandlerUnion<T, TouchEvent>;
			onTouchEnd:           EventHandlerUnion<T, TouchEvent>;
			onTouchMove:          EventHandlerUnion<T, TouchEvent>;
			onTouchStart:         EventHandlerUnion<T, TouchEvent>;
			onTransitionStart:    EventHandlerUnion<T, TransitionEvent>;
			onTransitionEnd:      EventHandlerUnion<T, TransitionEvent>;
			onTransitionRun:      EventHandlerUnion<T, TransitionEvent>;
			onTransitionCancel:   EventHandlerUnion<T, TransitionEvent>;
			onVolumeChange:       EventHandlerUnion<T, Event>;
			onWaiting:            EventHandlerUnion<T, Event>;
			onWheel:              EventHandlerUnion<T, WheelEvent>;
		}> {}
		interface CustomEventHandlersNamespaced<T> extends Partial<{
			'on-abort':              EventHandlerWithOptionsUnion<T, Event>;
			'on-animationend':       EventHandlerWithOptionsUnion<T, AnimationEvent>;
			'on-animationiteration': EventHandlerWithOptionsUnion<T, AnimationEvent>;
			'on-animationstart':     EventHandlerWithOptionsUnion<T, AnimationEvent>;
			'on-auxclick':           EventHandlerWithOptionsUnion<T, MouseEvent>;
			'on-beforeinput':        EventHandlerWithOptionsUnion<T, InputEvent, InputEventHandler<T, InputEvent>>;
			'on-beforetoggle':       EventHandlerWithOptionsUnion<T, ToggleEvent>;
			'on-blur':               EventHandlerWithOptionsUnion<T, FocusEvent, FocusEventHandler<T, FocusEvent>>;
			'on-canplay':            EventHandlerWithOptionsUnion<T, Event>;
			'on-canplaythrough':     EventHandlerWithOptionsUnion<T, Event>;
			'on-change':             EventHandlerWithOptionsUnion<T, Event, ChangeEventHandler<T, Event>>;
			'on-click':              EventHandlerWithOptionsUnion<T, MouseEvent>;
			'on-contextmenu':        EventHandlerWithOptionsUnion<T, MouseEvent>;
			'on-dblclick':           EventHandlerWithOptionsUnion<T, MouseEvent>;
			'on-drag':               EventHandlerWithOptionsUnion<T, DragEvent>;
			'on-dragend':            EventHandlerWithOptionsUnion<T, DragEvent>;
			'on-dragenter':          EventHandlerWithOptionsUnion<T, DragEvent>;
			'on-dragleave':          EventHandlerWithOptionsUnion<T, DragEvent>;
			'on-dragover':           EventHandlerWithOptionsUnion<T, DragEvent>;
			'on-dragstart':          EventHandlerWithOptionsUnion<T, DragEvent>;
			'on-drop':               EventHandlerWithOptionsUnion<T, DragEvent>;
			'on-durationchange':     EventHandlerWithOptionsUnion<T, Event>;
			'on-emptied':            EventHandlerWithOptionsUnion<T, Event>;
			'on-ended':              EventHandlerWithOptionsUnion<T, Event>;
			'on-error':              EventHandlerWithOptionsUnion<T, Event>;
			'on-focus':              EventHandlerWithOptionsUnion<T, FocusEvent, FocusEventHandler<T, FocusEvent>>;
			'on-gotpointercapture':  EventHandlerWithOptionsUnion<T, PointerEvent>;
			'on-input':              EventHandlerWithOptionsUnion<T, InputEvent, InputEventHandler<T, InputEvent>>;
			'on-invalid':            EventHandlerWithOptionsUnion<T, Event>;
			'on-keydown':            EventHandlerWithOptionsUnion<T, KeyboardEvent>;
			'on-keypress':           EventHandlerWithOptionsUnion<T, KeyboardEvent>;
			'on-keyup':              EventHandlerWithOptionsUnion<T, KeyboardEvent>;
			'on-load':               EventHandlerWithOptionsUnion<T, Event>;
			'on-loadeddata':         EventHandlerWithOptionsUnion<T, Event>;
			'on-loadedmetadata':     EventHandlerWithOptionsUnion<T, Event>;
			'on-loadstart':          EventHandlerWithOptionsUnion<T, Event>;
			'on-lostpointercapture': EventHandlerWithOptionsUnion<T, PointerEvent>;
			'on-mousedown':          EventHandlerWithOptionsUnion<T, MouseEvent>;
			'on-mouseenter':         EventHandlerWithOptionsUnion<T, MouseEvent>;
			'on-mouseleave':         EventHandlerWithOptionsUnion<T, MouseEvent>;
			'on-mousemove':          EventHandlerWithOptionsUnion<T, MouseEvent>;
			'on-mouseout':           EventHandlerWithOptionsUnion<T, MouseEvent>;
			'on-mouseover':          EventHandlerWithOptionsUnion<T, MouseEvent>;
			'on-mouseup':            EventHandlerWithOptionsUnion<T, MouseEvent>;
			'on-pause':              EventHandlerWithOptionsUnion<T, Event>;
			'on-play':               EventHandlerWithOptionsUnion<T, Event>;
			'on-playing':            EventHandlerWithOptionsUnion<T, Event>;
			'on-pointercancel':      EventHandlerWithOptionsUnion<T, PointerEvent>;
			'on-pointerdown':        EventHandlerWithOptionsUnion<T, PointerEvent>;
			'on-pointerenter':       EventHandlerWithOptionsUnion<T, PointerEvent>;
			'on-pointerleave':       EventHandlerWithOptionsUnion<T, PointerEvent>;
			'on-pointermove':        EventHandlerWithOptionsUnion<T, PointerEvent>;
			'on-pointerout':         EventHandlerWithOptionsUnion<T, PointerEvent>;
			'on-pointerover':        EventHandlerWithOptionsUnion<T, PointerEvent>;
			'on-pointerup':          EventHandlerWithOptionsUnion<T, PointerEvent>;
			'on-progress':           EventHandlerWithOptionsUnion<T, ProgressEvent>;
			'on-ratechange':         EventHandlerWithOptionsUnion<T, Event>;
			'on-reset':              EventHandlerWithOptionsUnion<T, Event>;
			'on-scroll':             EventHandlerWithOptionsUnion<T, Event>;
			'on-scrollend':          EventHandlerWithOptionsUnion<T, Event>;
			'on-seeked':             EventHandlerWithOptionsUnion<T, Event>;
			'on-seeking':            EventHandlerWithOptionsUnion<T, Event>;
			'on-select':             EventHandlerWithOptionsUnion<T, Event>;
			'on-stalled':            EventHandlerWithOptionsUnion<T, Event>;
			'on-submit':             EventHandlerWithOptionsUnion<T, SubmitEvent>;
			'on-suspend':            EventHandlerWithOptionsUnion<T, Event>;
			'on-timeupdate':         EventHandlerWithOptionsUnion<T, Event>;
			'on-toggle':             EventHandlerWithOptionsUnion<T, ToggleEvent>;
			'on-touchcancel':        EventHandlerWithOptionsUnion<T, TouchEvent>;
			'on-touchend':           EventHandlerWithOptionsUnion<T, TouchEvent>;
			'on-touchmove':          EventHandlerWithOptionsUnion<T, TouchEvent>;
			'on-touchstart':         EventHandlerWithOptionsUnion<T, TouchEvent>;
			'on-transitionstart':    EventHandlerWithOptionsUnion<T, TransitionEvent>;
			'on-transitionend':      EventHandlerWithOptionsUnion<T, TransitionEvent>;
			'on-transitionrun':      EventHandlerWithOptionsUnion<T, TransitionEvent>;
			'on-transitioncancel':   EventHandlerWithOptionsUnion<T, TransitionEvent>;
			'on-volumechange':       EventHandlerWithOptionsUnion<T, Event>;
			'on-waiting':            EventHandlerWithOptionsUnion<T, Event>;
			'on-wheel':              EventHandlerWithOptionsUnion<T, WheelEvent>;
		}> {}
		interface CSSProperties extends csstype.PropertiesHyphen {
			// Override
			[key: `-${ string }`]: string | number | undefined;
		}
		type HTMLAutocapitalize = [
			'off',
			'none',
			'on',
			'sentences',
			'words',
			'characters',
		][number];
		type HTMLDir = [
			'ltr',
			'rtl',
			'auto',
		][number];
		type HTMLFormEncType = [
			'application/x-www-form-urlencoded',
			'multipart/form-data',
			'text/plain',
		][number];
		type HTMLFormMethod = [
			'post',
			'get',
			'dialog',
		][number];
		type HTMLCrossorigin = [
			'anonymous',
			'use-credentials',
			('' & {})
		][number];
		type HTMLReferrerPolicy = [
			'no-referrer',
			'no-referrer-when-downgrade',
			'origin',
			'origin-when-cross-origin',
			'same-origin',
			'strict-origin',
			'strict-origin-when-cross-origin',
			'unsafe-url',
		][number];
		type HTMLIframeSandbox = [
			'allow-downloads-without-user-activation',
			'allow-downloads',
			'allow-forms',
			'allow-modals',
			'allow-orientation-lock',
			'allow-pointer-lock',
			'allow-popups',
			'allow-popups-to-escape-sandbox',
			'allow-presentation',
			'allow-same-origin',
			'allow-scripts',
			'allow-storage-access-by-user-activation',
			'allow-top-navigation',
			'allow-top-navigation-by-user-activation',
			'allow-top-navigation-to-custom-protocols',
		][number];
		type HTMLLinkAs = [
			'audio',
			'document',
			'embed',
			'fetch',
			'font',
			'image',
			'object',
			'script',
			'style',
			'track',
			'video',
			'worker',
		][number];

		// All the WAI-ARIA 1.1 attributes from https://www.w3.org/TR/wai-aria-1.1/
		interface AriaAttributes extends Partial<{
			/**
			 * Identifies the currently active element when DOM focus is on a composite widget, textbox,
			 * group, or application.
			 */
			'aria-activedescendant': string;
			/**
			 * Indicates whether assistive technologies will present all, or only parts of, the changed
			 * region based on the change notifications defined by the aria-relevant attribute.
			 */
			'aria-atomic':           boolean | 'false' | 'true';
			/**
			* Indicates whether inputting text could trigger display of one or more predictions of the
			* user's intended value for an input and specifies how predictions would be presented if they
			* are made.
			*/
			'aria-autocomplete':     'none' | 'inline' | 'list' | 'both';
			/**
			* Indicates an element is being modified and that assistive technologies MAY want to wait until
			* the modifications are complete before exposing them to the user.
			*/
			'aria-busy':             boolean | 'false' | 'true';
			/**
			* Indicates the current "checked" state of checkboxes, radio buttons, and other widgets.
			*
			* @see aria-pressed @see aria-selected.
			*/
			'aria-checked':          boolean | 'false' | 'mixed' | 'true';
			/**
			* Defines the total number of columns in a table, grid, or treegrid.
			*
			* @see aria-colindex.
			*/
			'aria-colcount':         number | string;
			/**
			* Defines an element's column index or position with respect to the total number of columns
			* within a table, grid, or treegrid.
			*
			* @see aria-colcount @see aria-colspan.
			*/
			'aria-colindex':         number | string;
			/**
			* Defines the number of columns spanned by a cell or gridcell within a table, grid, or
			* treegrid.
			*
			* @see aria-colindex @see aria-rowspan.
			*/
			'aria-colspan':          number | string;
			/**
			* Identifies the element (or elements) whose contents or presence are controlled by the current
			* element.
			*
			* @see aria-owns.
			*/
			'aria-controls':         string;
			/**
			* Indicates the element that represents the current item within a container or set of related
			* elements.
			*/
			'aria-current':
			| boolean
			| 'false'
			| 'true'
			| 'page'
			| 'step'
			| 'location'
			| 'date'
			| 'time'
			| undefined;
			/**
			* Identifies the element (or elements) that describes the object.
			*
			* @see aria-labelledby
			*/
			'aria-describedby':  string;
			/**
			* Identifies the element that provides a detailed, extended description for the object.
			*
			* @see aria-describedby.
			*/
			'aria-details':      string;
			/**
			* Indicates that the element is perceivable but disabled, so it is not editable or otherwise
			* operable.
			*
			* @see aria-hidden @see aria-readonly.
			*/
			'aria-disabled':     boolean | 'false' | 'true';
			/**
			* Indicates what functions can be performed when a dragged object is released on the drop
			* target.
			*
			* @deprecated In ARIA 1.1
			*/
			'aria-dropeffect':   'none' | 'copy' | 'execute' | 'link' | 'move' | 'popup';
			/**
			* Identifies the element that provides an error message for the object.
			*
			* @see aria-invalid @see aria-describedby.
			*/
			'aria-errormessage': string;
			/**
			* Indicates whether the element, or another grouping element it controls, is currently expanded
			* or collapsed.
			*/
			'aria-expanded':     boolean | 'false' | 'true';
			/**
			* Identifies the next element (or elements) in an alternate reading order of content which, at
			* the user's discretion, allows assistive technology to override the general default of reading
			* in document source order.
			*/
			'aria-flowto':       string;
			/**
			* Indicates an element's "grabbed" state in a drag-and-drop operation.
			*
			* @deprecated In ARIA 1.1
			*/
			'aria-grabbed':      boolean | 'false' | 'true';
			/**
			* Indicates the availability and type of interactive popup element, such as menu or dialog,
			* that can be triggered by an element.
			*/
			'aria-haspopup':
			| boolean
			| 'false'
			| 'true'
			| 'menu'
			| 'listbox'
			| 'tree'
			| 'grid'
			| 'dialog'
			| undefined;
			/**
			* Indicates whether the element is exposed to an accessibility API.
			*
			* @see aria-disabled.
			*/
			'aria-hidden':          boolean | 'false' | 'true';
			/**
			* Indicates the entered value does not conform to the format expected by the application.
			*
			* @see aria-errormessage.
			*/
			'aria-invalid':         boolean | 'false' | 'true' | 'grammar' | 'spelling';
			/**
			* Indicates keyboard shortcuts that an author has implemented to activate or give focus to an
			* element.
			*/
			'aria-keyshortcuts':    string;
			/**
			* Defines a string value that labels the current element.
			*
			* @see aria-labelledby.
			*/
			'aria-label':           string;
			/**
			* Identifies the element (or elements) that labels the current element.
			*
			* @see aria-describedby.
			*/
			'aria-labelledby':      string;
			/** Defines the hierarchical level of an element within a structure. */
			'aria-level':           number | string;
			/**
			* Indicates that an element will be updated, and describes the types of updates the user
			* agents, assistive technologies, and user can expect from the live region.
			*/
			'aria-live':            'off' | 'assertive' | 'polite';
			/** Indicates whether an element is modal when displayed. */
			'aria-modal':           boolean | 'false' | 'true';
			/** Indicates whether a text box accepts multiple lines of input or only a single line. */
			'aria-multiline':       boolean | 'false' | 'true';
			/**
			* Indicates that the user may select more than one item from the current selectable
			* descendants.
			*/
			'aria-multiselectable': boolean | 'false' | 'true';
			/** Indicates whether the element's orientation is horizontal, vertical, or unknown/ambiguous. */
			'aria-orientation':     'horizontal' | 'vertical';
			/**
			* Identifies an element (or elements) in order to define a visual, functional, or contextual
			* parent/child relationship between DOM elements where the DOM hierarchy cannot be used to
			* represent the relationship.
			*
			* @see aria-controls.
			*/
			'aria-owns':            string;
			/**
			* Defines a short hint (a word or short phrase) intended to aid the user with data entry when
			* the control has no value. A hint could be a sample value or a brief description of the
			* expected format.
			*/
			'aria-placeholder':     string;
			/**
			* Defines an element's number or position in the current set of listitems or treeitems. Not
			* required if all elements in the set are present in the DOM.
			*
			* @see aria-setsize.
			*/
			'aria-posinset':        number | string;
			/**
			* Indicates the current "pressed" state of toggle buttons.
			*
			* @see aria-checked @see aria-selected.
			*/
			'aria-pressed':         boolean | 'false' | 'mixed' | 'true';
			/**
			* Indicates that the element is not editable, but is otherwise operable.
			*
			* @see aria-disabled.
			*/
			'aria-readonly':        boolean | 'false' | 'true';
			/**
			* Indicates what notifications the user agent will trigger when the accessibility tree within a
			* live region is modified.
			*
			* @see aria-atomic.
			*/
			'aria-relevant':
			| 'additions'
			| 'additions removals'
			| 'additions text'
			| 'all'
			| 'removals'
			| 'removals additions'
			| 'removals text'
			| 'text'
			| 'text additions'
			| 'text removals'
			| undefined;
			/** Indicates that user input is required on the element before a form may be submitted. */
			'aria-required':        boolean | 'false' | 'true';
			/** Defines a human-readable, author-localized description for the role of an element. */
			'aria-roledescription': string;
			/**
			* Defines the total number of rows in a table, grid, or treegrid.
			*
			* @see aria-rowindex.
			*/
			'aria-rowcount':        number | string;
			/**
			* Defines an element's row index or position with respect to the total number of rows within a
			* table, grid, or treegrid.
			*
			* @see aria-rowcount @see aria-rowspan.
			*/
			'aria-rowindex':        number | string;
			/**
			* Defines the number of rows spanned by a cell or gridcell within a table, grid, or treegrid.
			*
			* @see aria-rowindex @see aria-colspan.
			*/
			'aria-rowspan':         number | string;
			/**
			* Indicates the current "selected" state of various widgets.
			*
			* @see aria-checked @see aria-pressed.
			*/
			'aria-selected':        boolean | 'false' | 'true';
			/**
			* Defines the number of items in the current set of listitems or treeitems. Not required if all
			* elements in the set are present in the DOM.
			*
			* @see aria-posinset.
			*/
			'aria-setsize':         number | string;
			/** Indicates if items in a table or grid are sorted in ascending or descending order. */
			'aria-sort':            'none' | 'ascending' | 'descending' | 'other';
			/** Defines the maximum allowed value for a range widget. */
			'aria-valuemax':        number | string;
			/** Defines the minimum allowed value for a range widget. */
			'aria-valuemin':        number | string;
			/**
			* Defines the current value for a range widget.
			*
			* @see aria-valuetext.
			*/
			'aria-valuenow':        number | string;
			/** Defines the human readable text alternative of aria-valuenow for a range widget. */
			'aria-valuetext':       string;
			role:
			| 'alert'
			| 'alertdialog'
			| 'application'
			| 'article'
			| 'banner'
			| 'button'
			| 'cell'
			| 'checkbox'
			| 'columnheader'
			| 'combobox'
			| 'complementary'
			| 'contentinfo'
			| 'definition'
			| 'dialog'
			| 'directory'
			| 'document'
			| 'feed'
			| 'figure'
			| 'form'
			| 'grid'
			| 'gridcell'
			| 'group'
			| 'heading'
			| 'img'
			| 'link'
			| 'list'
			| 'listbox'
			| 'listitem'
			| 'log'
			| 'main'
			| 'marquee'
			| 'math'
			| 'menu'
			| 'menubar'
			| 'menuitem'
			| 'menuitemcheckbox'
			| 'menuitemradio'
			| 'meter'
			| 'navigation'
			| 'none'
			| 'note'
			| 'option'
			| 'presentation'
			| 'progressbar'
			| 'radio'
			| 'radiogroup'
			| 'region'
			| 'row'
			| 'rowgroup'
			| 'rowheader'
			| 'scrollbar'
			| 'search'
			| 'searchbox'
			| 'separator'
			| 'slider'
			| 'spinbutton'
			| 'status'
			| 'switch'
			| 'tab'
			| 'table'
			| 'tablist'
			| 'tabpanel'
			| 'term'
			| 'textbox'
			| 'timer'
			| 'toolbar'
			| 'tooltip'
			| 'tree'
			| 'treegrid'
			| 'treeitem';
		}> {}
		interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T>, Partial<{
			accessKey:       string;
			class:           string;
			contenteditable: boolean | 'plaintext-only' | 'inherit';
			contextmenu:     string;
			dir:             HTMLDir;
			draggable:       boolean | 'false' | 'true';
			hidden:          boolean | 'hidden' | 'until-found';
			id:              string;
			is:              string;
			inert:           boolean;
			lang:            string;
			spellcheck:      boolean;
			style:           CSSProperties | string;
			tabindex:        number | string;
			title:           string;
			translate:       'yes' | 'no';
			about:           string;
			datatype:        string;
			inlist:          any;
			popover:         boolean | 'manual' | 'auto';
			prefix:          string;
			property:        string;
			resource:        string;
			typeof:          string;
			vocab:           string;
			autocapitalize:  HTMLAutocapitalize;
			slot:            string;
			color:           string;
			itemprop:        string;
			itemscope:       boolean;
			itemtype:        string;
			itemid:          string;
			itemref:         string;
			part:            string;
			exportparts:     string;
			inputmode:
			| 'none'
			| 'text'
			| 'tel'
			| 'url'
			| 'email'
			| 'numeric'
			| 'decimal'
			| 'search';
			contentEditable: boolean | 'plaintext-only' | 'inherit';
			contextMenu:     string;
			tabIndex:        number | string;
			autoCapitalize:  HTMLAutocapitalize;
			itemProp:        string;
			itemScope:       boolean;
			itemType:        string;
			itemId:          string;
			itemRef:         string;
			exportParts:     string;
			inputMode:
			| 'none'
			| 'text'
			| 'tel'
			| 'url'
			| 'email'
			| 'numeric'
			| 'decimal'
			| 'search';
		}> {}
		interface AnchorHTMLAttributes<T> extends HTMLAttributes<T>, Partial<{
			download:       any;
			href:           string;
			hreflang:       string;
			media:          string;
			ping:           string;
			referrerpolicy: HTMLReferrerPolicy;
			rel:            string;
			target:         string;
			type:           string;
			referrerPolicy: HTMLReferrerPolicy;
		}> {}
		interface AudioHTMLAttributes<T> extends MediaHTMLAttributes<T> {}
		interface AreaHTMLAttributes<T> extends HTMLAttributes<T>, Partial<{
			alt:            string;
			coords:         string;
			download:       any;
			href:           string;
			hreflang:       string;
			ping:           string;
			referrerpolicy: HTMLReferrerPolicy;
			rel:            string;
			shape:          'rect' | 'circle' | 'poly' | 'default';
			target:         string;
			referrerPolicy: HTMLReferrerPolicy;
		}> {}
		interface BaseHTMLAttributes<T> extends HTMLAttributes<T>, Partial<{
			href:   string;
			target: string;
		}> {}
		interface BlockquoteHTMLAttributes<T> extends HTMLAttributes<T>, Partial<{
			cite: string;
		}> {}
		interface ButtonHTMLAttributes<T> extends HTMLAttributes<T>, Partial<{
			autofocus:           boolean;
			disabled:            boolean;
			form:                string;
			formaction:          string | SerializableAttributeValue;
			formenctype:         HTMLFormEncType;
			formmethod:          HTMLFormMethod;
			formnovalidate:      boolean;
			formtarget:          string;
			popovertarget:       string;
			popovertargetaction: 'hide' | 'show' | 'toggle';
			name:                string;
			type:                'submit' | 'reset' | 'button';
			value:               string;
			formAction:          string | SerializableAttributeValue;
			formEnctype:         HTMLFormEncType;
			formMethod:          HTMLFormMethod;
			formNoValidate:      boolean;
			formTarget:          string;
			popoverTarget:       string;
			popoverTargetAction: 'hide' | 'show' | 'toggle';
		}> {}
		interface CanvasHTMLAttributes<T> extends HTMLAttributes<T>, Partial<{
			width:  number | string;
			height: number | string;
		}> {}
		interface ColHTMLAttributes<T> extends HTMLAttributes<T>, Partial<{
			span:  number | string;
			width: number | string;
		}> {}
		interface ColgroupHTMLAttributes<T> extends HTMLAttributes<T>, Partial<{
			span: number | string;
		}> {}
		interface DataHTMLAttributes<T> extends HTMLAttributes<T>, Partial<{
			value: string | string[] | number;
		}> {}
		interface DetailsHtmlAttributes<T> extends HTMLAttributes<T>, Partial<{
			open: boolean;
		}> {}
		interface DialogHtmlAttributes<T> extends HTMLAttributes<T> {
			open?:     boolean | undefined;
			onClose?:  EventHandlerUnion<T, Event> | undefined;
			onCancel?: EventHandlerUnion<T, Event> | undefined;
		}
		interface EmbedHTMLAttributes<T> extends HTMLAttributes<T> {
			height?: number | string | undefined;
			src?:    string | undefined;
			type?:   string | undefined;
			width?:  number | string | undefined;
		}
		interface FieldsetHTMLAttributes<T> extends HTMLAttributes<T> {
			disabled?: boolean | undefined;
			form?:     string | undefined;
			name?:     string | undefined;
		}
		interface FormHTMLAttributes<T> extends HTMLAttributes<T> {
			'accept-charset'?: string | undefined;
			action?:           string | SerializableAttributeValue | undefined;
			autocomplete?:     string | undefined;
			encoding?:         HTMLFormEncType | undefined;
			enctype?:          HTMLFormEncType | undefined;
			method?:           HTMLFormMethod | undefined;
			name?:             string | undefined;
			novalidate?:       boolean | undefined;
			target?:           string | undefined;
			noValidate?:       boolean | undefined;
		}
		interface IframeHTMLAttributes<T> extends HTMLAttributes<T> {
			allow?:           string | undefined;
			allowfullscreen?: boolean | undefined;
			height?:          number | string | undefined;
			loading?:         'eager' | 'lazy' | undefined;
			name?:            string | undefined;
			referrerpolicy?:  HTMLReferrerPolicy | undefined;
			sandbox?:         HTMLIframeSandbox | string | undefined;
			src?:             string | undefined;
			srcdoc?:          string | undefined;
			width?:           number | string | undefined;
			referrerPolicy?:  HTMLReferrerPolicy | undefined;
		}
		interface ImgHTMLAttributes<T> extends HTMLAttributes<T>, Partial<{
			alt:            string;
			crossorigin:    HTMLCrossorigin;
			decoding:       'sync' | 'async' | 'auto';
			height:         number | string;
			ismap:          boolean;
			isMap:          boolean;
			loading:        'eager' | 'lazy';
			referrerpolicy: HTMLReferrerPolicy;
			referrerPolicy: HTMLReferrerPolicy;
			sizes:          string;
			src:            string;
			srcset:         string;
			srcSet:         string;
			usemap:         string;
			useMap:         string;
			width:          number | string;
			crossOrigin:    HTMLCrossorigin;
			elementtiming:  string;
			fetchpriority:  'high' | 'low' | 'auto';
		}> {}
		interface InputHTMLAttributes<T> extends HTMLAttributes<T>, Partial<{
			accept:         string;
			alt:            string;
			autocomplete:   string;
			autocorrect:    'on' | 'off';
			autofocus:      boolean;
			capture:        boolean | string;
			checked:        boolean;
			crossorigin:    HTMLCrossorigin;
			disabled:       boolean;
			enterkeyhint:   'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send';
			form:           string;
			formaction:     string | SerializableAttributeValue;
			formenctype:    HTMLFormEncType;
			formmethod:     HTMLFormMethod;
			formnovalidate: boolean;
			formtarget:     string;
			height:         number | string;
			incremental:    boolean;
			list:           string;
			max:            number | string;
			maxlength:      number | string;
			min:            number | string;
			minlength:      number | string;
			multiple:       boolean;
			name:           string;
			pattern:        string;
			placeholder:    string;
			readonly:       boolean;
			results:        number;
			required:       boolean;
			size:           number | string;
			src:            string;
			step:           number | string;
			type:           string;
			value:          string | string[] | number;
			width:          number | string;
			crossOrigin:    HTMLCrossorigin;
			formAction:     string | SerializableAttributeValue;
			formEnctype:    HTMLFormEncType;
			formMethod:     HTMLFormMethod;
			formNoValidate: boolean;
			formTarget:     string;
			maxLength:      number | string;
			minLength:      number | string;
			readOnly:       boolean;
		}> {}
		interface InsHTMLAttributes<T> extends HTMLAttributes<T>, Partial<{
			cite:     string;
			dateTime: string;
		}> {}
		interface KeygenHTMLAttributes<T> extends HTMLAttributes<T> {
			autofocus?: boolean | undefined;
			challenge?: string | undefined;
			disabled?:  boolean | undefined;
			form?:      string | undefined;
			keytype?:   string | undefined;
			keyparams?: string | undefined;
			name?:      string | undefined;
		}
		interface LabelHTMLAttributes<T> extends HTMLAttributes<T> {
			for?:  string | undefined;
			form?: string | undefined;
		}
		interface LiHTMLAttributes<T> extends HTMLAttributes<T> {
			value?: number | string | undefined;
		}
		interface LinkHTMLAttributes<T> extends HTMLAttributes<T> {
			as?:             HTMLLinkAs | undefined;
			crossorigin?:    HTMLCrossorigin | undefined;
			disabled?:       boolean | undefined;
			fetchpriority?:  'high' | 'low' | 'auto' | undefined;
			href?:           string | undefined;
			hreflang?:       string | undefined;
			imagesizes?:     string | undefined;
			imagesrcset?:    string | undefined;
			integrity?:      string | undefined;
			media?:          string | undefined;
			referrerpolicy?: HTMLReferrerPolicy | undefined;
			rel?:            string | undefined;
			sizes?:          string | undefined;
			type?:           string | undefined;
			crossOrigin?:    HTMLCrossorigin | undefined;
			referrerPolicy?: HTMLReferrerPolicy | undefined;
		}
		interface MapHTMLAttributes<T> extends HTMLAttributes<T> {
			name?: string | undefined;
		}
		interface MediaHTMLAttributes<T> extends HTMLAttributes<T> {
			autoplay?:    boolean | undefined;
			controls?:    boolean | undefined;
			crossorigin?: HTMLCrossorigin | undefined;
			loop?:        boolean | undefined;
			mediagroup?:  string | undefined;
			muted?:       boolean | undefined;
			preload?:     'none' | 'metadata' | 'auto' | '' | undefined;
			src?:         string | undefined;
			crossOrigin?: HTMLCrossorigin | undefined;
			mediaGroup?:  string | undefined;
		}
		interface MenuHTMLAttributes<T> extends HTMLAttributes<T> {
			label?: string | undefined;
			type?:  'context' | 'toolbar' | undefined;
		}
		interface MetaHTMLAttributes<T> extends HTMLAttributes<T> {
			charset?:      string | undefined;
			content?:      string | undefined;
			'http-equiv'?: string | undefined;
			name?:         string | undefined;
			media?:        string | undefined;
		}
		interface MeterHTMLAttributes<T> extends HTMLAttributes<T> {
			form?:    string | undefined;
			high?:    number | string | undefined;
			low?:     number | string | undefined;
			max?:     number | string | undefined;
			min?:     number | string | undefined;
			optimum?: number | string | undefined;
			value?:   string | string[] | number | undefined;
		}
		interface QuoteHTMLAttributes<T> extends HTMLAttributes<T> {
			cite?: string | undefined;
		}
		interface ObjectHTMLAttributes<T> extends HTMLAttributes<T> {
			data?:   string | undefined;
			form?:   string | undefined;
			height?: number | string | undefined;
			name?:   string | undefined;
			type?:   string | undefined;
			usemap?: string | undefined;
			width?:  number | string | undefined;
			useMap?: string | undefined;
		}
		interface OlHTMLAttributes<T> extends HTMLAttributes<T> {
			reversed?: boolean | undefined;
			start?:    number | string | undefined;
			type?:     '1' | 'a' | 'A' | 'i' | 'I' | undefined;
		}
		interface OptgroupHTMLAttributes<T> extends HTMLAttributes<T> {
			disabled?: boolean | undefined;
			label?:    string | undefined;
		}
		interface OptionHTMLAttributes<T> extends HTMLAttributes<T> {
			disabled?: boolean | undefined;
			label?:    string | undefined;
			selected?: boolean | undefined;
			value?:    string | string[] | number | undefined;
		}
		interface OutputHTMLAttributes<T> extends HTMLAttributes<T> {
			form?: string | undefined;
			for?:  string | undefined;
			name?: string | undefined;
		}
		interface ParamHTMLAttributes<T> extends HTMLAttributes<T> {
			name?:  string | undefined;
			value?: string | string[] | number | undefined;
		}
		interface ProgressHTMLAttributes<T> extends HTMLAttributes<T> {
			max?:   number | string | undefined;
			value?: string | string[] | number | undefined;
		}
		interface ScriptHTMLAttributes<T> extends HTMLAttributes<T> {
			async?:          boolean | undefined;
			charset?:        string | undefined;
			crossorigin?:    HTMLCrossorigin | undefined;
			defer?:          boolean | undefined;
			integrity?:      string | undefined;
			nomodule?:       boolean | undefined;
			nonce?:          string | undefined;
			referrerpolicy?: HTMLReferrerPolicy | undefined;
			src?:            string | undefined;
			type?:           string | undefined;
			crossOrigin?:    HTMLCrossorigin | undefined;
			noModule?:       boolean | undefined;
			referrerPolicy?: HTMLReferrerPolicy | undefined;
		}
		interface SelectHTMLAttributes<T> extends HTMLAttributes<T> {
			autocomplete?: string | undefined;
			autofocus?:    boolean | undefined;
			disabled?:     boolean | undefined;
			form?:         string | undefined;
			multiple?:     boolean | undefined;
			name?:         string | undefined;
			required?:     boolean | undefined;
			size?:         number | string | undefined;
			value?:        string | string[] | number | undefined;
		}
		interface HTMLSlotElementAttributes<T = HTMLSlotElement> extends HTMLAttributes<T> {
			name?: string | undefined;
		}
		interface SourceHTMLAttributes<T> extends HTMLAttributes<T> {
			media?:  string | undefined;
			sizes?:  string | undefined;
			src?:    string | undefined;
			srcset?: string | undefined;
			type?:   string | undefined;
			width?:  number | string | undefined;
			height?: number | string | undefined;
		}
		interface StyleHTMLAttributes<T> extends HTMLAttributes<T> {
			media?:  string | undefined;
			nonce?:  string | undefined;
			scoped?: boolean | undefined;
			type?:   string | undefined;
		}
		interface TdHTMLAttributes<T> extends HTMLAttributes<T> {
			colspan?: number | string | undefined;
			headers?: string | undefined;
			rowspan?: number | string | undefined;
			colSpan?: number | string | undefined;
			rowSpan?: number | string | undefined;
		}
		interface TemplateHTMLAttributes<T extends HTMLTemplateElement> extends HTMLAttributes<T> {
			content?: DocumentFragment | undefined;
		}
		interface TextareaHTMLAttributes<T> extends HTMLAttributes<T> {
			autocomplete?: string | undefined;
			autofocus?:    boolean | undefined;
			cols?:         number | string | undefined;
			dirname?:      string | undefined;
			disabled?:     boolean | undefined;
			enterkeyhint?: 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send' | undefined;
			form?:         string | undefined;
			maxlength?:    number | string | undefined;
			minlength?:    number | string | undefined;
			name?:         string | undefined;
			placeholder?:  string | undefined;
			readonly?:     boolean | undefined;
			required?:     boolean | undefined;
			rows?:         number | string | undefined;
			value?:        string | string[] | number | undefined;
			wrap?:         'hard' | 'soft' | 'off' | undefined;
			maxLength?:    number | string | undefined;
			minLength?:    number | string | undefined;
			readOnly?:     boolean | undefined;
		}
		interface ThHTMLAttributes<T> extends HTMLAttributes<T> {
			colspan?: number | string | undefined;
			headers?: string | undefined;
			rowspan?: number | string | undefined;
			colSpan?: number | string | undefined;
			rowSpan?: number | string | undefined;
			scope?:   'col' | 'row' | 'rowgroup' | 'colgroup' | undefined;
		}
		interface TimeHTMLAttributes<T> extends HTMLAttributes<T> {
			datetime?: string | undefined;
			dateTime?: string | undefined;
		}
		interface TrackHTMLAttributes<T> extends HTMLAttributes<T> {
			default?: boolean | undefined;
			kind?:    'subtitles' | 'captions' | 'descriptions' | 'chapters' | 'metadata' | undefined;
			label?:   string | undefined;
			src?:     string | undefined;
			srclang?: string | undefined;
		}
		interface VideoHTMLAttributes<T> extends MediaHTMLAttributes<T> {
			height?:                  number | string | undefined;
			playsinline?:             boolean | undefined;
			poster?:                  string | undefined;
			width?:                   number | string | undefined;
			disablepictureinpicture?: boolean;
		}
		type SVGPreserveAspectRatio = [
			'none',
			'xMinYMin',
			'xMidYMin',
			'xMaxYMin',
			'xMinYMid',
			'xMidYMid',
			'xMaxYMid',
			'xMinYMax',
			'xMidYMax',
			'xMaxYMax',
			'xMinYMin meet',
			'xMidYMin meet',
			'xMaxYMin meet',
			'xMinYMid meet',
			'xMidYMid meet',
			'xMaxYMid meet',
			'xMinYMax meet',
			'xMidYMax meet',
			'xMaxYMax meet',
			'xMinYMin slice',
			'xMidYMin slice',
			'xMaxYMin slice',
			'xMinYMid slice',
			'xMidYMid slice',
			'xMaxYMid slice',
			'xMinYMax slice',
			'xMidYMax slice',
			'xMaxYMax slice',
		][number];
		type ImagePreserveAspectRatio = [
			SVGPreserveAspectRatio,
			'defer none',
			'defer xMinYMin',
			'defer xMidYMin',
			'defer xMaxYMin',
			'defer xMinYMid',
			'defer xMidYMid',
			'defer xMaxYMid',
			'defer xMinYMax',
			'defer xMidYMax',
			'defer xMaxYMax',
			'defer xMinYMin meet',
			'defer xMidYMin meet',
			'defer xMaxYMin meet',
			'defer xMinYMid meet',
			'defer xMidYMid meet',
			'defer xMaxYMid meet',
			'defer xMinYMax meet',
			'defer xMidYMax meet',
			'defer xMaxYMax meet',
			'defer xMinYMin slice',
			'defer xMidYMin slice',
			'defer xMaxYMin slice',
			'defer xMinYMid slice',
			'defer xMidYMid slice',
			'defer xMaxYMid slice',
			'defer xMinYMax slice',
			'defer xMidYMax slice',
			'defer xMaxYMax slice',
		][number];
		type SVGUnits = 'userSpaceOnUse' | 'objectBoundingBox';
		interface CoreSVGAttributes<T> extends AriaAttributes, DOMAttributes<T> {
			id?:       string | undefined;
			lang?:     string | undefined;
			tabIndex?: number | string | undefined;
			tabindex?: number | string | undefined;
		}
		interface StylableSVGAttributes {
			class?: string | undefined;
			style?: CSSProperties | string | undefined;
		}
		interface TransformableSVGAttributes {
			transform?: string | undefined;
		}
		interface ConditionalProcessingSVGAttributes {
			requiredExtensions?: string | undefined;
			requiredFeatures?:   string | undefined;
			systemLanguage?:     string | undefined;
		}
		interface ExternalResourceSVGAttributes {
			externalResourcesRequired?: 'true' | 'false' | undefined;
		}
		interface AnimationTimingSVGAttributes {
			begin?:       string | undefined;
			dur?:         string | undefined;
			end?:         string | undefined;
			min?:         string | undefined;
			max?:         string | undefined;
			restart?:     'always' | 'whenNotActive' | 'never' | undefined;
			repeatCount?: number | 'indefinite' | undefined;
			repeatDur?:   string | undefined;
			fill?:        'freeze' | 'remove' | undefined;
		}
		interface AnimationValueSVGAttributes {
			calcMode?:   'discrete' | 'linear' | 'paced' | 'spline' | undefined;
			values?:     string | undefined;
			keyTimes?:   string | undefined;
			keySplines?: string | undefined;
			from?:       number | string | undefined;
			to?:         number | string | undefined;
			by?:         number | string | undefined;
		}
		interface AnimationAdditionSVGAttributes {
			attributeName?: string | undefined;
			additive?:      'replace' | 'sum' | undefined;
			accumulate?:    'none' | 'sum' | undefined;
		}
		interface AnimationAttributeTargetSVGAttributes {
			attributeName?: string | undefined;
			attributeType?: 'CSS' | 'XML' | 'auto' | undefined;
		}
		interface PresentationSVGAttributes {
			'alignment-baseline'?: [
				'auto',
				'baseline',
				'before-edge',
				'text-before-edge',
				'middle',
				'central',
				'after-edge',
				'text-after-edge',
				'ideographic',
				'alphabetic',
				'hanging',
				'mathematical',
				'inherit',
				undefined,
			][number];
			'baseline-shift'?:              number | string | undefined;
			clip?:                          string | undefined;
			'clip-path'?:                   string | undefined;
			'clip-rule'?:                   'nonzero' | 'evenodd' | 'inherit' | undefined;
			color?:                         string | undefined;
			'color-interpolation'?:         'auto' | 'sRGB' | 'linearRGB' | 'inherit' | undefined;
			'color-interpolation-filters'?: 'auto' | 'sRGB' | 'linearRGB' | 'inherit' | undefined;
			'color-profile'?:               string | undefined;
			'color-rendering'?:             'auto' | 'optimizeSpeed' | 'optimizeQuality' | 'inherit' | undefined;
			cursor?:                        string | undefined;
			direction?:                     'ltr' | 'rtl' | 'inherit' | undefined;
			display?:                       string | undefined;
			'dominant-baseline'?: [
				'auto',
				'text-bottom',
				'alphabetic',
				'ideographic',
				'middle',
				'central',
				'mathematical',
				'hanging',
				'text-top',
				'inherit',
				undefined,
			][number];
			'enable-background'?:            string | undefined;
			fill?:                           string | undefined;
			'fill-opacity'?:                 number | string | 'inherit' | undefined;
			'fill-rule'?:                    'nonzero' | 'evenodd' | 'inherit' | undefined;
			filter?:                         string | undefined;
			'flood-color'?:                  string | undefined;
			'flood-opacity'?:                number | string | 'inherit' | undefined;
			'font-family'?:                  string | undefined;
			'font-size'?:                    string | undefined;
			'font-size-adjust'?:             number | string | undefined;
			'font-stretch'?:                 string | undefined;
			'font-style'?:                   'normal' | 'italic' | 'oblique' | 'inherit' | undefined;
			'font-variant'?:                 string | undefined;
			'font-weight'?:                  number | string | undefined;
			'glyph-orientation-horizontal'?: string | undefined;
			'glyph-orientation-vertical'?:   string | undefined;
			'image-rendering'?:              'auto' | 'optimizeQuality' | 'optimizeSpeed' | 'inherit' | undefined;
			kerning?:                        string | undefined;
			'letter-spacing'?:               number | string | undefined;
			'lighting-color'?:               string | undefined;
			'marker-end'?:                   string | undefined;
			'marker-mid'?:                   string | undefined;
			'marker-start'?:                 string | undefined;
			mask?:                           string | undefined;
			opacity?:                        number | string | 'inherit' | undefined;
			overflow?:                       'visible' | 'hidden' | 'scroll' | 'auto' | 'inherit' | undefined;
			pathLength?:                     string | number | undefined;
			'pointer-events'?: [
				'bounding-box',
				'visiblePainted',
				'visibleFill',
				'visibleStroke',
				'visible',
				'painted',
				'color',
				'fill',
				'stroke',
				'all',
				'none',
				'inherit',
				undefined,
			][number];
			'shape-rendering'?:
				| 'auto'
				| 'optimizeSpeed'
				| 'crispEdges'
				| 'geometricPrecision'
				| 'inherit'
				| undefined;
			'stop-color'?:        string | undefined;
			'stop-opacity'?:      number | string | 'inherit' | undefined;
			stroke?:              string | undefined;
			'stroke-dasharray'?:  string | undefined;
			'stroke-dashoffset'?: number | string | undefined;
			'stroke-linecap'?:    'butt' | 'round' | 'square' | 'inherit' | undefined;
			'stroke-linejoin'?:   'arcs' | 'bevel' | 'miter' | 'miter-clip' | 'round' | 'inherit' | undefined;
			'stroke-miterlimit'?: number | string | 'inherit' | undefined;
			'stroke-opacity'?:    number | string | 'inherit' | undefined;
			'stroke-width'?:      number | string | undefined;
			'text-anchor'?:       'start' | 'middle' | 'end' | 'inherit' | undefined;
			'text-decoration'?:
				| 'none'
				| 'underline'
				| 'overline'
				| 'line-through'
				| 'blink'
				| 'inherit'
				| undefined;
			'text-rendering'?:
				| 'auto'
				| 'optimizeSpeed'
				| 'optimizeLegibility'
				| 'geometricPrecision'
				| 'inherit'
				| undefined;
			'unicode-bidi'?: string | undefined;
			visibility?:     'visible' | 'hidden' | 'collapse' | 'inherit' | undefined;
			'word-spacing'?: number | string | undefined;
			'writing-mode'?: 'lr-tb' | 'rl-tb' | 'tb-rl' | 'lr' | 'rl' | 'tb' | 'inherit' | undefined;
		}
		interface AnimationElementSVGAttributes<T>
			extends CoreSVGAttributes<T>,
			ExternalResourceSVGAttributes,
			ConditionalProcessingSVGAttributes {}
		interface ContainerElementSVGAttributes<T>
			extends CoreSVGAttributes<T>,
			ShapeElementSVGAttributes<T>,
			Pick<
				PresentationSVGAttributes,
				| 'clip-path'
				| 'mask'
				| 'cursor'
				| 'opacity'
				| 'filter'
				| 'enable-background'
				| 'color-interpolation'
				| 'color-rendering'
			> {}
		interface FilterPrimitiveElementSVGAttributes<T>
			extends CoreSVGAttributes<T>,
			Pick<PresentationSVGAttributes, 'color-interpolation-filters'> {
			x?:      number | string | undefined;
			y?:      number | string | undefined;
			width?:  number | string | undefined;
			height?: number | string | undefined;
			result?: string | undefined;
		}
		interface SingleInputFilterSVGAttributes {
			in?: string | undefined;
		}
		interface DoubleInputFilterSVGAttributes {
			in?:  string | undefined;
			in2?: string | undefined;
		}
		interface FitToViewBoxSVGAttributes {
			viewBox?:             string | undefined;
			preserveAspectRatio?: SVGPreserveAspectRatio | undefined;
		}
		interface GradientElementSVGAttributes<T>
			extends CoreSVGAttributes<T>,
			ExternalResourceSVGAttributes,
			StylableSVGAttributes {
			gradientUnits?:     SVGUnits | undefined;
			gradientTransform?: string | undefined;
			spreadMethod?:      'pad' | 'reflect' | 'repeat' | undefined;
			href?:              string | undefined;
		}
		interface GraphicsElementSVGAttributes<T>
			extends CoreSVGAttributes<T>,
			Pick<
				PresentationSVGAttributes,
				| 'clip-rule'
				| 'mask'
				| 'pointer-events'
				| 'cursor'
				| 'opacity'
				| 'filter'
				| 'display'
				| 'visibility'
				| 'color-interpolation'
				| 'color-rendering'
			> {}
		interface LightSourceElementSVGAttributes<T> extends CoreSVGAttributes<T> {}
		interface NewViewportSVGAttributes<T>
			extends CoreSVGAttributes<T>,
			Pick<PresentationSVGAttributes, 'overflow' | 'clip'> {
			viewBox?: string | undefined;
		}
		interface ShapeElementSVGAttributes<T>
			extends CoreSVGAttributes<T>,
			Pick<PresentationSVGAttributes, [
				'color',
				'fill',
				'fill-rule',
				'fill-opacity',
				'stroke',
				'stroke-width',
				'stroke-linecap',
				'stroke-linejoin',
				'stroke-miterlimit',
				'stroke-dasharray',
				'stroke-dashoffset',
				'stroke-opacity',
				'shape-rendering',
				'pathLength',
			][number]> {}
		interface TextContentElementSVGAttributes<T>
			extends CoreSVGAttributes<T>,
			Pick<PresentationSVGAttributes, [
				'font-family',
				'font-style',
				'font-variant',
				'font-weight',
				'font-stretch',
				'font-size',
				'font-size-adjust',
				'kerning',
				'letter-spacing',
				'word-spacing',
				'text-decoration',
				'glyph-orientation-horizontal',
				'glyph-orientation-vertical',
				'direction',
				'unicode-bidi',
				'text-anchor',
				'dominant-baseline',
				'color',
				'fill',
				'fill-rule',
				'fill-opacity',
				'stroke',
				'stroke-width',
				'stroke-linecap',
				'stroke-linejoin',
				'stroke-miterlimit',
				'stroke-dasharray',
				'stroke-dashoffset',
				'stroke-opacity',
			][number]> {}
		interface ZoomAndPanSVGAttributes {
			zoomAndPan?: 'disable' | 'magnify' | undefined;
		}
		interface AnimateSVGAttributes<T>
			extends AnimationElementSVGAttributes<T>,
			AnimationAttributeTargetSVGAttributes,
			AnimationTimingSVGAttributes,
			AnimationValueSVGAttributes,
			AnimationAdditionSVGAttributes,
			Pick<PresentationSVGAttributes, 'color-interpolation' | 'color-rendering'> {}
		interface AnimateMotionSVGAttributes<T>
			extends AnimationElementSVGAttributes<T>,
			AnimationTimingSVGAttributes,
			AnimationValueSVGAttributes,
			AnimationAdditionSVGAttributes {
			path?:      string | undefined;
			keyPoints?: string | undefined;
			rotate?:    number | string | 'auto' | 'auto-reverse' | undefined;
			origin?:    'default' | undefined;
		}
		interface AnimateTransformSVGAttributes<T>
			extends AnimationElementSVGAttributes<T>,
			AnimationAttributeTargetSVGAttributes,
			AnimationTimingSVGAttributes,
			AnimationValueSVGAttributes,
			AnimationAdditionSVGAttributes {
			type?: 'translate' | 'scale' | 'rotate' | 'skewX' | 'skewY' | undefined;
		}
		interface CircleSVGAttributes<T>
			extends GraphicsElementSVGAttributes<T>,
			ShapeElementSVGAttributes<T>,
			ConditionalProcessingSVGAttributes,
			StylableSVGAttributes,
			TransformableSVGAttributes {
			cx?: number | string | undefined;
			cy?: number | string | undefined;
			r?:  number | string | undefined;
		}
		interface ClipPathSVGAttributes<T>
			extends CoreSVGAttributes<T>,
			ConditionalProcessingSVGAttributes,
			ExternalResourceSVGAttributes,
			StylableSVGAttributes,
			TransformableSVGAttributes,
			Pick<PresentationSVGAttributes, 'clip-path'> {
			clipPathUnits?: SVGUnits | undefined;
		}
		interface DefsSVGAttributes<T>
			extends ContainerElementSVGAttributes<T>,
			ConditionalProcessingSVGAttributes,
			ExternalResourceSVGAttributes,
			StylableSVGAttributes,
			TransformableSVGAttributes {}
		interface DescSVGAttributes<T> extends CoreSVGAttributes<T>, StylableSVGAttributes {}
		interface EllipseSVGAttributes<T>
			extends GraphicsElementSVGAttributes<T>,
			ShapeElementSVGAttributes<T>,
			ConditionalProcessingSVGAttributes,
			ExternalResourceSVGAttributes,
			StylableSVGAttributes,
			TransformableSVGAttributes {
			cx?: number | string | undefined;
			cy?: number | string | undefined;
			rx?: number | string | undefined;
			ry?: number | string | undefined;
		}
		interface FeBlendSVGAttributes<T>
			extends FilterPrimitiveElementSVGAttributes<T>,
			DoubleInputFilterSVGAttributes,
			StylableSVGAttributes {
			mode?: 'normal' | 'multiply' | 'screen' | 'darken' | 'lighten' | undefined;
		}
		interface FeColorMatrixSVGAttributes<T>
			extends FilterPrimitiveElementSVGAttributes<T>,
			SingleInputFilterSVGAttributes,
			StylableSVGAttributes {
			type?:   'matrix' | 'saturate' | 'hueRotate' | 'luminanceToAlpha' | undefined;
			values?: string | undefined;
		}
		interface FeComponentTransferSVGAttributes<T>
			extends FilterPrimitiveElementSVGAttributes<T>,
			SingleInputFilterSVGAttributes,
			StylableSVGAttributes {}
		interface FeCompositeSVGAttributes<T>
			extends FilterPrimitiveElementSVGAttributes<T>,
			DoubleInputFilterSVGAttributes,
			StylableSVGAttributes {
			operator?: 'over' | 'in' | 'out' | 'atop' | 'xor' | 'arithmetic' | undefined;
			k1?:       number | string | undefined;
			k2?:       number | string | undefined;
			k3?:       number | string | undefined;
			k4?:       number | string | undefined;
		}
		interface FeConvolveMatrixSVGAttributes<T>
			extends FilterPrimitiveElementSVGAttributes<T>,
			SingleInputFilterSVGAttributes,
			StylableSVGAttributes {
			order?:            number | string | undefined;
			kernelMatrix?:     string | undefined;
			divisor?:          number | string | undefined;
			bias?:             number | string | undefined;
			targetX?:          number | string | undefined;
			targetY?:          number | string | undefined;
			edgeMode?:         'duplicate' | 'wrap' | 'none' | undefined;
			kernelUnitLength?: number | string | undefined;
			preserveAlpha?:    'true' | 'false' | undefined;
		}
		interface FeDiffuseLightingSVGAttributes<T>
			extends FilterPrimitiveElementSVGAttributes<T>,
			SingleInputFilterSVGAttributes,
			StylableSVGAttributes,
			Pick<PresentationSVGAttributes, 'color' | 'lighting-color'> {
			surfaceScale?:     number | string | undefined;
			diffuseConstant?:  number | string | undefined;
			kernelUnitLength?: number | string | undefined;
		}
		interface FeDisplacementMapSVGAttributes<T>
			extends FilterPrimitiveElementSVGAttributes<T>,
			DoubleInputFilterSVGAttributes,
			StylableSVGAttributes {
			scale?:            number | string | undefined;
			xChannelSelector?: 'R' | 'G' | 'B' | 'A' | undefined;
			yChannelSelector?: 'R' | 'G' | 'B' | 'A' | undefined;
		}
		interface FeDistantLightSVGAttributes<T> extends LightSourceElementSVGAttributes<T> {
			azimuth?:   number | string | undefined;
			elevation?: number | string | undefined;
		}
		interface FeDropShadowSVGAttributes<T>
			extends CoreSVGAttributes<T>,
			FilterPrimitiveElementSVGAttributes<T>,
			StylableSVGAttributes,
			Pick<PresentationSVGAttributes, 'color' | 'flood-color' | 'flood-opacity'> {
			dx?:           number | string | undefined;
			dy?:           number | string | undefined;
			stdDeviation?: number | string | undefined;
		}
		interface FeFloodSVGAttributes<T>
			extends FilterPrimitiveElementSVGAttributes<T>,
			StylableSVGAttributes,
			Pick<PresentationSVGAttributes, 'color' | 'flood-color' | 'flood-opacity'> {}
		interface FeFuncSVGAttributes<T> extends CoreSVGAttributes<T> {
			type?:        'identity' | 'table' | 'discrete' | 'linear' | 'gamma' | undefined;
			tableValues?: string | undefined;
			slope?:       number | string | undefined;
			intercept?:   number | string | undefined;
			amplitude?:   number | string | undefined;
			exponent?:    number | string | undefined;
			offset?:      number | string | undefined;
		}
		interface FeGaussianBlurSVGAttributes<T>
			extends FilterPrimitiveElementSVGAttributes<T>,
			SingleInputFilterSVGAttributes,
			StylableSVGAttributes {
			stdDeviation?: number | string | undefined;
		}
		interface FeImageSVGAttributes<T>
			extends FilterPrimitiveElementSVGAttributes<T>,
			ExternalResourceSVGAttributes,
			StylableSVGAttributes {
			preserveAspectRatio?: SVGPreserveAspectRatio | undefined;
			href?:                string | undefined;
		}
		interface FeMergeSVGAttributes<T>
			extends FilterPrimitiveElementSVGAttributes<T>,
			StylableSVGAttributes {}
		interface FeMergeNodeSVGAttributes<T>
			extends CoreSVGAttributes<T>,
			SingleInputFilterSVGAttributes {}
		interface FeMorphologySVGAttributes<T>
			extends FilterPrimitiveElementSVGAttributes<T>,
			SingleInputFilterSVGAttributes,
			StylableSVGAttributes {
			operator?: 'erode' | 'dilate' | undefined;
			radius?:   number | string | undefined;
		}
		interface FeOffsetSVGAttributes<T>
			extends FilterPrimitiveElementSVGAttributes<T>,
			SingleInputFilterSVGAttributes,
			StylableSVGAttributes {
			dx?: number | string | undefined;
			dy?: number | string | undefined;
		}
		interface FePointLightSVGAttributes<T> extends LightSourceElementSVGAttributes<T> {
			x?: number | string | undefined;
			y?: number | string | undefined;
			z?: number | string | undefined;
		}
		interface FeSpecularLightingSVGAttributes<T>
			extends FilterPrimitiveElementSVGAttributes<T>,
			SingleInputFilterSVGAttributes,
			StylableSVGAttributes,
			Pick<PresentationSVGAttributes, 'color' | 'lighting-color'> {
			surfaceScale?:     string | undefined;
			specularConstant?: string | undefined;
			specularExponent?: string | undefined;
			kernelUnitLength?: number | string | undefined;
		}
		interface FeSpotLightSVGAttributes<T> extends LightSourceElementSVGAttributes<T> {
			x?:                 number | string | undefined;
			y?:                 number | string | undefined;
			z?:                 number | string | undefined;
			pointsAtX?:         number | string | undefined;
			pointsAtY?:         number | string | undefined;
			pointsAtZ?:         number | string | undefined;
			specularExponent?:  number | string | undefined;
			limitingConeAngle?: number | string | undefined;
		}
		interface FeTileSVGAttributes<T>
			extends FilterPrimitiveElementSVGAttributes<T>,
			SingleInputFilterSVGAttributes,
			StylableSVGAttributes {}
		interface FeTurbulanceSVGAttributes<T>
			extends FilterPrimitiveElementSVGAttributes<T>,
			StylableSVGAttributes {
			baseFrequency?: number | string | undefined;
			numOctaves?:    number | string | undefined;
			seed?:          number | string | undefined;
			stitchTiles?:   'stitch' | 'noStitch' | undefined;
			type?:          'fractalNoise' | 'turbulence' | undefined;
		}
		interface FilterSVGAttributes<T>
			extends CoreSVGAttributes<T>,
			ExternalResourceSVGAttributes,
			StylableSVGAttributes {
			filterUnits?:    SVGUnits | undefined;
			primitiveUnits?: SVGUnits | undefined;
			x?:              number | string | undefined;
			y?:              number | string | undefined;
			width?:          number | string | undefined;
			height?:         number | string | undefined;
			filterRes?:      number | string | undefined;
		}
		interface ForeignObjectSVGAttributes<T>
			extends NewViewportSVGAttributes<T>,
			ConditionalProcessingSVGAttributes,
			ExternalResourceSVGAttributes,
			StylableSVGAttributes,
			TransformableSVGAttributes,
			Pick<PresentationSVGAttributes, 'display' | 'visibility'> {
			x?:      number | string | undefined;
			y?:      number | string | undefined;
			width?:  number | string | undefined;
			height?: number | string | undefined;
		}
		interface GSVGAttributes<T>
			extends ContainerElementSVGAttributes<T>,
			ConditionalProcessingSVGAttributes,
			ExternalResourceSVGAttributes,
			StylableSVGAttributes,
			TransformableSVGAttributes,
			Pick<PresentationSVGAttributes, 'display' | 'visibility'> {}
		interface ImageSVGAttributes<T> extends
			NewViewportSVGAttributes<T>,
			GraphicsElementSVGAttributes<T>,
			ConditionalProcessingSVGAttributes,
			StylableSVGAttributes,
			TransformableSVGAttributes,
			Pick<PresentationSVGAttributes, 'color-profile' | 'image-rendering'>,
			Partial<{
				x:                   number | string;
				y:                   number | string;
				width:               number | string;
				height:              number | string;
				preserveAspectRatio: ImagePreserveAspectRatio;
				href:                string;
			}> {}
		interface LineSVGAttributes<T> extends
			GraphicsElementSVGAttributes<T>,
			ShapeElementSVGAttributes<T>,
			ConditionalProcessingSVGAttributes,
			ExternalResourceSVGAttributes,
			StylableSVGAttributes,
			TransformableSVGAttributes,
			Pick<PresentationSVGAttributes, [
				'marker-start',
				'marker-mid',
				'marker-end',
			][number]>,
			Partial<{
				x1: number | string;
				y1: number | string;
				x2: number | string;
				y2: number | string;
			}> {}
		interface LinearGradientSVGAttributes<T> extends
			GradientElementSVGAttributes<T>,
			Partial<{
				x1: number | string;
				x2: number | string;
				y1: number | string;
				y2: number | string;
			}> {}
		interface MarkerSVGAttributes<T> extends
			ContainerElementSVGAttributes<T>,
			ExternalResourceSVGAttributes,
			StylableSVGAttributes,
			FitToViewBoxSVGAttributes,
			Pick<PresentationSVGAttributes, 'overflow' | 'clip'>,
			Partial<{
				markerUnits:  'strokeWidth' | 'userSpaceOnUse';
				refX:         number | string;
				refY:         number | string;
				markerWidth:  number | string;
				markerHeight: number | string;
				orient:       string;
			}> {}
		interface MaskSVGAttributes<T> extends
			Omit<ContainerElementSVGAttributes<T>, 'opacity' | 'filter'>,
			ConditionalProcessingSVGAttributes,
			ExternalResourceSVGAttributes,
			StylableSVGAttributes,
			Partial<{
				maskUnits:        SVGUnits;
				maskContentUnits: SVGUnits;
				x:                number | string;
				y:                number | string;
				width:            number | string;
				height:           number | string;
			}> {}
		interface MetadataSVGAttributes<T> extends CoreSVGAttributes<T> {}
		interface MPathSVGAttributes<T> extends CoreSVGAttributes<T> {}
		interface PathSVGAttributes<T> extends
			GraphicsElementSVGAttributes<T>,
			ShapeElementSVGAttributes<T>,
			ConditionalProcessingSVGAttributes,
			ExternalResourceSVGAttributes,
			StylableSVGAttributes,
			TransformableSVGAttributes,
			Pick<PresentationSVGAttributes, [
				'marker-start',
				'marker-mid',
				'marker-end',
			][number]>,
			Partial<{
				d:          string;
				pathLength: number | string;
			}> {}
		interface PatternSVGAttributes<T> extends
			ContainerElementSVGAttributes<T>,
			ConditionalProcessingSVGAttributes,
			ExternalResourceSVGAttributes,
			StylableSVGAttributes,
			FitToViewBoxSVGAttributes,
			Pick<PresentationSVGAttributes, 'overflow' | 'clip'>,
			Partial<{
				x:                   number | string;
				y:                   number | string;
				width:               number | string;
				height:              number | string;
				patternUnits:        SVGUnits;
				patternContentUnits: SVGUnits;
				patternTransform:    string;
				href:                string;
			}> {}
		interface PolygonSVGAttributes<T> extends
			GraphicsElementSVGAttributes<T>,
			ShapeElementSVGAttributes<T>,
			ConditionalProcessingSVGAttributes,
			ExternalResourceSVGAttributes,
			StylableSVGAttributes,
			TransformableSVGAttributes,
			Pick<PresentationSVGAttributes, [
				'marker-start',
				'marker-mid',
				'marker-end',
			][number]>,
			Partial<{
				points: string;
			}> {}
		interface PolylineSVGAttributes<T> extends
			GraphicsElementSVGAttributes<T>,
			ShapeElementSVGAttributes<T>,
			ConditionalProcessingSVGAttributes,
			ExternalResourceSVGAttributes,
			StylableSVGAttributes,
			TransformableSVGAttributes,
			Pick<PresentationSVGAttributes, [
				'marker-start',
				'marker-mid',
				'marker-end',
			][number]>,
			Partial<{
				points: string;
			}> {}
		interface RadialGradientSVGAttributes<T> extends
			GradientElementSVGAttributes<T>,
			Partial<{
				cx: number | string;
				cy: number | string;
				r:  number | string;
				fx: number | string;
				fy: number | string;
			}> {}
		interface RectSVGAttributes<T> extends
			GraphicsElementSVGAttributes<T>,
			ShapeElementSVGAttributes<T>,
			ConditionalProcessingSVGAttributes,
			ExternalResourceSVGAttributes,
			StylableSVGAttributes,
			TransformableSVGAttributes,
			Partial<{
				x:      number | string;
				y:      number | string;
				width:  number | string;
				height: number | string;
				rx:     number | string;
				ry:     number | string;
			}> {}
		interface SetSVGAttributes<T> extends
			CoreSVGAttributes<T>,
			StylableSVGAttributes,
			AnimationTimingSVGAttributes {}
		interface StopSVGAttributes<T> extends
			CoreSVGAttributes<T>,
			StylableSVGAttributes,
			Pick<PresentationSVGAttributes, [
				'color',
				'stop-color',
				'stop-opacity',
			][number]>,
			Partial<{
				offset: number | string;
			}> {}
		interface SvgSVGAttributes<T> extends
			ContainerElementSVGAttributes<T>,
			NewViewportSVGAttributes<T>,
			ConditionalProcessingSVGAttributes,
			ExternalResourceSVGAttributes,
			StylableSVGAttributes,
			FitToViewBoxSVGAttributes,
			ZoomAndPanSVGAttributes,
			PresentationSVGAttributes,
			Partial<{
				version:           string;
				baseProfile:       string;
				x:                 number | string;
				y:                 number | string;
				width:             number | string;
				height:            number | string;
				contentScriptType: string;
				contentStyleType:  string;
				xmlns:             string;
				'xmlns:xlink':     string;
			}> {}
		interface SwitchSVGAttributes<T>
			extends ContainerElementSVGAttributes<T>,
			ConditionalProcessingSVGAttributes,
			ExternalResourceSVGAttributes,
			StylableSVGAttributes,
			TransformableSVGAttributes,
			Pick<PresentationSVGAttributes, 'display' | 'visibility'> {}
		interface SymbolSVGAttributes<T>
			extends ContainerElementSVGAttributes<T>,
			NewViewportSVGAttributes<T>,
			ExternalResourceSVGAttributes,
			StylableSVGAttributes,
			FitToViewBoxSVGAttributes,
			Partial<{
				width:               number | string;
				height:              number | string;
				preserveAspectRatio: SVGPreserveAspectRatio;
				refX:                number | string;
				refY:                number | string;
				viewBox:             string;
				x:                   number | string;
				y:                   number | string;
			}> {}
		interface TextSVGAttributes<T>
			extends TextContentElementSVGAttributes<T>,
			GraphicsElementSVGAttributes<T>,
			ConditionalProcessingSVGAttributes,
			ExternalResourceSVGAttributes,
			StylableSVGAttributes,
			TransformableSVGAttributes,
			Pick<PresentationSVGAttributes, 'writing-mode' | 'text-rendering'>,
			Partial<{
				x:            number | string;
				y:            number | string;
				dx:           number | string;
				dy:           number | string;
				rotate:       number | string;
				textLength:   number | string;
				lengthAdjust: 'spacing' | 'spacingAndGlyphs';
			}> {}
		interface TextPathSVGAttributes<T> extends
			TextContentElementSVGAttributes<T>,
			ConditionalProcessingSVGAttributes,
			ExternalResourceSVGAttributes,
			StylableSVGAttributes,
			Pick<PresentationSVGAttributes, [
				'alignment-baseline',
				'baseline-shift',
				'display',
				'visibility',
			][number]>,
			Partial<{
				startOffset: number | string;
				method:      'align' | 'stretch';
				spacing:     'auto' | 'exact';
				href:        string;
			}> {}
		interface TSpanSVGAttributes<T> extends
			TextContentElementSVGAttributes<T>,
			ConditionalProcessingSVGAttributes,
			ExternalResourceSVGAttributes,
			StylableSVGAttributes,
			Pick<PresentationSVGAttributes, [
				'alignment-baseline',
				'baseline-shift',
				'display',
				'visibility',
			][number]>,
			Partial<{
				x:            number | string;
				y:            number | string;
				dx:           number | string;
				dy:           number | string;
				rotate:       number | string;
				textLength:   number | string;
				lengthAdjust: 'spacing' | 'spacingAndGlyphs';
			}> {}
		/** @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/use */
		interface UseSVGAttributes<T> extends
			CoreSVGAttributes<T>,
			StylableSVGAttributes,
			ConditionalProcessingSVGAttributes,
			GraphicsElementSVGAttributes<T>,
			PresentationSVGAttributes,
			ExternalResourceSVGAttributes,
			TransformableSVGAttributes,
			Partial<{
				x:      number | string;
				y:      number | string;
				width:  number | string;
				height: number | string;
				href:   string;
			}> {}
		interface ViewSVGAttributes<T> extends
			CoreSVGAttributes<T>,
			ExternalResourceSVGAttributes,
			FitToViewBoxSVGAttributes,
			ZoomAndPanSVGAttributes,
			Partial<{
				viewTarget: string;
			}> {}
		/** @type {HTMLElementTagNameMap} */
		interface HTMLElementTags {
			a:          AnchorHTMLAttributes<HTMLAnchorElement>;
			abbr:       HTMLAttributes<HTMLElement>;
			address:    HTMLAttributes<HTMLElement>;
			area:       AreaHTMLAttributes<HTMLAreaElement>;
			article:    HTMLAttributes<HTMLElement>;
			aside:      HTMLAttributes<HTMLElement>;
			audio:      AudioHTMLAttributes<HTMLAudioElement>;
			b:          HTMLAttributes<HTMLElement>;
			base:       BaseHTMLAttributes<HTMLBaseElement>;
			bdi:        HTMLAttributes<HTMLElement>;
			bdo:        HTMLAttributes<HTMLElement>;
			blockquote: BlockquoteHTMLAttributes<HTMLElement>;
			body:       HTMLAttributes<HTMLBodyElement>;
			br:         HTMLAttributes<HTMLBRElement>;
			button:     ButtonHTMLAttributes<HTMLButtonElement>;
			canvas:     CanvasHTMLAttributes<HTMLCanvasElement>;
			caption:    HTMLAttributes<HTMLElement>;
			cite:       HTMLAttributes<HTMLElement>;
			code:       HTMLAttributes<HTMLElement>;
			col:        ColHTMLAttributes<HTMLTableColElement>;
			colgroup:   ColgroupHTMLAttributes<HTMLTableColElement>;
			data:       DataHTMLAttributes<HTMLElement>;
			datalist:   HTMLAttributes<HTMLDataListElement>;
			dd:         HTMLAttributes<HTMLElement>;
			del:        HTMLAttributes<HTMLElement>;
			details:    DetailsHtmlAttributes<HTMLDetailsElement>;
			dfn:        HTMLAttributes<HTMLElement>;
			dialog:     DialogHtmlAttributes<HTMLDialogElement>;
			/** DIV HTML element */
			div:        HTMLAttributes<HTMLDivElement>;
			dl:         HTMLAttributes<HTMLDListElement>;
			dt:         HTMLAttributes<HTMLElement>;
			em:         HTMLAttributes<HTMLElement>;
			embed:      EmbedHTMLAttributes<HTMLEmbedElement>;
			fieldset:   FieldsetHTMLAttributes<HTMLFieldSetElement>;
			figcaption: HTMLAttributes<HTMLElement>;
			figure:     HTMLAttributes<HTMLElement>;
			footer:     HTMLAttributes<HTMLElement>;
			form:       FormHTMLAttributes<HTMLFormElement>;
			h1:         HTMLAttributes<HTMLHeadingElement>;
			h2:         HTMLAttributes<HTMLHeadingElement>;
			h3:         HTMLAttributes<HTMLHeadingElement>;
			h4:         HTMLAttributes<HTMLHeadingElement>;
			h5:         HTMLAttributes<HTMLHeadingElement>;
			h6:         HTMLAttributes<HTMLHeadingElement>;
			head:       HTMLAttributes<HTMLHeadElement>;
			header:     HTMLAttributes<HTMLElement>;
			hgroup:     HTMLAttributes<HTMLElement>;
			hr:         HTMLAttributes<HTMLHRElement>;
			html:       HTMLAttributes<HTMLHtmlElement>;
			i:          HTMLAttributes<HTMLElement>;
			iframe:     IframeHTMLAttributes<HTMLIFrameElement>;
			img:        ImgHTMLAttributes<HTMLImageElement>;
			input:      InputHTMLAttributes<HTMLInputElement>;
			ins:        InsHTMLAttributes<HTMLModElement>;
			kbd:        HTMLAttributes<HTMLElement>;
			label:      LabelHTMLAttributes<HTMLLabelElement>;
			legend:     HTMLAttributes<HTMLLegendElement>;
			li:         LiHTMLAttributes<HTMLLIElement>;
			link:       LinkHTMLAttributes<HTMLLinkElement>;
			main:       HTMLAttributes<HTMLElement>;
			map:        MapHTMLAttributes<HTMLMapElement>;
			mark:       HTMLAttributes<HTMLElement>;
			menu:       MenuHTMLAttributes<HTMLMenuElement>;
			meta:       MetaHTMLAttributes<HTMLMetaElement>;
			meter:      MeterHTMLAttributes<HTMLElement>;
			nav:        HTMLAttributes<HTMLElement>;
			noscript:   HTMLAttributes<HTMLElement>;
			object:     ObjectHTMLAttributes<HTMLObjectElement>;
			ol:         OlHTMLAttributes<HTMLOListElement>;
			optgroup:   OptgroupHTMLAttributes<HTMLOptGroupElement>;
			option:     OptionHTMLAttributes<HTMLOptionElement>;
			output:     OutputHTMLAttributes<HTMLElement>;
			p:          HTMLAttributes<HTMLParagraphElement>;
			picture:    HTMLAttributes<HTMLElement>;
			pre:        HTMLAttributes<HTMLPreElement>;
			progress:   ProgressHTMLAttributes<HTMLProgressElement>;
			q:          QuoteHTMLAttributes<HTMLQuoteElement>;
			rp:         HTMLAttributes<HTMLElement>;
			rt:         HTMLAttributes<HTMLElement>;
			ruby:       HTMLAttributes<HTMLElement>;
			s:          HTMLAttributes<HTMLElement>;
			samp:       HTMLAttributes<HTMLElement>;
			script:     ScriptHTMLAttributes<HTMLScriptElement>;
			search:     HTMLAttributes<HTMLElement>;
			section:    HTMLAttributes<HTMLElement>;
			select:     SelectHTMLAttributes<HTMLSelectElement>;
			slot:       HTMLSlotElementAttributes;
			small:      HTMLAttributes<HTMLElement>;
			source:     SourceHTMLAttributes<HTMLSourceElement>;
			span:       HTMLAttributes<HTMLSpanElement>;
			strong:     HTMLAttributes<HTMLElement>;
			style:      StyleHTMLAttributes<HTMLStyleElement>;
			sub:        HTMLAttributes<HTMLElement>;
			summary:    HTMLAttributes<HTMLElement>;
			sup:        HTMLAttributes<HTMLElement>;
			table:      HTMLAttributes<HTMLTableElement>;
			tbody:      HTMLAttributes<HTMLTableSectionElement>;
			td:         TdHTMLAttributes<HTMLTableCellElement>;
			template:   TemplateHTMLAttributes<HTMLTemplateElement>;
			textarea:   TextareaHTMLAttributes<HTMLTextAreaElement>;
			tfoot:      HTMLAttributes<HTMLTableSectionElement>;
			th:         ThHTMLAttributes<HTMLTableCellElement>;
			thead:      HTMLAttributes<HTMLTableSectionElement>;
			time:       TimeHTMLAttributes<HTMLElement>;
			title:      HTMLAttributes<HTMLTitleElement>;
			tr:         HTMLAttributes<HTMLTableRowElement>;
			track:      TrackHTMLAttributes<HTMLTrackElement>;
			u:          HTMLAttributes<HTMLElement>;
			ul:         HTMLAttributes<HTMLUListElement>;
			var:        HTMLAttributes<HTMLElement>;
			video:      VideoHTMLAttributes<HTMLVideoElement>;
			wbr:        HTMLAttributes<HTMLElement>;
		}
		/** @type {HTMLElementDeprecatedTagNameMap} */
		interface HTMLElementDeprecatedTags {
			big:      HTMLAttributes<HTMLElement>;
			keygen:   KeygenHTMLAttributes<HTMLElement>;
			menuitem: HTMLAttributes<HTMLElement>;
			noindex:  HTMLAttributes<HTMLElement>;
			param:    ParamHTMLAttributes<HTMLParamElement>;
		}
		/** @type {SVGElementTagNameMap} */
		interface SVGElementTags {
			animate:             AnimateSVGAttributes<SVGAnimateElement>;
			animateMotion:       AnimateMotionSVGAttributes<SVGAnimateMotionElement>;
			animateTransform:    AnimateTransformSVGAttributes<SVGAnimateTransformElement>;
			circle:              CircleSVGAttributes<SVGCircleElement>;
			clipPath:            ClipPathSVGAttributes<SVGClipPathElement>;
			defs:                DefsSVGAttributes<SVGDefsElement>;
			desc:                DescSVGAttributes<SVGDescElement>;
			ellipse:             EllipseSVGAttributes<SVGEllipseElement>;
			feBlend:             FeBlendSVGAttributes<SVGFEBlendElement>;
			feColorMatrix:       FeColorMatrixSVGAttributes<SVGFEColorMatrixElement>;
			feComponentTransfer: FeComponentTransferSVGAttributes<SVGFEComponentTransferElement>;
			feComposite:         FeCompositeSVGAttributes<SVGFECompositeElement>;
			feConvolveMatrix:    FeConvolveMatrixSVGAttributes<SVGFEConvolveMatrixElement>;
			feDiffuseLighting:   FeDiffuseLightingSVGAttributes<SVGFEDiffuseLightingElement>;
			feDisplacementMap:   FeDisplacementMapSVGAttributes<SVGFEDisplacementMapElement>;
			feDistantLight:      FeDistantLightSVGAttributes<SVGFEDistantLightElement>;
			feDropShadow:        FeDropShadowSVGAttributes<SVGFEDropShadowElement>;
			feFlood:             FeFloodSVGAttributes<SVGFEFloodElement>;
			feFuncA:             FeFuncSVGAttributes<SVGFEFuncAElement>;
			feFuncB:             FeFuncSVGAttributes<SVGFEFuncBElement>;
			feFuncG:             FeFuncSVGAttributes<SVGFEFuncGElement>;
			feFuncR:             FeFuncSVGAttributes<SVGFEFuncRElement>;
			feGaussianBlur:      FeGaussianBlurSVGAttributes<SVGFEGaussianBlurElement>;
			feImage:             FeImageSVGAttributes<SVGFEImageElement>;
			feMerge:             FeMergeSVGAttributes<SVGFEMergeElement>;
			feMergeNode:         FeMergeNodeSVGAttributes<SVGFEMergeNodeElement>;
			feMorphology:        FeMorphologySVGAttributes<SVGFEMorphologyElement>;
			feOffset:            FeOffsetSVGAttributes<SVGFEOffsetElement>;
			fePointLight:        FePointLightSVGAttributes<SVGFEPointLightElement>;
			feSpecularLighting:  FeSpecularLightingSVGAttributes<SVGFESpecularLightingElement>;
			feSpotLight:         FeSpotLightSVGAttributes<SVGFESpotLightElement>;
			feTile:              FeTileSVGAttributes<SVGFETileElement>;
			feTurbulence:        FeTurbulanceSVGAttributes<SVGFETurbulenceElement>;
			filter:              FilterSVGAttributes<SVGFilterElement>;
			foreignObject:       ForeignObjectSVGAttributes<SVGForeignObjectElement>;
			g:                   GSVGAttributes<SVGGElement>;
			image:               ImageSVGAttributes<SVGImageElement>;
			line:                LineSVGAttributes<SVGLineElement>;
			linearGradient:      LinearGradientSVGAttributes<SVGLinearGradientElement>;
			marker:              MarkerSVGAttributes<SVGMarkerElement>;
			mask:                MaskSVGAttributes<SVGMaskElement>;
			metadata:            MetadataSVGAttributes<SVGMetadataElement>;
			mpath:               MPathSVGAttributes<SVGMPathElement>;
			path:                PathSVGAttributes<SVGPathElement>;
			pattern:             PatternSVGAttributes<SVGPatternElement>;
			polygon:             PolygonSVGAttributes<SVGPolygonElement>;
			polyline:            PolylineSVGAttributes<SVGPolylineElement>;
			radialGradient:      RadialGradientSVGAttributes<SVGRadialGradientElement>;
			rect:                RectSVGAttributes<SVGRectElement>;
			set:                 SetSVGAttributes<SVGSetElement>;
			stop:                StopSVGAttributes<SVGStopElement>;
			svg:                 SvgSVGAttributes<SVGSVGElement>;
			switch:              SwitchSVGAttributes<SVGSwitchElement>;
			symbol:              SymbolSVGAttributes<SVGSymbolElement>;
			text:                TextSVGAttributes<SVGTextElement>;
			textPath:            TextPathSVGAttributes<SVGTextPathElement>;
			tspan:               TSpanSVGAttributes<SVGTSpanElement>;
			use:                 UseSVGAttributes<SVGUseElement>;
			view:                ViewSVGAttributes<SVGViewElement>;
		}
		interface SemanticTags { [key: `s-${ string }`]: HTMLAttributes<HTMLElement>; }
		interface IntrinsicElements extends
			HTMLElementTags,
			HTMLElementDeprecatedTags,
			SVGElementTags,
			SemanticTags {}
	}
}
