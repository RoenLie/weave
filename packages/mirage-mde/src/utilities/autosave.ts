import { MirageMDE } from '../mirage-mde.js';


// Safari, in Private Browsing Mode, looks like it supports localStorage
// but all calls to setItem throw QuotaExceededError.
// We're going to detect this and set a variable accordingly.
const isLocalStorageAvailable = () => {
	if (typeof localStorage === 'object') {
		try {
			localStorage.setItem('mmde_localStorage', String(1));
			localStorage.removeItem('mmde_localStorage');
		}
		catch (e) {
			return false;
		}
	}
	else {
		return false;
	}

	return true;
};


export const autosave = function(this: MirageMDE) {
	//if (!isLocalStorageAvailable())
	//	return console.log('MirageMDE: localStorage not available, cannot autosave');

	//const autosave = this.options.autosave;

	//if (!autosave)
	//	return;
	//if (autosave.uniqueId == undefined || autosave.uniqueId == '')
	//	return console.log('MirageMDE: You must set a uniqueId to use the autosave feature');


	//if (autosave.bound !== true) {
	//	if (this.element.form != null && this.element.form != undefined) {
	//		this.element.form.addEventListener('submit', () => {
	//			clearTimeout(this.autosaveTimeoutId);
	//			this.autosaveTimeoutId = undefined;

	//			localStorage.removeItem('mmde_' + autosave.uniqueId);
	//		});
	//	}

	//	autosave.bound = true;
	//}

	//if (autosave.loaded !== true) {
	//	if (typeof localStorage.getItem('mmde_' + autosave.uniqueId) == 'string' && localStorage.getItem('mmde_' + autosave.uniqueId) != '') {
	//		const value = localStorage.getItem('mmde_' + autosave.uniqueId);
	//		value && this.codemirror.setValue(value);
	//		autosave.foundSavedValue = true;
	//	}

	//	autosave.loaded = true;
	//}

	//const value = this.value(undefined);
	//if (typeof value === 'string') {
	//	if (value !== '')
	//		localStorage.setItem('mmde_' + autosave.uniqueId, value);
	//	else
	//		localStorage.removeItem('mmde_' + autosave.uniqueId);
	//}
	//else {
	//	localStorage.removeItem('mmde_' + autosave.uniqueId);
	//}

	//const el = document.getElementById('autosaved');
	//if (el) {
	//	const d = new Date();
	//	const dd = new Intl.DateTimeFormat(
	//		[ autosave.timeFormat?.locale ?? '', 'en-US' ].flat().filter(Boolean),
	//		autosave.timeFormat?.format,
	//	).format(d);

	//	const save = autosave.text == undefined
	//		? 'Autosaved: '
	//		: autosave.text;

	//	el.innerHTML = save + dd;
	//}
};


export const clearAutosavedValue = function(this: MirageMDE) {
	if (isLocalStorageAvailable()) {
		if (
			this.options.autosave == undefined ||
			this.options.autosave.uniqueId == undefined ||
			this.options.autosave.uniqueId == ''
		) {
			console.log('MirageMDE: You must set a uniqueId to clear the autosave value');

			return;
		}

		localStorage.removeItem('mmde_' + this.options.autosave.uniqueId);
	}
	else {
		console.log('MirageMDE: localStorage not available, cannot autosave');
	}
};
