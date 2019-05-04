import {HttpClient} from "./lib/httpClient/httpClient";

const cheerio = require('cheerio');;

export class App {
	private httpClient = new HttpClient();
	private link = 'https://nuovocentromobilitorre.it/promo/1403781';
	constructor(){
		console.log('app creata');
	}

	scrap() : Promise<any>{
		return new Promise((resolve,reject) => {
			this.httpClient.get(this.link).then((data) => {
				let $ = cheerio.load(data);
				let links = [];
				$('.cat-item a').each((index, element) => {
					links.push('https://nuovocentromobilitorre.it' + $(element).attr('href'));
				});
				links.forEach((link) => {
					let images = [];
					let descriptions = [];
					let res = this.httpClient.get(link);
						res.then((data) => {
						//console.log(data);
						console.log('categoria: ', link);
						let $1 = cheerio.load(data);
						$1('figure').each( (i, el) => {
							let img = $1(el).find('img');
							let desc = $1(el).find('figcaption');
							images.push([img.attr('src'),img.attr('alt')]);
							let data, desc_txt;
							data = desc.children('p').first().text();
							desc_txt = desc.children('p').next().text();
							descriptions.push({"titolo":desc.children('strong').text(),"data":data,"desc":desc_txt});
						})
						console.log(images);
						console.log(descriptions);
					}).catch((err)=>{
						console.log(err);
					}).then(()=>{
						images = [];
						descriptions = [];
					})
				})

			}).catch((err) => {
				console.log('errore', err);
				reject(err);
			})
		});
	}
}

let app = new App();
app.scrap();
