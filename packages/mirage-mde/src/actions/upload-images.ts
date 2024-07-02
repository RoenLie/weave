import { MirageMDE } from '../mirage-mde.js';


/**
 * Upload asynchronously a list of images to a server.
 *
 * Can be triggered by:
 * - drag&drop;
 * - copy-paste;
 * - the browse-file window (opened when the user clicks on the *upload-image* icon).
 * @param {FileList} files The files to upload the the server.
 * @param [onSuccess] {function} see MirageMDE.prototype.uploadImage
 * @param [onError] {function} see MirageMDE.prototype.uploadImage
 */
export const uploadImages = function(
	this: MirageMDE,
	files: FileList,
	onSuccess?: Function,
	onError?: Function,
) {
//	if (files.length === 0)
//		return;

	//	const names = [];
	//	for (let i = 0; i < files.length; i++) {
	//		names.push(files[i]!.name);
	//		this.uploadImage(files[i]!, onSuccess, onError);
	//	}

//	this.updateStatusBar(
//		'upload-image',
//		this.options.imageTexts?.sbOnDrop
//			?.replace('#images_names#', names.join(', ')) ?? '',
//	);
};


/**
 * Upload asynchronously a list of images to a server.
 *
 * Can be triggered by:
 * - drag&drop;
 * - copy-paste;
 * - the browse-file window (opened when the user clicks on the *upload-image* icon).
 * @param imageUploadFunction {Function} The custom function to upload the image passed in options.
 * @param {FileList} files The files to upload the the server.
 */
export const uploadImagesUsingCustomFunction = function(
	this: MirageMDE,
	imageUploadFunction: Function,
	files: FileList,
) {
//	if (files.length === 0)
//		return;

//	const names = [];
//	for (let i = 0; i < files.length; i++) {
//		names.push(files[i]!.name);
//		this.uploadImageUsingCustomFunction(imageUploadFunction, files[i]!);
//	}
//	this.updateStatusBar(
//		'upload-image',
//		this.options.imageTexts?.sbOnDrop
//			?.replace('#images_names#', names.join(', ')) ?? '',
//	);
};


/**
 * Upload an image to the server.
 *
 * @param file {File} The image to upload, as a HTML5 File object (https://developer.mozilla.org/en-US/docs/Web/API/File)
 * @param [onSuccess] {function} A callback function to execute after the image has been successfully uploaded, with one parameter:
 * - url (string): The URL of the uploaded image.
 * @param [onError] {function} A callback function to execute when the image upload fails, with one parameter:
 * - error (string): the detailed error to display to the user (based on messages from options.errorMessages).
 */
export const uploadImage = function(
	this: MirageMDE,
	file: File,
	onSuccess?: Function,
	onError?: Function,
) {
//	onSuccess ??= (imageUrl: string) => {
//		afterImageUploaded(this, imageUrl);
//	};

	//	const onErrorSup = (errorMessage: string) => {
	//		// show error on status bar and reset after 10000ms
	//		this.updateStatusBar('upload-image', errorMessage);

	//		setTimeout(() => {
	//			this.updateStatusBar('upload-image', this.options?.imageTexts?.sbInit ?? '');
	//		}, 10000);

	//		// run custom error handler
	//		if (onError && typeof onError === 'function')
	//			onError(errorMessage);

	//		// run error handler from options, this alerts the message.
	//		this.options.errorCallback?.(errorMessage);
	//	};

	//	const fillErrorMessage = (errorMessage: string) => {
	//		const { imageTexts, imageMaxSize = 0 } = this.options;
	//		if (!imageTexts)
	//			throw ('');

	//		const units = imageTexts?.sizeUnits?.split(',') ?? [];

	//		return errorMessage
	//			.replace('#image_name#', file.name)
	//			.replace('#image_size#', humanFileSize(file.size, units))
	//			.replace('#image_max_size#', humanFileSize(imageMaxSize, units));
	//	};

	//	if (file.size > (this.options?.imageMaxSize ?? 0)) {
	//		onErrorSup(fillErrorMessage(this.options?.errorMessages?.filesTooLarge ?? ''));

	//		return;
	//	}

	//	const formData = new FormData();
	//	formData.append('image', file);

	//	// insert CSRF body token if provided in config.
	//	if (this.options.imageCSRFToken && !this.options.imageCSRFHeader)
	//		formData.append(this.options?.imageCSRFName ?? '', this.options.imageCSRFToken);

	//	const request = new XMLHttpRequest();
	//	request.upload.onprogress = (event) => {
	//		if (event.lengthComputable) {
	//			const progress = '' + Math.round((event.loaded * 100) / event.total);

	//			this.updateStatusBar(
	//				'upload-image',
	//				(this.options?.imageTexts?.sbProgress ?? '')
	//					.replace('#file_name#', file.name).replace('#progress#', progress),
	//			);
	//		}
	//	};
	//	request.open('POST', this.options?.imageUploadEndpoint ?? '');

	//	// insert CSRF header token if provided in config.
	//	if (this.options.imageCSRFToken && this.options.imageCSRFHeader)
	//		request.setRequestHeader(this.options?.imageCSRFName ?? '', this.options.imageCSRFToken);

	//	request.onload = () => {
	//		let response: {
	//			data?: {
	//				filePath: string;
	//			};
	//			error?: string;
	//		};

	//		try {
	//			response = JSON.parse(request.responseText);
	//		}
	//		catch (error) {
	//			console.error('MirageMDE: The server did not return a valid json.');
	//			onErrorSup(fillErrorMessage(this.options.errorMessages!.importError!));

	//			return;
	//		}
	//		if (request.status === 200 && response && !response.error && response.data && response.data.filePath) {
	//			onSuccess?.((this.options.imagePathAbsolute ? '' : (window.location.origin + '/')) + response.data.filePath);
	//		}
	//		else {
	//			if (response.error && response.error in this.options.errorMessages!) {  // preformatted error message
	//				onErrorSup(fillErrorMessage(this.options.errorMessages?.[response.error] ?? ''));
	//			}
	//			else if (response.error) {  // server side generated error message
	//				onErrorSup(fillErrorMessage(response.error));
	//			}
	//			else {  //unknown error
	//				console.error('MirageMDE: Received an unexpected response after uploading the image.'
	//                    + request.status + ' (' + request.statusText + ')');

	//				onErrorSup(fillErrorMessage(this.options.errorMessages?.importError ?? ''));
	//			}
	//		}
	//	};

	//	request.onerror = (event) => {
	//		const target = event.target as XMLHttpRequest;

	//		console.error('MirageMDE: An unexpected error occurred when trying to upload the image.'
	//            + target.status + ' (' + target.statusText + ')');
	//		onErrorSup(this.options.errorMessages?.importError ?? '');
	//	};

//	request.send(formData);
};


/**
 * Upload an image to the server using a custom upload function.
 *
 * @param imageUploadFunction {Function} The custom function to upload the image passed in options
 * @param file {File} The image to upload, as a HTML5 File object (https://developer.mozilla.org/en-US/docs/Web/API/File).
 */
export const uploadImageUsingCustomFunction = function(
	this: MirageMDE,
	imageUploadFunction: Function,
	file: File,
) {
//	const onSuccess = (imageUrl: string) => {
//		afterImageUploaded(this, imageUrl);
//	};

	//	const onError = (errorMessage: string) => {
	//		const filledErrorMessage = fillErrorMessage(errorMessage);
	//		// show error on status bar and reset after 10000ms
	//		this.updateStatusBar('upload-image', filledErrorMessage);

	//		setTimeout(() => {
	//			this.updateStatusBar('upload-image', this.options.imageTexts?.sbInit ?? '');
	//		}, 10000);

	//		// run error handler from options, this alerts the message.
	//		this.options.errorCallback?.(filledErrorMessage);
	//	};

	//	const fillErrorMessage = (errorMessage: string) => {
	//		const units = this.options.imageTexts?.sizeUnits?.split(',') ?? [];

	//		return errorMessage
	//			.replace('#image_name#', file.name)
	//			.replace('#image_size#', humanFileSize(file.size, units))
	//			.replace('#image_max_size#', humanFileSize(this.options.imageMaxSize ?? 0, units));
	//	};

//	imageUploadFunction.apply(this, [ file, onSuccess, onError ]);
};


/**
 * Action executed after an image have been successfully imported on the server.
 */
export const afterImageUploaded = (editor: MirageMDE, url: string) => {
	//const cm = editor.codemirror;
	//const stat = getState(cm);
	//const options = editor.options;
	//const imageName = url.substr(url.lastIndexOf('/') + 1);
	//const ext = imageName.substring(imageName.lastIndexOf('.') + 1).replace(/\?.*$/, '').toLowerCase();

	//// Check if media is an image
	//if ([ 'png', 'jpg', 'jpeg', 'gif', 'svg', 'apng', 'avif', 'webp' ].includes(ext)) {
	//	_replaceSelection(cm, !!stat.image, options.insertTexts?.uploadedImage as any, url);
	//}
	//else {
	//	const text_link = (options.insertTexts?.link ?? [ '', '' ]) as [string, string];
	//	text_link[0] = '[' + imageName;
	//	_replaceSelection(cm, !!stat.link, text_link, url);
	//}

	//// show uploaded image filename for 1000ms
	//editor.updateStatusBar(
	//	'upload-image',
	//	editor.options.imageTexts?.sbOnUploaded?.replace('#image_name#', imageName) ?? '',
	//);

	//setTimeout(() => {
	//	editor.updateStatusBar('upload-image', editor.options.imageTexts?.sbInit ?? '');
	//}, 1000);
};
