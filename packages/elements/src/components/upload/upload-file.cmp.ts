import { emitEvent } from '@roenlie/core/dom';
import { customElement, MimicElement } from '@roenlie/lit-utilities/element';
import { sharedStyles } from '@roenlie/lit-utilities/styles';
import { css, html, type PropertyValueMap } from 'lit';
import { property } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';

import { systemIcons } from '../../utilities/system-icons.js';
import { MMButton } from '../button/button.cmp.js';
import { MMIcon } from '../icon/icon-element.js';
import { MMProgressBar } from '../progress-bar/progress-bar-element.js';
import type { EnhancedFile } from './enhanced-file.js';

MMIcon.register();
MMButton.register();
MMProgressBar.register();


/**
 * `<mm-upload-file>` element represents a file in the file list of `<mm-upload>`.
 *
 * ### Styling
 *
 * The following shadow DOM parts are available for styling:
 *
 * Part name        | Description
 * -----------------|-------------
 * `row`            | File container
 * `info`           | Container for file status icon, file name, status and error messages
 * `done-icon`      | File done status icon
 * `warning-icon`   | File warning status icon
 * `meta`           | Container for file name, status and error messages
 * `name`           | File name
 * `error`          | Error message, shown when error happens
 * `status`         | Status message
 * `commands`       | Container for file command buttons
 * `start-button`   | Start file upload button
 * `retry-button`   | Retry file upload button
 * `remove-button`  | Remove file button
 * `progress`       | Progress bar
 *
 * The following state attributes are available for styling:
 *
 * Attribute        | Description
 * -----------------|-------------
 * `focus-ring`     | Set when the element is focused using the keyboard.
 * `focused`        | Set when the element is focused.
 * `error`          | An error has happened during uploading.
 * `indeterminate`  | Uploading is in progress, but the progress value is unknown.
 * `uploading`      | Uploading is in progress.
 * `complete`       | Uploading has finished successfully.
 */
@customElement('mm-upload-file')
export class MMUploadFile extends MimicElement {

	//#region properties
	@property({ type: Object }) public file: EnhancedFile;
	@property({ type: Number, reflect: true }) public override tabIndex = 0;
	//#endregion


	//#region lifecycle
	public override connectedCallback(): void {
		super.connectedCallback();

		// Handle moving focus to the button on Tab.
		this.addEventListener('focusin', (_e) => {
			//const target = e.composedPath()[0]! as HTMLElement;

			//if (target.getAttribute('part')?.endsWith('button'))
			//	this._setFocused(false);
		});

		// Handle moving focus from the button on Shift Tab.
		this.addEventListener('focusout', (_e) => {
			//if (e.relatedTarget === this)
			//	this._setFocused(true);
		});
	}

	protected override updated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
		super.updated(_changedProperties);
		this._fileAborted(this.file.abort);
	}
	//#endregion


	//#region logic
	protected _shouldSetFocus(event: Event): boolean {
		return event.composedPath()[0] === this;
	}

	protected _fileAborted(abort: boolean): void {
		if (abort)
			this.emitFileRemove();
	}

	protected emitFileStart(ev: Event): void {
		ev.preventDefault();
		emitEvent(this, 'mm-file-start', {
			detail:   { file: this.file },
			bubbles:  true,
			composed: true,
		});
	}

	protected emitFileRetry(ev: Event): void {
		ev.preventDefault();
		emitEvent(this, 'mm-file-retry', {
			detail:   { file: this.file },
			bubbles:  true,
			composed: true,
		});
	}

	protected emitFileAbort(ev: Event): void {
		ev.preventDefault();
		emitEvent(this, 'mm-file-abort', {
			detail:   { file: this.file },
			bubbles:  true,
			composed: true,
		});
	}

	protected emitFileRemove(): void {
		emitEvent(this, 'mm-file-remove', {
			detail:   { file: this.file },
			bubbles:  true,
			composed: true,
		});
	}
	//#endregion


	//#region template
	protected override render() {
		return html`
		<div part="row">
			<div part="info">
				${ when(this.file.complete, () => html`
				<mm-icon
					part         ="done-icon"
					aria-hidden  ="true"
					.template    =${ systemIcons.checkLg }
				></mm-icon>
				`) }

				${ when(this.file.error, () => html`
				<mm-icon
					part         ="warning-icon"
					aria-hidden  ="true"
					.template    =${ systemIcons.patchExclamation }
				></mm-icon>
				`) }

				<div part="meta">
					<div part="name" id="name">
						${ this.file.name }
					</div>
					${ when(this.file.status, () => html`
					<div part="status" id="status">
						${ this.file.status }
					</div>
					`) }
					${ when(this.file.error, () => html`
					<div part="error" id="error">
						${ this.file.error }
					</div>
					`) }
				</div>
			</div>

			<div part="commands">
				${ when(this.file.held, () => html`
				<mm-button
					type             ="icon"
					variant="outline"
					size             ="small"
					part             ="start-button"
					aria-describedby ="name"
					@click           =${ this.emitFileStart.bind(this) }
				>
					<mm-icon .template=${ systemIcons.play }></mm-icon>
				</mm-button>
				`) }

				${ when(this.file.error, () => html`
				<mm-button
					type             ="icon"
					variant="outline"
					size             ="small"
					part             ="retry-button"
					aria-describedby ="name"
					@click           =${ this.emitFileRetry.bind(this) }
				>
					<mm-icon .template=${ systemIcons.arrowClockwise }></mm-icon>
				</mm-button>
				`) }

				<mm-button
					type             ="icon"
					variant="outline"
					size             ="small"
					part             ="remove-button"
					aria-describedby ="name"
					@click           =${ this.emitFileAbort.bind(this) }
				>
					<mm-icon .template=${ systemIcons.xLg } size="small"></mm-icon>
				</mm-button>
			</div>
		</div>

		${ when(!this.file.error, () => html`
		<mm-progress-bar
			part="progress"
			id="progress"
			.value=${ this.file.progress }
			?indeterminate=${ this.file.indeterminate }
		></mm-progress-bar>
		`) }
	  `;
	}
	//#endregion


	//#region style
	public static override styles = [
		sharedStyles,
		css`
		:host {
			display: block;
		}
		[hidden] {
			display: none;
		}
		[part='row'] {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 8px;
			list-style-type: none;
		}
		[part='info'] {
			display: flex;
			align-items: center;
			gap: 8px;
		}
		[part='done-icon'] {
			color: var(--success);
		}
		[part='warning-icon'] {
			color: var(--error);
		}
		[part='name'] {
			font-size: 16px;
		}
		[part='status'] {
			color: var(--secondary);
			font-size: 12px;
		}
		[part='error'] {
			color: var(--error);
			font-size: 12px;
		}
		[part='commands'] {
			display: flex;
			flex-flow: row nowrap;
			align-self: flex-start;
			gap: 8px;
		}
		button {
			background: transparent;
			padding: 0;
			border: none;
			box-shadow: none;
		}
		mm-progress-bar {
			margin-inline: 24px;
			margin-block: 8px;
			--height: 5px;
		}
		`,
	];
	//#endregion

}


declare global {
	interface HTMLElementTagNameMap {
		'mm-upload-file': MMUploadFile;
	}
	interface HTMLElementEventMap {
		/**
		 * Fired when the start button is pressed.
		 *
		 * It is listened by `mm-upload` which will start a new upload process of this file.
		 */
		'mm-file-start': CustomEvent<{ file: EnhancedFile }>;

		/**
		 * Fired when the retry button is pressed.
		 *
		 * It is listened by `mm-upload` which will start a new upload process of this file.
		 */
		'mm-file-retry': CustomEvent<{ file: EnhancedFile }>;

		/**
		 * Fired when abort button is pressed.
		 *
		 * It is listened by `mm-upload` which will abort the upload in progress,
		 * but will not remove the file from the list to allow the animation to hide the element to be run.
	 	 */
		'mm-file-abort': CustomEvent<{ file: EnhancedFile }>;

		/**
		 * Fired after the animation to hide the element has finished.
		 *
		 * It is listened by `mm-upload` which will actually remove the file from the upload file list.
		 */
		'mm-file-remove': CustomEvent<{ file: EnhancedFile }>;
	}
}
