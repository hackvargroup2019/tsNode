import {App, detectLogoFrom} from "./app";
const bodyParser = require('body-parser');
const express = require('express');
export class Rest {
	routes = express();

	constructor(app: App) {
		this.routes.use(bodyParser.json());
		this.routes.use(bodyParser.urlencoded({extended: true}));
		this.routes.post('/checklogo/:target',(req,res)=>{
			//console.log(req)
			let link = req.body.url;
			let param = req.params;
			res.status(200);
			detectLogoFrom(link,param.target).then((urls)=> {
				res.send(urls);
			})

		})
	}

	start(){
		this.routes.listen(3000, "0.0.0.0",() => {
			console.log('App listening on port 3000!');
		})
	}
}
