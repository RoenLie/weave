import { AppComponent, AppHost } from '@roenlie/sanguine';
import { layers, scopes } from './app/definitions.ts';
import { css, html, render } from 'lit';


AppComponent.styles = css`
:host, * {
	box-sizing: border-box;
}
`;

AppHost.defineLayers(layers);
AppHost.defineScopes(scopes, (connector) => {
	connector.connect(s => s.root, {
		mapper: () => [ [ 'page', 'root' ] ],
	});
});

AppHost.registerBundles((connect) => {
});

AppHost.connect({
	async afterBundleConnection() {
		await import('./pages/root/root-page.ts')
			.then(m => m.RootPageCmp.register());
	},
});


render(html`<ho-root-page></ho-root-page>`, document.body);
