import * as fs from 'fs';
import request from 'request';

export class ImageManager {
	static imgRegexValidator: RegExp = new RegExp(
		'^(http://www.|https://www.|http://|https://)?[a-z0-9]+([-.]{1}[a-z0-9]+)*.[a-z]{2,5}(:[0-9]{1,5})?(/.*)?.*(.png|.jpg|.jpeg|.svg|.webp)'
	);

	static checkImageValidity(url: string): boolean {
		return this.imgRegexValidator.exec(url) != null;
	}

	static getImagePath(url: string): string {
		return this.imgRegexValidator.exec(url)[0];
	}

	static downloadImage(url: string, filename: string, callback: (...args: any[]) => void) {
		if (fs.existsSync(filename)) {
			return;
		}
		try {
			request.head(url, (err, res, body) => {
				try {
					request(url).pipe(fs.createWriteStream(filename)).on('close', callback);
				} catch (error) {
					console.log('ERRORE', error);
				}
			});
		} catch (error) {
			console.log("Non è stato possibile scaricare l'immagine all'url", url);
		}
	}
}
