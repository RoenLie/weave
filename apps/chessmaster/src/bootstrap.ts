export {};

await import('@roenlie/mirage-utils/dist/lib/shims/shims.js');

if (window.top === window) {
	const activate = await import('@roenlie/mirage-utils/dist/lib/utils/mirage-utils.js').then(_ => _.activate);
	activate(__HOST__);
	await Mirage.auth.login(__USERNAME__, __PASSWORD__);
}
else {
	try {
		if (window.top?.Mirage && !window.Mirage)
			window.Mirage = window.top.Mirage;
	}
	catch (error) {
		const activate = await import('@roenlie/mirage-utils/dist/lib/utils/mirage-utils.js').then(_ => _.activate);
		activate(__HOST__);
		await Mirage.auth.login(__USERNAME__, __PASSWORD__);
	}
}

await import('./translations.js');
await import('./app.js');
