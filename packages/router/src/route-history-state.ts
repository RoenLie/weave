import { RouteHistory } from './route-history-base.js';


export class RouteHistoryState extends RouteHistory {

	protected currentRoute = '';

	public getRoute() {
		return this.currentRoute;
	}

	public setRoute(route: string) {
		this.currentRoute = route;
		this.appendHistory(route);

		return route;
	}

	public appendHistory(route: string) {
		this.history.push(route);
	}

	public clearHistory() {
		this.history.length = 0;
	}

}
