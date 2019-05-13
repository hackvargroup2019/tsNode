const puppeteer = require('puppeteer');
import { BingStoreFinder } from './bingstorefinder';
import * as fs from "fs";

interface Store {
    name: string,
    url: string,
    type: string
}

export class StoreFinder{

    static baseURL: string = "https://www.cucinelube.it/it/punti-vendita/per-provincia/"
    storesToSearch: Store[]
    foundStores: Store[]
    linkProvince: string[]
    bingSearch: BingStoreFinder

    constructor(){
        this.storesToSearch = [];
        this.foundStores = [];
        this.linkProvince = [];
        this.bingSearch = new BingStoreFinder();
    }

    private async initBrowser(){
        const args = [ '--disable-setuid-sandbox', '--no-sandbox' ];
		const options = {
			args,
			headless: true,
			ignoreHTTPSErrors: true
        };

        return await puppeteer.launch(options);
    }

    public async findLinks(){
        let browser = await this.initBrowser();
        let page = await browser.newPage();
        await page.goto(StoreFinder.baseURL, {
            waitUntil: [ 'load', 'networkidle2' ],
            timeout: 60000
        });
        this.linkProvince = await page.$$eval('#aree section.container .col-md-2 ul li a', (as) =>
			as.map((a) => a.href)
        );
        for(let link of this.linkProvince){
            console.log(link);
        }
        for(let link of this.linkProvince){
            console.log("current link:", link);
            
            this.foundStores = [];
            this.storesToSearch = [];
            let page = await browser.newPage();
            try{
                await page.goto(link, {
                    waitUntil: 'networkidle0',
                    timeout: 60000
                });
            } catch(err) {
                console.log("Error:", err);
                continue;
            }
            let objects = await page.evaluate(() => {
                let getStoreType = (colnum: number): string => {
                    switch(colnum){
                        case 1:
                            return "Lube Store";
                        case 2:
                            return "Monomarca";
                        case 3:
                            return "Multimarca";
                        default:
                            throw new Error("Tipo di negozio non riconosciuto");
                    }
                }
                
                let getStoreName = (completeName: string): string => {
                    return completeName.substr(0, completeName.indexOf(")") + 1);
                }

                let links = [];
                let storesToSearch = [];
                for(let i = 1; i < 4; i++){
                    let stores = document.querySelectorAll("div.col-sm-4.text-center.tab" + i +" p");
                    stores.forEach((store)=> {
                        try {
                            $(store).click();
                            let storeDesc = document.querySelector("div.gm-style-iw div div div");
                            let possibleLink = document.querySelector("div.gm-style-iw div div div a");
                            if(possibleLink && !possibleLink.textContent.localeCompare("Sito Web del Negozio")){
                                links.push({
                                    name: getStoreName(storeDesc.textContent),
                                    url: possibleLink.getAttribute("href"),
                                    type: getStoreType(i)
                                });
                            } else {
                                storesToSearch.push({
                                    name: getStoreName(storeDesc.textContent),
                                    url: "",
                                    type: getStoreType(i)
                                });
                            }
                        } catch(error) {
                            console.log("Error:", error);
                        }
                    });
                }
                return { "foundLinks": links, "storesToSearch": storesToSearch}
            });
            this.foundStores = this.foundStores.concat(objects["foundLinks"]);
            this.storesToSearch = this.storesToSearch.concat(objects["storesToSearch"]);

            for(let element of this.storesToSearch){
                element.url = await this.bingSearch.searchStoreURL(element.name);
                this.foundStores.push(element);
            }
            this.saveToJSON(this.foundStores);
        }
        await browser.close();
    }

    private initJSON(){
        fs.writeFileSync('stores.json', "[]");
    }

    private saveToJSON(stores: Store[]){
        let json = JSON.parse(fs.readFileSync('stores.json').toString());
        for(let store of stores){
            json.push(store);
        }
        fs.writeFileSync('stores.json', JSON.stringify(json));
    }

    public async findMissingStores(){
        let bingSearch = new BingStoreFinder();
        for(let element of this.storesToSearch){
            let storeURL = await bingSearch.searchStoreURL(element.name);
            element.url = storeURL;
            this.foundStores.push(element);
        }
    }
}
