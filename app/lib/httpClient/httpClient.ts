const request = require('request');
export class HttpClient {
	get(link: string): Promise<any>{
		return new Promise((resolve,reject) => {
			request(link, (err, res, data) => {
				if(!err && res.statusCode === 200)
					resolve(data);
				reject([err,res]);
			})
		})
	}
}
