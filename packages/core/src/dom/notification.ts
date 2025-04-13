export const askForNotificationPermissions = (): Promise<NotificationPermission> | undefined => {
	// Check if the browser supports notifications
	if (!('Notification' in window))
		return;

	// We need to ask the user for permission
	if (Notification.permission !== 'granted' && Notification.permission !== 'denied')
		return Notification.requestPermission();
};


export const notification = (title: string, body: string): void => {
	// Check if the browser supports notifications
	if (!('Notification' in window))
		return;

	if (Notification.permission === 'granted') {
		new Notification(title, {
			body: body,
		});
	}
	else if (Notification.permission !== 'denied') {
		Notification.requestPermission().then((permission) => {
			if (permission === 'granted')
				notification(title, body);
		});
	}
};
