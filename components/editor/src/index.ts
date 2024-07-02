export * from './monaco/index.js';

(async () => {
	if (document.head.querySelector('#monaco-styles'))
		return;

	const url = import.meta.url.split('/').slice(0, -1).join('/') + '/style.css';

	const link = document.createElement('link');
	link.id = 'monaco-styles';
	link.rel = 'stylesheet';
	link.href = url;
	document.head.appendChild(link);
})();
