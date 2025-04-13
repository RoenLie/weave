export const isTouch: boolean = (() => {
	try {
		document.createEvent('TouchEvent');

		return true;
	}
	catch {
		return false;
	}
})();
