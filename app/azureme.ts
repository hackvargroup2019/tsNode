import * as request from 'request';
import {Rect} from "./rect";

const predictionKey = "e112cf0e4f574708bdd16f17473c9b72";
const predictionResourceId = "007fdfb4-2b89-4ffd-968e-b6b27ec14848";
const subscriptionKey = "beb338b07ddc440cb07ef4a5ef0c9f97";
//const dataRoot = "<path to image files>";
const projectID = "357ad0d9-18f6-4395-b826-ff294828fd12"
const endPoint = "https://westeurope.api.cognitive.microsoft.com/customvision/v3.0/Prediction";
const publishIterationName = "Iteration9";

export class Azureme{

    evaluate(documents,langs: any[],pathNum): Promise<any> {         //
        return new Promise<any>(async (resolve, reject) => {
            let ocrs = [];
            let sendCount = 0;
            langs.forEach((lang) => {
                this.connect(documents, lang,pathNum).then(async (res) => {
                    ocrs.push(JSON.parse(res));
                }).catch((err) => {
                    reject(err);
                }).then(()=>{
                    send();
                })
            })
            function send(){
                sendCount++;
                //console.log(sendCount,langs.length,ocrs)
                if(sendCount === langs.length)
                    resolve(ocrs);

            }
        })
    }

    ocr2(link,path){
        return this.connect(link,'en',path)
    }

    checkHash(link,target){

    }

    connect(documents,lang,pathNum): Promise<any> {
        let https = require('https');
        let accessKey = 'beb338b07ddc440cb07ef4a5ef0c9f97';
        let body = documents;
        let uri = 'northeurope.api.cognitive.microsoft.com';
        let path = [
            '/vision/v2.0/ocr?language='+lang+'&detectOrientation=true',
            '/vision/v2.0/textOperations?handwriting=false',
            '/vision/v1.0/recognizeText?handwriting=false',
            '/vision/v2.0/read/core/asyncBatchAnalyze?mode=Printed',
        ];
        let usedPath = path[pathNum];
        return new Promise<any>((resolve, reject) => {
            let response_handler = function (response) {
                let body = '';
                response.on('data', function (d) {
                    body += d;
                });
                response.on('end', function () {
                    if(pathNum===3){
                        let a = response.headers['operation-location'];
                        //console.log('[',a,']');
                        if(a) {
                            let options = {
                                uri: a,
                                headers: {
                                    'Ocp-Apim-Subscription-Key': accessKey
                                },
                            };
                            let rq = require('request-promise');
                            rq(options).then((res) => {
                                //console.log('response:',JSON.parse(res));
                                resolve(JSON.parse(res))
                            }).catch((err) => {
                                reject(err);
                            })
                        }else{
                            reject('no resource');
                        }
                        //resolve(a);
                    }else {
                        let body_ = JSON.parse(body);
                        let body__ = JSON.stringify(body_, null, '  ');
                        //console.log('body:', body__);
                        resolve(body__);
                    }
                });
                response.on('error', function (e) {
                    console.log('Error: ' + e.message);
                    reject(e.message);
                });
                response.on('*', (d) => {
                    //console.log('other:',d)
                })
            };
            let request_params = {
                method: 'POST',
                hostname: uri,
                path: usedPath,
                headers: {
                    'Ocp-Apim-Subscription-Key': accessKey,
                }
            };
            //console.log(request_params);
            let req = https.request(request_params, response_handler);
            console.log('send',lang, body/*,request_params*/);
            req.write(JSON.stringify({"url": body}));
            req.end();
        })
    }

    homeOcr(file): Promise<any>{
        return new Promise<any>((resolve,reject) => {
            let options = { method: 'POST',
                url: `https://westeurope.api.cognitive.microsoft.com/customvision/v3.0/Prediction/${projectID}/detect/iterations/${publishIterationName}/url`,
                headers:{
                    'cache-control': 'no-cache',
                    'Prediction-Key': predictionKey,
                    'Content-Type': 'application/json'
                },
                form: {
                    Url: file,
                }
            };
            request(options, function (error, response, body) {
                if (error)
                    reject(error);
                resolve(JSON.parse(body));
            });
        })
    }

    sentibility= 0.65;
    parseLuciaOcr(result,target): Rect[]{
        let validImgs: Rect[] = [];
        //console.log(result)
        let res = result.predictions;
        let c = 0;
        if(res) {
            res.forEach((pred) => {
                //console.log(pred);
                if (pred.probability >= this.sentibility) {
                    if (pred.tagName.toLowerCase() === target.toLowerCase()) {
                        let r: any = pred.boundingBox;//.split(',');
                        validImgs.push(r)
                    }
                }
            });
        }
        return validImgs;
    }

    getOcrBoundingBox(res,target): Rect[]{
        let rects: Rect[] = [];
        if(res){
            res.forEach((response)=>{
                //console.log('regions:',response.regions.length);
                response.regions.forEach((region)=>{
                    region.lines.forEach((line)=>{
                        line.words.forEach((word)=>{
                            //console.log(word);
                            if(word.text.toLowerCase().search(target)!== -1) {
                                let boundingBox = word.boundingBox.split(',');
                                let r: Rect = new Rect(
                                    parseInt(boundingBox[0]),
                                    parseInt(boundingBox[1]),
                                    parseInt(boundingBox[2]),
                                    parseInt(boundingBox[3]),
                                )
                                //console.log(r);
                                rects.push(r)
                            }
                        })
                    })
                })
            })
        }
        return(rects)
    }

    getOcr2BoundingBox(res: any, target: string) {
        let rects: Rect[] = [];
        //console.log(res)
        if (res) {
            if(res.status === 'Succeeded'){
                res.recognitionResults.forEach((result)=>{
                    result.lines.forEach((line)=>{
                        if(line.text.toLowerCase().search(target)!==-1){
                            //console.log(line)
                            let bbox = line.boundingBox;
                            console.log(bbox)
                            rects.push(new Rect(bbox[0],bbox[1],bbox[2]-bbox[0],bbox[7]-bbox[1]));
                        }
                    })
                })
            }
            /*
            res.forEach((response) => {
                console.log('regions:', response.regions.length);
                response.regions.forEach((region) => {
                    region.lines.forEach((line) => {
                        line.words.forEach((word) => {
                            console.log(word);
                            if (word.text.toLowerCase().search(target) !== -1) {
                                let boundingBox = word.boundingBox.split(',');
                                let r: Rect = new Rect(
                                    parseInt(boundingBox[0]),
                                    parseInt(boundingBox[1]),
                                    parseInt(boundingBox[2]),
                                    parseInt(boundingBox[3]),
                                )
                                //console.log(r);
                                rects.push(r)
                            }
                        })
                    })
                })
            })*/
        }
        return (rects)
    }

}
