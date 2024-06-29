import { registerControllers } from '../utilities/file-routes.js';
import { server } from './main.js';


await registerControllers('api');

server.listen(Number(process.env.PORT), process.env.HOST, () => {
	console.log(`⚡️[server]: Server is running at http://${ process.env.HOST }:${
		Number(process.env.PORT)
	}`);
});
