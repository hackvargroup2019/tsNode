
export class Azureme{

    evaluate(documents,langs: any[]): Promise<any> {         //
        return new Promise<any>(async (resolve, reject) => {
            let ocrs = [];
            let sendCount = 0;
            langs.forEach((lang) => {
                this.connect(documents, lang).then(async (res) => {
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

    connect(documents,lang): Promise<any> {
        let https = require('https');
        let accessKey = '6325726d90174c9984950a2716294df2';
        let body = documents;
        let uri = 'westeurope.api.cognitive.microsoft.com';
        let path = '/vision/v2.0/ocr?language='+lang;
        return new Promise<any>((resolve, reject) => {
            let response_handler = function (response) {
                let body = '';
                response.on('data', function (d) {
                    body += d;
                });
                response.on('end', function () {
                    let body_ = JSON.parse(body);
                    let body__ = JSON.stringify(body_, null, '  ');
                    //console.log ('body:',body__);
                    resolve(body__);
                });
                response.on('error', function (e) {
                    console.log('Error: ' + e.message);
                    reject(e.message);
                });
            };
            let request_params = {
                method: 'POST',
                hostname: uri,
                path: path,
                headers: {
                    'Ocp-Apim-Subscription-Key': accessKey,
                }
            };

            let req = https.request(request_params, response_handler);
            console.log('send', body);
            req.write(JSON.stringify({"url": body}));
            req.end();
        })
    }
}
