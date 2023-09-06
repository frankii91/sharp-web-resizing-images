import express from 'express';
import * as config from './config.js';
import oneImage from './oneImage.js';

import bodyparser from 'body-parser';
import multer from 'multer';

const upload = multer({dest : './images'})
const app = express();

app.use(bodyparser.urlencoded({extended : true}))

app.post('/upload33331111c', upload.single("avatar"), async (req, res)=>
{
    return res.json("upload3333 Successfully!");
});

app.use('/one', oneImage);


app.listen(config.PORT, config.HOST, () => {
    console.log(`Server SHARP Running on http://${config.HOST}:${config.PORT}`);
});



