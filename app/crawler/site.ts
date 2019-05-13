export class Site {
	private _URL: string;
	private _visited: boolean;

	constructor(URL: string, visited: boolean) {
		this._URL = URL;
		this._visited = visited;
	}

	get URL(): string {
		return this._URL;
	}

	get visited(): boolean {
		return this._visited;
	}

	set URL(URL: string) {
		this._URL = URL;
	}

	set visited(visited: boolean) {
		this._visited = visited;
	}
}
