import { Crawler } from './crawler';
import express from "express";
import bodyParser from "body-parser";

let app = express();
app.use(bodyParser.urlencoded({ extended: false }));

app.post("/evaluate/", (req, res) => {
    let crawler = new Crawler();
    crawler.crawlSite(req.body.site).then(() => {
        res.send("Richiesta inviata al server, il sito sarà ora processato");
    })
    .catch((err) => res.send(err));
});

app.listen(3000, () => console.log("Listening on port 3000"));
