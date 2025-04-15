export const accurateTimer = (fn: (...args: any) => any, time = 1000): {
	cancel: () => void;
} => {
	// nextAt is the value for the next time the timer should fire.
	// timeout holds the timeoutID so the timer can be stopped.
	let timeout: ReturnType<typeof setTimeout>;

	// Initilzes nextAt as now + the time in milliseconds you pass
	// to accurateTimer.
	let nextAt = new Date().getTime() + time;

	// This function schedules the next function call.
	const wrapper = () => {
		// The next function call is always calculated from when the
		// timer started.
		nextAt += time;

		// this is where the next setTimeout is adjusted to keep the
		//time accurate.
		timeout = setTimeout(wrapper, nextAt - new Date().getTime());

		// the function passed to accurateTimer is called.
		fn();
	};

	// this function stops the timer.
	const cancel = () => clearTimeout(timeout);

	// the first function call is scheduled.
	timeout = setTimeout(wrapper, nextAt - new Date().getTime());

	// the cancel function is returned so it can be called outside
	// accurateTimer.
	return { cancel };
};
