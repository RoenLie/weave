export const isTouch = (() => {
	try {
		document.createEvent('TouchEvent');

		return true;
	}
	catch {
		return false;
	}
})();
