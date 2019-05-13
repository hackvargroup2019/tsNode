const CognitiveServicesCredentials = require('ms-rest-azure').CognitiveServicesCredentials;
const WebSearchAPIClient = require('azure-cognitiveservices-websearch');
require('events').EventEmitter.defaultMaxListeners = 10;

process.setMaxListeners(0);

export class BingStoreFinder {
    private credentials
    private webSearchApiClient
    
    constructor() {
        this.credentials = new CognitiveServicesCredentials('4e4ea9e50c28499a992e4f356959107c');
        this.webSearchApiClient = new WebSearchAPIClient(this.credentials);
    }

    public async searchStoreURL(storeName: string): Promise<string>{
        let storeURL: string = "";
        let result = await this.webSearchApiClient.web.search(storeName)
        if (result['webPages']) {
                //console.log(result['webPages'].value);
                //console.log(result['webPages'].value[0]["url"]);
                storeURL = result['webPages'].value[0]["url"];
        } else {
            console.log(`No webPages data`);
            return "Non presente";
        }
        return storeURL;
    }
}