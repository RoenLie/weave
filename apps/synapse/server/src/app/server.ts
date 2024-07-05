import { registerControllers } from '../utilities/file-routes.js';
import { server } from './main.js';


await registerControllers('api');

const url = new URL(process.env.URL);
server.listen(Number(url.port), url.hostname, () => {
	console.log(`⚡️[server]: Server is running at ${ process.env.URL }`);
});
