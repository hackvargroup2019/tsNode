import {HttpClient} from "./lib/httpClient/httpClient";
import {Azureme} from "./azureme";
require('events').EventEmitter.defaultMaxListeners = 5;

const cheerio = require('cheerio');
function uniq(a) {
	return a.sort().filter(function(item, pos, ary) {
		return !pos || item != ary[pos - 1];
	})
}

const PATH = 'dist/assets/imgs/';
export class App {
	private httpClient = new HttpClient();
	link = 'https://www.cucinelube.it/public/image/cucinelube_x2.png';
	links = [];
	page = 0;
	private baselink: any;

	constructor(){
		console.log('app creata');
		this.baselink = this.link.split('//');
		this.baselink = this.baselink[0] + '//' + this.baselink[1].split('/')[0];
	}

	getCreoLube(link: string) : Promise<any>{
		let azure = new Azureme();
		return azure.evaluate(link,['es','en']);
	}
}

let app = new App();
app.getCreoLube(app.link).then((result) => {
	console.log(JSON.stringify(result));
	//result = result;
	//console.log(result.regions);
	/*result.regions.forEach((lines => {
		let line = '';
		lines.words.forEach(word => {
			line+=word.text+' ';
		})
		console.log(line);
	}))*/

}).catch((err) => {
	if(err[1])
		console.error('error:', err[0], err[1].statusCode);
	else
		console.error('err:',err);
});
