import express from 'express';
const router = express.Router();
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const parentDir = path.join(__dirname, '..');
const filePath = path.join(parentDir, 'README-HOWTO.MD');


import showdown from 'showdown';
const { Converter } = showdown;
const converter = new Converter();

router.get('/', async (req, res)=>
{
    console.log("/readme");
    try {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                return res.status(500).send('Error reading file: ' + filePath  + " : " +  err.message);
            }
            const htmlContent = converter.makeHtml(data);
            res.setHeader('Content-Type', 'text/html');
            res.send(htmlContent);
        });

    } catch (error) {
        console.error("Internal Server Error", error);
        return res.status(500).json({ error: "Internal Server Error", message: error.message});
    }

});

export default router;