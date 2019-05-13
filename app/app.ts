import {Azureme} from "./azureme";
import {Rect} from "./rect";
import {links} from "./links";
import {crop, resizeLube, saveImg} from "./helper";
import Jimp = require("jimp");
import {downloadImage} from "./imgDownloader";
import {Rest} from "./rest";
import * as fs from'fs';
require('events').EventEmitter.defaultMaxListeners = 5;

const PATH = 'dist/assets/imgs/';
export class App {
	azure = new Azureme();

	constructor() {
		console.log('app creata');
	}

	startSearch(link: string, target: string): Promise<Rect[]> {
		return new Promise<Rect[]>((resolve)=>{
			this.azure.homeOcr(link).then((res)=>{
				resolve(this.azure.parseLuciaOcr(res,target));
			});
		})
	}
	links = [];
	page = 0;
	private baselink: any;

	getCroppedFile(filename) {
		return `/home/ldc/WebstormProjects/tsNode/dist/assets/imgs/cropped/${filename}.png`;
	}

	startRefine(link: string,pathNum: number): Promise<any>{
		if(pathNum === 3){
			return new Promise<any>((resolve,reject)=>{
				this.azure.ocr2(link,pathNum).then((res)=>{
					//console.log('result ocr2',res);
					resolve(res);
				}).catch((err)=>{
					console.log(err);
					reject(err);
				})
			})

		}else{
			return this.azure.evaluate(link,['en'],pathNum);
		}
	}
}





let app = new App();
let rest = new Rest(app);
rest.start();
let link = links[13]; //si 0	1 4		no 12 2 5 6 7
let pathNum = 3;
let c =0;
let target = 'lube';
let imgWidth= 0;
let imgHeigth= 0;

let rects: Rect[] = [];
let imageSaved = 0;
let gimp = require('jimp');

/**
 * controlla se nell'immagine (di fianco al logo principale) è presente un logo o no
 */
export function checkOtherLogo(link): Promise<string[]>{
	return new Promise<string[]>((resolve,reject)=>{
		gimp.read(link).then((img)=>{
			img.resize(30,30);
			trySaveAllToBlobs(img,'oth',tryResolve)
			function tryResolve(blobUrls){
				console.log(c,rects.length);
				if(imageSaved === rects.length)
					resolve(blobUrls);
			}
		})
		app.azure.connectLogoFrame(link).then((res)=>{
			console.log(res)
			resolve(res);
		})
	})
}

/**
 * controlla se l'immagine è una foto in ambiente naturale o artificio
 */
export function checkContex(link): Promise<string[]>{
	return new Promise<string[]>((resolve,reject)=>{
		app.azure.connectPhotoLogo(link).then((res)=>{
			gimp.read(link).then((img)=>{
				//img.resize(30,30);
				trySaveAllToBlobs(img,'context',tryResolve)
				function tryResolve(blobUrls){
					console.log(c,rects.length);
					if(imageSaved === rects.length)
						resolve(blobUrls);
				}
			})
		})
	})
}

export function saveToBlob(path): Promise<string[]>{
	console.log('path',path)
	return new Promise<string[]>((resolve,reject)=> {
		fs.readdir(path, (err, files) => {
			files.forEach(file => {
				gimp.read(path+file).then((img) => {
					//img.resize(30,30);
					trySaveAllToBlobs(img, file, tryResolve)

					function tryResolve(blobUrls) {
						//console.log(c, rects.length);
						if (imageSaved === rects.length)
							resolve(blobUrls);
					}
				})
			});
		});
	});
}


export function checkSite(link,target): Promise<string[]>{
	let basename = link.replace(/(http(s)?:\/\/|www\.|\.(com|it)\/|\/)/g, '');
	let path = './extractedimgs/'+basename+'/screenshots';
	console.log('path',path)
	return new Promise<string[]>((resolve,reject)=> {
		fs.readdir(path, (err, files) => {
			if(err) reject(err);
			else {
				let blobs = [];
				files.forEach((file) => {
					blobs.push('https://azuremenow9e12.blob.core.windows.net/croppedimgs/' + file);
					if (blobs.length === files.length){
						let results = [];
						blobs.forEach(blob => {
							detectLogoFrom(blob,target).then((res)=>{
								results.push(res);
								trySendRes()
							}).catch((err)=>{
								results.push(null);
								trySendRes()
							})
						})

						function trySendRes(){
							if(results.length === blobs.length)
								resolve(results);
						}

					}
				})
			}
		});
	});
}

/**
 * controlla se nell'immagine (di fianco al logo principale) è presente un logo o no

export function checkOtherLogo(link): Promise<string[]>{
	return new Promise<string[]>((resolve,reject)=>{
		//resolve()
	})
} */

export function detectLogoFrom(link,target): Promise<string[]>{
	return new Promise<string[]>((resolve,reject) => {
		let imgOriginal = null;
		gimp.read(link).then((img: Jimp) => {
			imgWidth = img.getWidth();
			imgHeigth = img.getHeight();
			imgOriginal = img;
			//console.log(imgWidth, imgHeigth)
			app.startSearch(link, target).then((result) => {
				//TODO recupero i bounding box dei loghi rilevati
				console.log("a lucia:", link);
				rects = result;
			}).catch((err) => {
				//TODO gestione errore su search
				console.log(err)
			}).then(() => {
				//TODO Converto BoundingBox da percentuale a intero
				let exRect: Rect[] = rects;
				rects = [];
				exRect.forEach((res) => {
					let r = new Rect(
						res['left'] * imgWidth,
						res['top'] * imgHeigth,
						res['width'] * imgWidth,
						res['height'] * imgHeigth
					);
					console.log('LUCIA:', r);
					rects.push(r);
				});
				console.log('Converto BoundingBox da percentuale a intero');
			}).then(() => {
				//TODO cropping immagine originale con ogni bounding box e salvataggio in locale
				let c = 0;
				imageSaved = 0;
				let imgs = [];
				if(rects.length===0){
					reject('no box');
				}else {
					rects.forEach((r) => {
						gimp.read(link).then((img: Jimp) => {
							let name = 'temp' + (c++);
							img.crop(r.x, r.y, r.w, r.h, () => {
								//
								console.log('Immagine salvata', name)
								imageSaved++;
								trySaveAllToBlobs(img, name, tryResolve)
								//});
							});
						});
					});
				}
				function tryResolve(blobUrls){
					console.log(c,rects.length);
					if(imageSaved === rects.length)
						resolve(blobUrls);
				}
				console.log('cropping immagine originale con ogni bounding box e salvataggio in locale');
			})
		});
	});
}

function trySaveAllToBlobs(img: Jimp,name: string,tryResolve){
	//if(imageSaved === rects.length) {
	//TODO salvataggio blob su azure
	let storage = require('azure-storage');
	let connString = 'DefaultEndpointsProtocol=https;AccountName=azuremenow9e12;AccountKey=mn0Y/RXFhRgZlVx0dbACfdqVFAQJrPswdWq9U3yQdaa9b7+u7Oe0Lo6lkkoCpc5d/S0k7OXevaGlqwv/QrkMuA==;EndpointSuffix=core.windows.net'
	let blobService = storage.createBlobService(connString);
	let blobUrls: string[] = [];
	//rects.forEach((r) => {
	//let filepath = app.getCroppedFile(name);
	saveImg(img, name).then((path) => {
		//img.getBuffer(img.getMIME(), (buffer) => {
		blobService.createBlockBlobFromLocalFile('croppedimgs', name, path, (err) => {
			if (err) console.log('res:', err);
			let url = 'https://azuremenow9e12.blob.core.windows.net/croppedimgs/' + name;
			blobUrls.push(url);
			console.log(`uri${c}`, url);
			tryResolve(blobUrls);
		});

		//})
	});
	//});
	//compareHash(blobUrls);


}

function compareHash(blobUrls: string[]){
	//TODO chiamata allo script Python PixelBinning
	app.azure.checkHash(blobUrls,target);

}

function getPageTextOcr(link){
	app.azure.connectCustomVision(link,'it',3).then((res)=>{
		console.log(res);
	});
}
/*
app.
		//console.log(w,h);
/*
					paths.forEach((filename)=>{
						let filepath = app.getCroppedFile(filename);
						//console.log('salvo in blob da',filepath);
						blobService.createBlockBlobFromLocalFile('croppedimgs',filename,filepath,(err)=>{
							if(err) console.log('res:',err);
							let url = 'https://azuremenow9e12.blob.core.windows.net/croppedimgs/'+ filename;
							console.log(`uri${c++}`,url);
							/*
							app.startRefine(url,pathNum).then((res)=>{
								//console.log('refinded',res);
								let rects: Rect[] = [];
								if(pathNum === 3){
									rects = app.azure.getOcr2BoundingBox(res,target);
								}else{
									rects = app.azure.getOcrBoundingBox(res,target);
								}
								//console.log('bbox:',res);
								let imgCount = 0;
								rects.forEach((rect)=>{
									let nr = r;
									nr.x += rect.x
									nr.y += rect.y
									console.log('OCR',rect,nr)
									nr = resizeLube(nr,1);
									crop(link,nr).then((img:Jimp)=>{
										saveImg(img,'ocr_'+filename).then((res)=>{
											if(res){
												console.log('File salvato')
											}else {
												console.log('errore');
											}
										})
									});
								})
							})
						})
					})
				})
			})
		})
	})
*/


	/*
	let lubeFounded = false;

	ImgDownloader.download(link).then(({filename, image}) => {
		let originWidth, originHeight;
		let sizeOf = require('image-size');
		let dimensions = sizeOf(filename);
		originWidth = dimensions.width;
		originHeight = dimensions.height;
		console.log('File saved to', filename);
	}).catch((err) => {
		console.log(err)
	});

	 */

/*
//console.log(r);
r = new Rect(r['left'] * originWidth, r['top'] * originHeight, r['width'] * originWidth, r['height'] * originHeight);
r = app.resizeLube(r,1);
//console.log(r);
app.crop(filename, r, c++).then((img)=>{
	console.log("background:",img._background)

});
lubeFounded = true;
if (!lubeFounded) {
	console.log('no', target);
}
)
.catch((err) => {
	console.log(err)
})




//let http = require('http');
*/
