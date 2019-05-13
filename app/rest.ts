import {App, detectLogoFrom} from "./app";

const express = require('express');
export class Rest {
	routes = express();

	constructor(app: App) {
		this.routes.post('/checklogo/:target',(req,res)=>{
			console.log(req.body)
			let link = req.body.url;
			let param = req.params;
			res.status(200);
			res.send(detectLogoFrom(link,param.target));
		})
	}

	start(){
		this.routes.listen(3000, "0.0.0.0",() => {
			console.log('App listening on port 3000!');
		})
	}
}
