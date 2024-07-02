import { MirageMDE } from '../mirage-mde.js';


/**
 * Open the browse-file window to upload an image to a server.
 * @param [onSuccess] {function} see MirageMDE.prototype.uploadImage
 * @param [onError] {function} see MirageMDE.prototype.uploadImage
 */
export const openBrowseFileWindow = function(
	this: MirageMDE,
	onSuccess?: Function,
	onError?: Function,
) {
	const imageInput = this.gui.toolbar.getElementsByClassName('imageInput')[0]! as HTMLElement;
	dispatchEvent(new MouseEvent('click'));

	const onChange = (event: Event) => {
		const target = event.target as any;

		if (this.options.imageUploadFunction)
			this.uploadImagesUsingCustomFunction(this.options.imageUploadFunction, target.files);
		else
			this.uploadImages(target.files, onSuccess, onError);

		imageInput.removeEventListener('change', onChange);
	};

	imageInput.addEventListener('change', onChange);
};
