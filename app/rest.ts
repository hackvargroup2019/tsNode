import {App, checkContex, checkOtherLogo, checkSite, compareHash, detectLogoFrom, callLuis} from "./app";
import {Crawler} from "./crawler/crawler";
const bodyParser = require('body-parser');
const express = require('express');
export class Rest {
	routes = express();

	constructor(app: App) {
		this.routes.use(bodyParser.json());
		this.routes.use(bodyParser.urlencoded({extended: true}));

		/**
		 * controlla se nell'immagine (di fianco al logo principale) è presente un logo o no
		 */
		this.routes.post('/checkotherlogo',(req,res)=>{
			//console.log(req)
			let link = req.body.url;
			let param = req.params;
			res.status(200);
			checkOtherLogo(link).then((urls)=> {
				res.send(urls);
			})
		})

		/**
		 * controlla se l'immagine è una foto in ambiente naturale o artificio
		 */
		this.routes.post('/checklogocontext/',(req,res)=>{
			//console.log(req)
			let link = req.body.url;
			let param = req.params;
			res.status(200);
			checkContex(link).then((urls)=> {
				res.send(urls);
			})
		})

		/**
		 * controlla se è presente nel sito definito in url un logo (:target)
		 */
		this.routes.post('/checklogo/:target',(req,res)=>{
			//console.log(req)
			let link = req.body.url;
			let param = req.params;
			res.status(200);
			detectLogoFrom(link,param.target).then((urls)=> {
				res.send(urls);
			})
		})

		/**
		 * visualizza il risultato di un sito
		 */
		this.routes.post('/checkSite/:target',(req,res)=>{
			//console.log(req)
			let link = req.body.url;
			let param = req.params;
			checkSite(link,param.target).then((urls)=> {
				res.status(200);
				res.send(urls);
			}).catch((err)=>{
				res.status(500);
				res.send('sito non presente nel database'+err);
			})
		})



		/**
		 * controlla tutti i link del sito definito in url e li salva in un json
		 * inoltre scatta uno screenshot dei siti visitati e li salva in una cartella <baselink>/screenshot
		 * TODO esportare i risultati in un database
		 */
		this.routes.post("/evaluate", (req, res) => {
			let crawler = new Crawler();
			crawler.crawlSite(req.body.url).then(() => {
				res.send("Richiesta inviata al server, il sito sarà ora processato");
			})
				.catch((err) => res.send(err));
		});

		/**
		 * controlla il testo contenuto nell'immagine definita in url
		 */
		this.routes.post("/luis", (req, res) => {
			let query = req.body.q;
			callLuis(query).then(out => {
				res.send({
					result: out['topScoringIntent']['intent']
				});
			})
		});

		/**
		 * controlla la bontà del logo
		 */
		this.routes.post("/affinity/:target", (req, res) => {
			let link = req.body.url.split(',');
			let param = req.params;
			console.log(link,param);
			compareHash(link,param.target).then((response)=>{
				res.status(200);
				res.send(response);
				console.log(response);
			}).catch((err)=>{
				res.status(500);
				res.send(err);
				console.log(err);
			})
		});
	}

	start(){
		this.routes.listen(3000, "0.0.0.0",() => {
			console.log('App listening on port 3000!');
		})
	}
}
