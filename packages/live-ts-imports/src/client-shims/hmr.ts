const url = 'ws://' + location.host;

const setupConnection = () => {
	try {
		let socket = new WebSocket(url);

		socket.addEventListener('message', (ev) => {
			if (ev.data === 'reload')
				location.reload();
		});

		socket.addEventListener('close', async () => {
			socket = new WebSocket(url);
			socket.addEventListener('open', () => location.reload());
		});
	}
	catch (err) {
		setupConnection();
	}
};

setupConnection();
