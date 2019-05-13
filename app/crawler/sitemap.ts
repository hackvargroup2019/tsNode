import { Site } from './site';

export class SiteMap {
	edges: any;
	nodes: Site[];
	private regexHTTPValidator: RegExp = RegExp(
		'^(http://www.|https://www.|http://|https://)?[a-z0-9]+([-.]{1}[a-z0-9]+)*.[a-z]{2,5}(:[0-9]{1,5})?(/.*)?$'
	);

	constructor() {
		this.edges = {};
		this.nodes = [];
	}

	public addNode(node: Site) {
		this.nodes.push(node);
		this.edges[node.URL] = [];
	}

	public addEdgeDirected(nodeFrom: string, nodeTo: string) {
		this.edges[nodeFrom].push(nodeTo);
	}

	public addEdge(firstNode: string, secondNode: string) {
		this.edges[firstNode].push(secondNode);
		this.edges[secondNode].push(firstNode);
	}

	public printGraph() {
		let result: string = '';
		for (let node of this.nodes) {
			for (let connectingNode of this.edges[node.URL]) {
				result += node.URL + ' --> ' + connectingNode + '\n';
			}
		}
		console.log(result);
	}

	public checkVisited(): boolean {
		for (let element of this.nodes) {
			if (element.visited === false) return true;
		}
		return false;
	}

	public getLastNotVisitedURL(): number {
		for (let i = 0; i < this.nodes.length; i++) {
			if (this.nodes[i].visited === false && this.regexHTTPValidator.exec(this.nodes[i].URL)) {
				return i;
			} else {
				this.nodes[i].visited = true;
			}
		}
	}
}
