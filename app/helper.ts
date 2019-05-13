import {Rect} from "./rect";
import * as gimp from "jimp";
import Jimp = require("jimp");

export function rad2deg(radians) {
	var pi = Math.PI;
	return radians * (180 / pi);
}
export function crop(filename, r: Rect): Promise<Jimp> {
	return new Promise<any>((resolve, reject) => {
		gimp.read(filename).then((img) => {
			//img.rotate(-1*rad2deg(angleRad),false);
			img.crop(r.x, r.y, r.w, r.h);
			resolve(img)

		}).catch((err) => {
			reject(err);
		});
	})
}

export function saveImg(img: Jimp,name): Promise<boolean> {
	return new Promise<boolean>((resolve)=>{
		let path = `/home/ldc/WebstormProjects/tsNode/dist/assets/imgs/cropped/${name}.png`;
		img.write(path, () => {
			resolve(true)
		});
	})
}

export function resizeLube(r, multipler): Rect {
	r.h = Math.round(r.h * 2.297);
	r.y = Math.round(r.y - r.h * 0.487 );
	r.w = Math.round(r.w * 1.191);
	r.x = Math.round(r.x - r.w * 0.0825);
	/*let h2 = (r.h*multipler)/2;
	r.y -= h2;
	r.h += h2;
	let w2 = (r.w*multipler)/2;
	r.x -= w2;
	r.w += w2;*/
	return r;
}

export function getBaselinkFrom(link){
	let baselink = link.split('//');
	baselink = baselink[0] + '//' + baselink[1].split('/')[0];
	return baselink
}
