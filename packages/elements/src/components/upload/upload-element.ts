import { emitEvent, isTouch } from '@roenlie/core/dom';
import { format } from '@roenlie/core/string';
import { EventController, SlotController } from '@roenlie/lit-utilities/controllers';
import { watch } from '@roenlie/lit-utilities/decorators';
import { customElement, MimicElement } from '@roenlie/lit-utilities/element';
import { sharedStyles } from '@roenlie/lit-utilities/styles';
import { loadTerms } from '@roenlie/lit-localize/core';
import { tTerm } from '@roenlie/lit-localize/directive';
import { css, html, type PropertyValues } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { repeat } from 'lit/directives/repeat.js';
import { when } from 'lit/directives/when.js';

import { systemIcons } from '../../utilities/system-icons.js';
import { MMButton } from '../button/button.cmp.js';
import { type EnhancedFile, enhanceFile } from './enhanced-file.js';
import { MMUploadFile } from './upload-file.cmp.js';
import { uploadTerms } from './upload-lang-en.js';

MMButton.register();
MMUploadFile.register();

loadTerms('en', uploadTerms);


declare global {
	interface HTMLElementTagNameMap {
		'mm-upload': MMUpload;
	}

	interface HTMLElementEventMap {
		/**
		 * Fired before the XHR is opened. Could be used for changing the request
		 * URL. If the default is prevented, then XHR would not be opened.
		 */
		'mm-upload-before': CustomEvent<{ xhr: XMLHttpRequest; file: EnhancedFile; uploadTarget: string }>;

		/**
		 * Fired when the XHR has been opened but not sent yet.
		 *
		 * Useful for appending data keys to the FormData object,
		 * for changing some parameters like headers, etc.
		 *
		 * If the event is defaultPrevented, `mm-upload` will not
		 * send the request allowing the user to do something on his own.
		 */
		'mm-upload-request': CustomEvent<{ xhr: XMLHttpRequest; file: EnhancedFile; formData: FormData }>;

		/**
		 * Fired when the XHR is sent.
		 */
		'mm-upload-start': CustomEvent<{ xhr: XMLHttpRequest; file: EnhancedFile; }>;

		/**
		 * Fired as many times as the progress is updated.
		 */
		'mm-upload-progress': CustomEvent<{ xhr: XMLHttpRequest; file: EnhancedFile; }>;

		/**
		 * Fired when we have the actual server response, and before the component analyses it.
		 *
		 * It's useful for developers to make the upload fail depending on the server response.
		 *
		 * If the event is defaultPrevented the mm-upload will return allowing the user to do
		 * something on his own like retry the upload, etc,
		 * since it has full access to the `xhr` and `file` objects.
		 *
		 * Otherwise, if the event is not prevented default `mm-upload` continues
		 * with the normal workflow checking the `xhr.status` and `file.error`
		 * which also might be modified by the user to force a customized response.
		 */
		'mm-upload-response': CustomEvent<{ xhr: XMLHttpRequest; file: EnhancedFile; }>;

		/**
		 * Fired in case the upload process succeed.
		 */
		'mm-upload-success': CustomEvent<{ xhr: XMLHttpRequest; file: EnhancedFile; }>;

		/**
		 * Fired in case the upload process failed.
		 */
		'mm-upload-error': CustomEvent<{ xhr: XMLHttpRequest; file: EnhancedFile }>;

		/**
		 * Fired when retry upload is requested. If the default is prevented, then
		 * retry would not be performed.
		 */
		'mm-upload-retry': CustomEvent<{ xhr: XMLHttpRequest; file: EnhancedFile }>;

		/**
		 * Fired when retry abort is requested. If the default is prevented, then the
		 * file upload would not be aborted.
		 */
		'mm-upload-abort': CustomEvent<{ xhr: XMLHttpRequest; file: EnhancedFile }>;

		/**
		 * Fired when a file cannot be added to the queue due to a constrain:
		 * file-size, file-type or maxFiles
		 */
		'mm-file-reject': CustomEvent<{ file: EnhancedFile; error: string }>;
	}
}


/**
  * ### `<mm-upload>` is a Web Component for uploading multiple files with drag and drop support.
  *
  * #### Example:
  * ```
  * <mm-upload></mm-upload>
  * ```
  *
  * #### Stylable parts
  * Part name         | Description
  * ------------------|-
  * `primary-buttons` | Upload container
  * `upload-button`   | Upload button
  * `drop-label`      | Label for drop indicator
  * `drop-label-icon` | Icon for drop indicator
  * `file-list`       | File list container
  *
  * #### Stylable attributes
  * Attribute           | Description                                                                                | Part name
  * --------------------|--------------------------------------------------------------------------------------------|---
  * `nodrop`            | Set when drag and drop is disabled (e. g., on touch devices)                               | `:host`
  * `dragover`          | A file is being dragged over the element                                                   | `:host`
  * `dragover-valid`    | A dragged file is valid with `maxFiles` and `accept` criteria                              | `:host`
  * `max-filmm-reached` | The maximum number of files that the user is allowed to add to the upload has been reached | `:host`
  *
  * #### Events
  * @event mm-file-reject               - Fired when a file cannot be added to the queue due to a constrain.
  * @event mm-filmm-changed             - Fired when the `files` property changes.
  * @event mm-max-filmm-reached-changed - Fired when the `maxFilesReached` property changes.
  * @event mm-upload-before             - Fired before the XHR is opened.
  * @event mm-upload-start              - Fired when the XHR is sent.
  * @event mm-upload-progress           - Fired as many times as the progress is updated.
  * @event mm-upload-success            - Fired in case the upload process succeeded.
  * @event mm-upload-error              - Fired in case the upload process failed.
  * @event mm-upload-request            - Fired when the XHR has been opened but not sent yet.
  * @event mm-upload-response           - Fired when on the server response before analyzing it.
  * @event mm-upload-retry              - Fired when retry upload is requested.
  * @event mm-upload-abort              - Fired when upload abort is requested.
  */
@customElement('mm-upload')
export class MMUpload extends MimicElement {

	//#region properties
	/**
	 * The server URL.
	 *
	 * The default value is an empty string, which means that _window.location_ will be used.
	 */
	@property({ type: String }) public target = '';

	/** HTTP Method used to send the files. Only POST and PUT are allowed. */
	@property({ type: String }) public method: 'POST' | 'PUT' = 'POST';

	/**
	 * Specifies the types of files that the server accepts.
	 *
	 * Syntax: a comma-separated list of MIME type patterns (wildcards are
	 * allowed) or file extensions.
	 *
	 * Notice that MIME types are widely supported, while file extensions
	 * are only implemented in certain browsers, so avoid using it.
	 *
	 * Example: accept="video/*,image/tiff" or accept=".pdf,audio/mp3"
	 */
	@property({ type: String }) public accept = '';

	/** Specifies the 'name' property at Content-Disposition */
	@property({ type: String, attribute: 'form-data-name' }) public formDataName = 'file';

	/**
	 * Pass-through to input's capture attribute.
	 *
	 * Allows user to trigger device inputs such as camera or microphone immediately.
	 */
	@property({ type: String }) public capture?: string;

	/**
	 * Key-Value map to send to the server.
	 *
	 * If you set this property as an attribute, use a valid JSON string, for example:
	 * ```
	 * <mm-upload headers='{"X-Foo": "Bar"}'></mm-upload>
	 * ```
	 */
	@property({ type: Object }) public headers: Record<string, string> = {};

	/**
	 * The array of files being processed, or already uploaded.
	 *
	 * Each element is a [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File)
	 * object with a number of extra properties  to track the upload process.
	 */
	@property({ type: Array }) public files: EnhancedFile[] = [];

	/**
	 * Limit of files to upload, by default it is unlimited. If the value is
	 * set to one, native file browser will prevent selecting multiple files.
	 */
	@property({ type: Number, attribute: 'max-files' }) public maxFiles = Infinity;

	/**
	 * Max time in milliseconds for the entire upload process, if exceeded the
	 * request will be aborted. Zero means that there is no timeout.
	 */
	@property({ type: Number }) public timeout = 0;

	/**
	 * Specifies the maximum file size in bytes allowed to upload.
	 *
	 * Notice that it is a client-side constraint, which will be checked before
	 * sending the request.
	 *
	 * Obviously you need to do the same validation in the server-side and be sure that they are aligned.
	 */
	@property({ type: Number, attribute: 'max-file-size' }) public maxFileSize = Infinity;

	/** Specifies if the maximum number of files have been uploaded */
	@property({ type: Boolean, attribute: 'max-filmm-reached', reflect: true  }) public maxFilesReached = false;

	/**
	 * Define whether the element supports dropping files on it for uploading.
	 *
	 * By default it's enabled in desktop and disabled in touch devices
	 * because mobile devices do not support drag events in general.
	 *
	 * Setting it false means that drop is enabled even in touch-devices, and true
	 * disables drop in all devices.
	 *
	 * @default true in touch-devices, false otherwise.
	 */
	@property({ type: Boolean, reflect: true }) public nodrop = isTouch;

	/**
	 * Prevents upload(s) from immediately uploading upon adding file(s).
	 *
	 * When set, you must manually trigger uploads using the `uploadFiles` method
	 */
	@property({ type: Boolean, attribute: 'no-auto' }) public noAuto = false;

	/** Set the withCredentials flag on the request. */
	@property({ type: Boolean, attribute: 'with-credentials' }) public withCredentials = false;

	/** Specifies if the dragover is validated with maxFiles and accept properties. */
	@state() protected dragoverValid = false;

	@state() protected dragover = false;

	@query('input') protected inputQry: HTMLInputElement;

	protected get fileQry(): NodeListOf<MMUploadFile> {
		return this.slots.test('file-list')
			? this.querySelectorAll('mm-upload-file')
			: this.renderRoot.querySelectorAll('mm-upload-file');
	}

	protected get isMultiple(): boolean {
		return this.maxFiles !== 1;
	}
	//#endregion


	//#region controllers
	protected readonly mutations = new MutationObserver(() => this.requestUpdate());

	protected readonly events = new EventController({ host: this });

	protected readonly slots = new SlotController({
		host:      this,
		slotNames: [ 'file-list', 'drop-label-icon', 'drop-label', 'add-button' ],
	});
	//#endregion


	//#region lifecycle
	public override connectedCallback(): void {
		super.connectedCallback();

		this.mutations.observe(this, { childList: true });
		this.events.addEventListener(this, 'dragover',          this.handleDragover.bind(this));
		this.events.addEventListener(this, 'dragleave',         this.handleDragleave.bind(this));
		this.events.addEventListener(this, 'drop',              this.handleDrop.bind(this));
		this.events.addEventListener(this, 'mm-file-retry',     this.handleFileRetry.bind(this) as any);
		this.events.addEventListener(this, 'mm-file-abort',     this.handleFileAbort.bind(this) as any);
		this.events.addEventListener(this, 'mm-file-remove',    this.handleFileRemove.bind(this) as any);
		this.events.addEventListener(this, 'mm-file-start',     this.handleFileStart.bind(this) as any);
		this.events.addEventListener(this, 'mm-file-reject',    this.handleFileReject.bind(this) as any);
		this.events.addEventListener(this, 'mm-upload-start',   this.handleUploadStart.bind(this) as any);
		this.events.addEventListener(this, 'mm-upload-success', this.handleUploadSuccess.bind(this) as any);
		this.events.addEventListener(this, 'mm-upload-error',   this.handleUploadError.bind(this) as any);
	}

	protected override willUpdate(changedProperties: PropertyValues<this>): void {
		super.willUpdate(changedProperties);

		this.maxFilesReached = this.maxFilesAdded(this.maxFiles, this.files.length);
	}

	public override disconnectedCallback(): void {
		super.disconnectedCallback();
		this.mutations.disconnect();
	}
	//#endregion


	//#region logic
	@watch('dragover')
	protected onDragover(dragover: boolean): void {
		dragover
			? this.setAttribute('dragover', '')
			: this.removeAttribute('dragover');
	}

	@watch('dragoverValid')
	protected onDragoverValid(dragoverValid: boolean): void {
		dragoverValid
			? this.setAttribute('dragover-valid', '')
			: this.removeAttribute('dragover-valid');
	}

	protected formatSize(bytes: number): string {
		// https://wiki.ubuntu.com/UnitsPolicy
		const base = 1000;
		const unit = ~~(Math.log(bytes) / Math.log(base));
		const dec = Math.max(0, Math.min(3, unit - 1));
		const size = parseFloat((bytes / base ** unit).toFixed(dec));

		return `${ size } ${ tTerm('units.size', (text) => format(text, size.toString())) }`;
	}

	protected splitTimeByUnits(time: number): number[] {
		const unitSizes = [ 60, 60, 24, Infinity ];
		const timeValues = [ 0 ];

		for (let i = 0; i < unitSizes.length && time > 0; i++) {
			timeValues[i] = time % unitSizes[i]!;
			time = Math.floor(time / unitSizes[i]!);
		}

		return timeValues;
	}

	protected formatTime(split: number[]): string {
		// Fill HH:MM:SS with leading zeros
		while (split.length < 3)
			split.push(0);

		return split
			.reverse()
			.map((number) => (number < 10 ? '0' : '') + number)
			.join(':');
	}

	protected formatFileProgress(file: EnhancedFile): string {
		const remainingTime =
		file.loaded > 0
			? tTerm('uploading.remainingTime.prefix') + file.remainingStr
			: tTerm('uploading.remainingTime.unknown');

		return `${ file.totalStr }: ${ file.progress }% (${ remainingTime })`;
	}

	protected maxFilesAdded(maxFiles: number, numFiles: number): boolean {
		return maxFiles >= 0 && numFiles >= maxFiles;
	}

	protected createXhr(): XMLHttpRequest {
		return new XMLHttpRequest();
	}

	protected configureXhr(xhr: XMLHttpRequest): void {
		if (typeof this.headers === 'string') {
			try {
				this.headers = JSON.parse(this.headers);
			}
			catch (e) {
				this.headers = {};
			}
		}

		Object.entries(this.headers).forEach(([ key, value ]) => {
			xhr.setRequestHeader(key, value);
		});

		if (this.timeout)
			xhr.timeout = this.timeout;

		xhr.withCredentials = this.withCredentials;
	}

	protected setStatus(file: EnhancedFile, total: number, loaded: number, elapsed: number): void {
		file.speed        = ~~(total / elapsed / 1024);
		file.status       = this.formatFileProgress(file);
		file.elapsed      = elapsed;
		file.elapsedStr   = this.formatTime(this.splitTimeByUnits(file.elapsed));
		file.remaining    = Math.ceil(elapsed * (total / loaded - 1));
		file.remainingStr = this.formatTime(this.splitTimeByUnits(file.remaining));
		file.totalStr     = this.formatSize(total);
		file.loadedStr    = this.formatSize(loaded);
	}

	/** Triggers the upload of any files that are not completed */
	public uploadFiles(...files: EnhancedFile[]): void {
		files = !files.length ? this.files : files;
		files = files.filter((file) => !file.complete);
		files.forEach(this.uploadFile.bind(this));
	}

	protected uploadFile(file: EnhancedFile) {
		if (file.uploading)
			return;

		const ini = Date.now();
		const xhr = (file.xhr = this.createXhr());

		let stalledId: ReturnType<typeof setTimeout>;
		let last: number;

		// Onprogress is called always after onreadystatechange
		xhr.upload.onprogress = (e) => {
			clearTimeout(stalledId);

			last = Date.now();
			const elapsed      = (last - ini) / 1000;
			const loaded       = e.loaded;
			const total        = e.total;
			const progress     = ~~((loaded / total) * 100);
			file.loaded        = loaded;
			file.progress      = progress;
			file.indeterminate = loaded <= 0 || loaded >= total;

			if (file.error) {
				file.indeterminate = !!(file.status = '');

				console.log('file error');
			}
			else if (!file.abort) {
				if (progress < 100) {
					this.setStatus(file, total, loaded, elapsed);
					stalledId = setTimeout(async () => {
						file.status = tTerm('uploading.status.stalled');
						this.notifyFileChanges(file);
					}, 2000);
				}
				else {
					file.loadedStr = file.totalStr;
					file.status = tTerm('uploading.status.processing');
				}
			}

			this.notifyFileChanges(file);

			emitEvent(this, 'mm-upload-progress', { detail: { file, xhr } });
		};

		// More reliable than xhr.onload
		xhr.onreadystatechange = () => {
			if (xhr.readyState === 4) {
				clearTimeout(stalledId);
				file.indeterminate = file.uploading = false;
				if (file.abort) {
					this.notifyFileChanges(file);

					return;
				}

				file.status = '';
				// Custom listener can modify the default behavior either
				// preventing default, changing the xhr, or setting the file error
				const evt = emitEvent(this, 'mm-upload-response', {
					detail:     { file, xhr },
					cancelable: true,
				});

				if (!evt)
					return;

				if (xhr.status === 0)
					file.error = tTerm('uploading.error.serverUnavailable');
				else if (xhr.status >= 500)
					file.error = tTerm('uploading.error.unexpectedServerError');
				else if (xhr.status >= 400)
					file.error = tTerm('uploading.error.forbidden');

				file.complete = !file.error;
				emitEvent(this, `mm-upload-${ file.error ? 'error' : 'success' }`, {
					detail: { file, xhr },
				});

				console.log('ready state changed', file.error);

				this.notifyFileChanges(file);
			}
		};

		const formData = new FormData();

		file.uploadTarget = file.uploadTarget || this.target || '';
		file.formDataName = this.formDataName;

		const evt = emitEvent(this, 'mm-upload-before', {
			detail:     { file, xhr, uploadTarget: file.uploadTarget },
			cancelable: true,
		});

		if (!evt)
			return;

		formData.append(file.formDataName, file, file.name);

		xhr.open(this.method, file.uploadTarget, true);
		this.configureXhr(xhr);

		file.status = tTerm('uploading.status.connecting');
		file.indeterminate = true;
		file.uploading = file.indeterminate;
		file.held = false;
		file.abort = false;
		file.complete = file.abort;
		file.error = '';

		xhr.upload.onloadstart = () => {
			emitEvent(this, 'mm-upload-start', {
				detail: { file, xhr },
			});

			this.notifyFileChanges(file);
		};

		// Custom listener could modify the xhr just before sending it
		// preventing default
		const uploadEvt = emitEvent(this, 'mm-upload-request', {
			detail:     { file, xhr, formData },
			cancelable: true,
		});

		if (uploadEvt)
			xhr.send(formData);
	}

	protected retryFileUpload(file: EnhancedFile): void {
		const evt = emitEvent(this, 'mm-upload-retry', {
			detail:     { file, xhr: file.xhr! },
			cancelable: true,
		});

		if (evt)
			this.uploadFile(file);
	}

	protected abortFileUpload(file: EnhancedFile): void {
		const evt = emitEvent(this, 'mm-upload-abort', {
			detail:     { file, xhr: file.xhr! },
			cancelable: true,
		});

		if (evt) {
			file.abort = true;
			if (file.xhr)
				file.xhr.abort();

			this.notifyFileChanges(file);
		}
	}

	protected notifyFileChanges(_file: EnhancedFile): void {
		this.fileQry.forEach(el => el.requestUpdate());
	}

	protected addFiles(...files: File[]): void {
		files.forEach(this.addFile.bind(this));
	}

	/**
	 * Add the file for uploading.
	 *
	 * Called internally for each file after picking files from dialog or dropping files.
	 */
	protected addFile(file: File) {
		const enhancedFile = enhanceFile(file);

		if (this.maxFilesReached) {
			const error = tTerm('error.tooManyFiles');
			emitEvent(this, 'mm-file-reject', {
				detail: { file: enhancedFile, error },
			});

			return;
		}
		if (this.maxFileSize >= 0 && enhancedFile.size > this.maxFileSize) {
			const error = tTerm('error.fileIsTooBig');
			emitEvent(this, 'mm-file-reject', {
				detail: { file: enhancedFile, error },
			});

			return;
		}

		const fileExt = enhancedFile.name.match(/\.[^.]*$|$/)![0]!;
		// Escape regex operators common to mime types
		const escapedAccept = this.accept.replace(/[+.]/g, '\\$&');
		// Create accept regex that can match comma separated patterns, star (*) wildcards
		const re = new RegExp(`^(${ escapedAccept.replace(/[, ]+/g, '|').replace(/\/\*/g, '/.*') })$`, 'i');
		if (this.accept && !(re.test(enhancedFile.type) || re.test(fileExt))) {
			const error = tTerm('error.incorrectFileType');
			emitEvent(this, 'mm-file-reject', {
				detail: { file: enhancedFile, error },
			});

			return;
		}

		enhancedFile.loaded = 0;
		enhancedFile.held = true;
		enhancedFile.status = tTerm('uploading.status.held');
		this.files = [ enhancedFile, ...this.files ];

		if (!this.noAuto)
			this.uploadFile(enhancedFile);
	}

	/**
	 * Remove file from upload list.
	 *
	 * Called internally if file upload was canceled.
	 */
	protected removeFile(file: EnhancedFile): void {
		if (this.files.indexOf(file) > -1)
			this.files = this.files.filter((i) => i !== file);
	}

	protected handleDragover(event: DragEvent): void {
		if (!event.dataTransfer)
			return;

		event.preventDefault();
		if (!this.nodrop && !this.dragover) {
			this.dragoverValid = !this.maxFilesReached;
			this.dragover = true;
		}

		event.dataTransfer.dropEffect = !this.dragoverValid || this.nodrop ? 'none' : 'copy';
	}

	protected handleDragleave(event: DragEvent): void {
		event.preventDefault();
		if (this.dragover && !this.nodrop)
			this.dragover = this.dragoverValid = false;
	}

	protected handleDrop(event: DragEvent): void {
		if (this.nodrop || !event.dataTransfer)
			return;

		event.preventDefault();
		this.dragover = this.dragoverValid = false;
		this.addFiles(...[ ...event.dataTransfer.files ]);
	}

	protected handleAddFilesTouchEnd(event: Event): void {
		// Cancel the event to avoid the following click event
		event.preventDefault();
		this.handleAddFilesClick(event);
	}

	protected handleAddFilesClick(event: Event): void {
		if (this.maxFilesReached)
			return;

		event.stopPropagation();
		this.inputQry.value = '';
		this.inputQry.click();
	}

	protected handleFileInputChange(event: Event): void {
		this.addFiles(...[ ...(event.target as HTMLInputElement).files! ]);
	}

	protected handleFileStart(event: HTMLElementEventMap['mm-file-start']): void {
		this.uploadFile(event.detail.file);
	}

	protected handleFileRetry(event: HTMLElementEventMap['mm-file-retry']): void {
		this.retryFileUpload(event.detail.file);
	}

	protected handleFileAbort(event: HTMLElementEventMap['mm-file-abort']): void {
		this.abortFileUpload(event.detail.file);
	}

	protected handleFileRemove(event: HTMLElementEventMap['mm-file-remove']): void {
		this.removeFile(event.detail.file);
	}

	protected handleFileReject(event: HTMLElementEventMap['mm-file-reject']): void {
		console.log(`${ event.detail.file.name }: ${ event.detail.file.error }`, { mode: 'alert' });
	}

	protected handleUploadStart(event: HTMLElementEventMap['mm-upload-start']): void {
		console.log(`${ event.detail.file.name }: 0%`, { mode: 'alert' });
	}

	protected handleUploadSuccess(event: HTMLElementEventMap['mm-upload-success']): void {
		console.log(`${ event.detail.file.name }: 100%`, { mode: 'alert' });
	}

	protected handleUploadError(event: HTMLElementEventMap['mm-upload-error']): void {
		console.log(`${ event.detail.file.name }: ${ event.detail.file.error }`, { mode: 'alert' });
	}
	//#endregion


	//#region template
	public override render(): unknown {
		return html`
		<div part="primary-buttons">
			<div
				id        ="addFiles"
				@click    =${ this.handleAddFilesClick }
				@touchend =${ this.handleAddFilesTouchEnd }
			>
				<slot name="add-button">
					<mm-button
						id        ="addButton"
						shape     ="sharp"
						part      ="upload-button"
						?disabled =${ this.maxFilesReached }
					>
						${ this.maxFiles <= 1
							? tTerm('addFiles.one')
							: tTerm('addFiles.many') }
					</mm-button>
				</slot>
			</div>

			<div
				id          ="dropLabelContainer"
				part        ="drop-label"
				aria-hidden ="true"
				?hidden     =${ this.nodrop }
			>
				<slot name="drop-label-icon">
					<mm-icon
						part    ="drop-label-icon"
						.template=${ systemIcons.cloudArrowUp }
					></mm-icon>
				</slot>

				<slot
					id   ="dropLabel"
					name ="drop-label"
				>
				${ tTerm(this.maxFiles <= 1 ? 'dropFiles.one' : 'dropFiles.many') }
				</slot>
			</div>
		</div>

		${ when(this.slots.test('file-list') || this.files.length, () => html`
		<slot name="file-list">
			<ul id="fileList" part="file-list">
				${ repeat(this.files, (file, index) => html`
				${ when(index > 0, () => html`
					<!-- Need to move this over -->
					<mm-divider></mm-divider>
				`) }
				<li>
					<mm-upload-file .file=${ file }></mm-upload-file>
				</li>
				`) }
			</ul>
		</slot>
		`) }

		${ when(this.slots.test('[default]'), () => html`
		<slot></slot>
		`) }

		<input
			hidden
			id        ="fileInput"
			type      ="file"
			accept    =${ this.accept }
			capture   =${ ifDefined(this.capture) }
			?multiple =${ this.isMultiple }
			@change   =${ this.handleFileInputChange }
		/>
		`;
	}
	//#endregion


	//#region style
	public static override styles = [
		sharedStyles,
		css`
		:host {
			position: relative;
			display: flex;
			flex-flow: column nowrap;
			gap: 12px;
		}
		[part='primary-buttons'] {
			display: flex;
			gap: 12px;
			align-items: center;
		}
		[part='file-list'] {
			padding: 0;
			margin: 0;
			list-style-type: none;
			display: flex;
			flex-flow: column nowrap;
			gap: 12px;
		}
		[part='drop-label'] {
			display: flex;
			align-items: center;
			gap: 8px;
		}
		`,
	];
	//#endregion

}
