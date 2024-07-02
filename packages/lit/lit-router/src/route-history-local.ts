import { RouteHistory } from './route-history-base.js';
import { storageHandler } from './utilities/storageHandler.js';


export class RouteHistoryLocal extends RouteHistory {

	public getRoute() {
		return storageHandler.getItem('currentRoute', '');
	}

	public setRoute(route: string) {
		storageHandler.setItem('currentRoute', route);
		this.appendHistory(route);

		return route;
	}

	public appendHistory(route: string) {
		const history = storageHandler.getItem<string[]>('routeHistory', []);
		history.push(route);

		storageHandler.setItem('routeHistory', history);
	}

	public clearHistory() {
		this.history.length = 0;
	}

}
