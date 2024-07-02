import { RouteHistory } from './route-history-base.js';


export class RouteHistoryUrl extends RouteHistory {

	/* should be run when the router historian is assigned to the router */
	public connected() {
		window.addEventListener('popstate', () => {
			this.setRoute(this.getRoute());
		});
	}

	/* should be run when router itself is disconnected */
	public disconnected() {

	}

	public getRoute() {
		return location.pathname;
	}

	public setRoute(route: string) {
		history.pushState({}, '', route || './');
		window.dispatchEvent(new PopStateEvent('popstate'));

		return route;
	}

	public appendHistory(_route: string): void {
	}

	public clearHistory(): void {
	}

}
