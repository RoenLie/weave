export interface EnhancedFile extends File {
	/** The target URL used to upload this file. */
	uploadTarget:  string;
	/** Elapsed time since the upload started. */
	elapsed:       number;
	/** Human-readable elapsed time. */
	elapsedStr:    string;
	/** Number of seconds remaining for the upload to finish. */
	remaining:     number;
	/** Human-readable remaining time for the upload to finish. */
	remainingStr:  string;
	/** Percentage of the file already uploaded. */
	progress:      number;
	/** Upload speed in kB/s. */
	speed:         number;
	/** Human-readable total size of the file. */
	totalStr:      string;
	/** Bytes transferred so far. */
	loaded:        number;
	/** Human-readable uploaded size at the moment. */
	loadedStr:     string;
	/** Status of the upload process. */
	status:        string;
	/** Error message in case the upload failed. */
	error:         string;
	/** True if the file was canceled by the user. */
	abort:         boolean;
	/** True when the file was transferred to the server. */
	complete:      boolean;
	/** True while transferring data to the server. */
	uploading:     boolean;
	/** True when the data transfer is on hold. */
	held:          boolean;
	/** True when the data transfer is in the process of starting. */
	indeterminate: boolean;
	/** Specifies the 'name' property at Content-Disposition. */
	formDataName:  string;
	/** The request object for this file. */
	xhr:           XMLHttpRequest
}


export const enhanceFile = (file: File): EnhancedFile => {
	return Object.assign(file, {
		uploadTarget:  '',
		elapsed:       0,
		elapsedStr:    '',
		remaining:     0,
		remainingStr:  '',
		progress:      0,
		speed:         0,
		totalStr:      '',
		loaded:        0,
		loadedStr:     '',
		status:        '',
		error:         '',
		held:          false,
		abort:         false,
		complete:      false,
		uploading:     false,
		indeterminate: false,
		formDataName:  '',
	}) as EnhancedFile;
};
