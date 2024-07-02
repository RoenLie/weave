export abstract class RouteHistory {

	protected history: string[] = [];
	public abstract getRoute(): string;
	public abstract setRoute(route: string): string;
	public abstract appendHistory(route: string): void;
	public abstract clearHistory(): void;

}
