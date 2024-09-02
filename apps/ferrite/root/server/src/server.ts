import { createProxyMiddleware } from 'http-proxy-middleware';
import { mapEndpoints, registerEndpoints } from './app/endpoint-mapper.js';
import { app, server } from './app/main.js';

//await mapEndpoints('src/api/**.controller.ts');
//await registerEndpoints();

app.use(createProxyMiddleware({
	pathFilter:   path => path.startsWith('/absence'),
	pathRewrite:  path => path.replace(/^\/absence/, ''),
	target:       'http://localhost:6002/absence',
	changeOrigin: true,
	ws:           true,
	toProxy:      true,
}));

app.use(createProxyMiddleware({
	pathFilter:   path => path.startsWith('/handover'),
	pathRewrite:  path => path.replace(/^\/handover/, ''),
	target:       'http://localhost:6001/handover',
	changeOrigin: true,
	ws:           true,
	toProxy:      true,
}));

app.use(createProxyMiddleware({
	pathFilter:   path => path.startsWith('/home'),
	pathRewrite:  path => path.replace(/^\/home/, ''),
	target:       'http://localhost:6000/home',
	changeOrigin: true,
	ws:           true,
	toProxy:      true,
}));

app.get('/', (_, res) => {
	res.redirect('/home');
});


const serverUrl = new URL(process.env.URL);
server.listen(Number(serverUrl.port), serverUrl.hostname, () => {
	console.log(`⚡️[server]: Server is running at ${ process.env.URL }`);
});
