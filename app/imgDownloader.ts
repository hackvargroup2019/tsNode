export function downloadImage(link: string) : Promise<any>{
	let d = require('image-downloader');
	//console.log(link);
	return d.image({
		url: link,
		dest: '/home/ldc/WebstormProjects/tsNode/dist/assets/imgs/source'
	})
}

