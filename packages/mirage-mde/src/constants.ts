import type { RecordOf } from '@roenlie/mimic-core/types';

import type { BlockStyleOptions, ImageErrorTextsOptions, PromptTexts } from './mirage-mde-types.js';


export const promptTexts: PromptTexts = {
	link:  'URL for the link:',
	image: 'URL of the image:',
};


const _timeFormat = {
	locale: 'en-US',
	format: {
		hour:   '2-digit',
		minute: '2-digit',
	},
};
export const timeFormat: RecordOf<
	typeof _timeFormat,
	string,
	string | {hour: string; minute: string}
> = _timeFormat;


export const blockStyles: BlockStyleOptions = {
	'bold':   '**',
	'code':   '```',
	'italic': '*',
};


/**
 * Texts displayed to the user (mainly on the status bar) for the import image
 * feature. Can be used for customization or internationalization.
 */
const _imageTexts = {
	sbInit:        'Attach files by drag and dropping or pasting from clipboard.',
	sbOnDragEnter: 'Drop image to upload it.',
	sbOnDrop:      'Uploading image #images_names#...',
	sbProgress:    'Uploading #file_name#: #progress#%',
	sbOnUploaded:  'Uploaded #image_name#',
	sizeUnits:     ' B, KB, MB',
};
export const imageTexts: RecordOf<typeof _imageTexts, string, string> = _imageTexts;


/**
 * Errors displayed to the user, using the `errorCallback` option. Can be used for
 * customization or internationalization.
 */
export const errorMessages: ImageErrorTextsOptions = {
	noFileGiven:    'You must select a file.',
	typeNotAllowed: 'This image type is not allowed.',
	fileTooLarge:   'Image #image_name# is too big (#image_size#).\n' +
        'Maximum file size is #image_max_size#.',
	importError: 'Something went wrong when uploading the image #image_name#.',
};
