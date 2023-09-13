import express from 'express';
import * as config from './config.js';
import oneImage from './oneImage.js';
import multiImage from './multiImage.js';
import readme from './readme.js';
import status from './status.js';
import bodyParser from 'body-parser';
import multer from 'multer';

const upload = multer({dest : './images'})
const app = express();

app.use(bodyParser.urlencoded({extended : true}))
app.use(bodyParser.json());

app.post('/upload33331111c', upload.single("avatar"), async (req, res)=>
{
    return res.json("upload3333 Successfully!");
});

app.use('/one', oneImage);
app.use('/multi', multiImage);

app.use('/status', status);
app.use('/readme', readme);
app.listen(config.PORT, config.HOST, () => {
    console.log(`Server SHARP Running on http://${config.HOST}:${config.PORT}`);
});



