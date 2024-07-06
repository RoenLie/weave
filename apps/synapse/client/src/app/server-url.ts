export const serverUrl = import.meta.env.VITE_SERVER_URL;


export class ServerURL extends URL {

	constructor(url: string | URL) {
		super(url, serverUrl);
	}

}
