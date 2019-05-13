const puppeteer = require('puppeteer');
import { SiteMap } from './sitemap';
import { Site } from './site';
import * as fs from 'fs';
import path from 'path';
import { ImageManager } from './image';
import Jimp = require('jimp');

export class Crawler {
	public async crawlSite(baseURL: string) {
		(async () => {
			let findPromoRegex: RegExp = new RegExp(
                '^' + baseURL + '.*(promo|offer)+([a-zA-Z0-9!@$&()\\-`.+,/"]*[^#]*[a-zA-Z0-9!@$&()\\-`.+,/"]*$)$'
            );
			let regex2: RegExp = new RegExp(
				'^' + baseURL + '([a-zA-Z0-9!@$&()\\-`.+,/"]*[^#]*[a-zA-Z0-9!@$&()\\-`.+,/"]*$)$',
				'gm'
			);
			let foundURLs = new SiteMap();
			let imgPath: string = path
				.resolve('./extractedimgs/' + baseURL.replace(/(http(s)?:\/\/|www\.|\.(com|it)\/|\/)/g, '') + '/')
				.toString();

			this.createPath(imgPath);

			if(fs.existsSync(path.resolve(imgPath + '/screenshots/').toString())){
				fs.readdir(path.resolve(imgPath + '/screenshots/').toString(), (err, files) => {
					for(let x of files){
						console.log(x);
						fs.unlinkSync(path.resolve(imgPath + '/screenshots/' + x).toString());
					}
				})
			}

			this.createPath(path.resolve(imgPath + '/screenshots/').toString());

			console.log('Path per le immagini:', imgPath);

			foundURLs.addNode(new Site(baseURL, false));

			const args = [ '--disable-setuid-sandbox', '--no-sandbox' ];
			const options = {
				args,
				headless: true,
				ignoreHTTPSErrors: true
			};

			const browser = await puppeteer.launch(options);
			const page = await browser.newPage();
			await page.setViewport({ width: 1920, height: 1080 });

			while (foundURLs.checkVisited()) {
				let pos = foundURLs.getLastNotVisitedURL();
				let links: any;
				let images: string[];

				try {
					await page.goto(foundURLs.nodes[pos].URL, {
						waitUntil: [ 'load', 'networkidle2' ],
						timeout: 60000
					});
				} catch (error) {
					console.log('ERRORE:', error);
					foundURLs.nodes[pos].visited = true;
					pos = foundURLs.getLastNotVisitedURL();
					continue;
				}

				foundURLs.nodes[pos].visited = true;

				await page.evaluate(() => {
					window.scrollBy(0, window.innerHeight);
				});

				//TODO: FIXARE IL PATH DELLA SCREENSHOT QUANDO C'E' UNA STRING QUERY
				await page
					.screenshot({
						path: path
							.resolve(
								imgPath +
									'/screenshots/' +
									foundURLs.nodes[pos].URL.replace(/(http(s)?:\/\/|www\.|\.(com|it)\/|\/)/g, '') +
									'.png'
							)
							.toString(),
						fullPage: true
					})
					.catch((err) => console.log(err));

				links = await page.$$eval('a', (as) =>
					as.map((a) => ({
						URL: a.href,
						text: a.text
					}))
				);
				images = await page.$$eval('img', (imgs) => imgs.map((img) => img.src));
				images = images
					.filter((img) => {
						return ImageManager.checkImageValidity(img);
					})
					.map((img) => {
						return ImageManager.getImagePath(img);
					});

				if (links) {
					for (let link of links) {
						if (
							foundURLs.nodes.map((a) => a.URL).indexOf(link.URL) == -1 &&
							findPromoRegex.exec(link.URL) &&
							!ImageManager.checkImageValidity(
								link.URL
							) /*&& (regex.exec(link.URL) || regex2.exec(link.text.replace(/[^a-z0-9+]+/gi, "")))*/
						) {
							foundURLs.addNode(new Site(link.URL, false));
							foundURLs.addEdgeDirected(foundURLs.nodes[pos].URL, link.URL);
						}
					}
				}

				if (images) {
					for (let img of images) {
						if (foundURLs.nodes.map((a) => a.URL).indexOf(img) == -1) {
							foundURLs.addNode(new Site(img, true));
							foundURLs.addEdgeDirected(foundURLs.nodes[pos].URL, img);
							let filePath = path
								.resolve(imgPath + '/' + img.substring(img.lastIndexOf('/') + 1).split('?')[0])
								.toString();
							ImageManager.downloadImage(img.split('?')[0], filePath, () => {
								console.log('Downloaded file at', filePath);
							});
						}
					}
				}
				foundURLs.printGraph();
			}
			await browser.close();
			this.divideImg(imgPath + '/screenshots/')
		})();
	}

	public divideImg(screenPath: string){
		console.log(screenPath);
		let screenshots = fs.readdirSync(screenPath);
		for(let screen of screenshots){
			let currentScreenPath = path.resolve(screenPath + screen);
			Jimp.read(currentScreenPath)
			.then(image => {
				let height = image.getHeight();
				for(let i = 1; i < height / 1000 + 1; i++){
					console.log("resizing to", currentScreenPath.replace(".png", "") + i + ".png");
					let imgCopy = image.clone();
					 
					imgCopy.crop(0, 1000 * (i-1), 1920, this.min(2000, height - 1000 * (i-1)))
						.write(currentScreenPath.replace(".png", "") + i + ".png");
				}
			})
		
			fs.unlinkSync(currentScreenPath);
		}
	}

	private min(a, b){
		return a < b ? a : b;
	}

	public crawlSiteList(siteList: string[]) {
		for (let siteURL of siteList) {
			this.crawlSite(siteURL);
		}
	}

	private createPath(path: string) {
		if (!fs.existsSync(path)) {
			fs.mkdirSync(path, { recursive: true });
		}
	}
}
