import express from 'express';

import {
    processPromises, saveMetaTags,
} from "./tools.js";

import {
    ResizeConfig,
    AvifConfig,
    WebpConfig,
    JpgConfig,
    ImageProcessingRequest
} from './class.js';

import {imagePreProcess, debugPreProces} from "./imageProcess.js";


const router = express.Router();

router.get('/', async (req, res)=>
{
    console.debug("/one");
    try {
        const data = req.query;
        const imageProcessing = createImageProcessingRequest(data);

        await debugPreProces(req, imageProcessing);
        const { promises, savedFiles } = await imagePreProcess(imageProcessing, res);
        promises.push(saveMetaTags(imageProcessing));

        try {
            await processPromises(promises, res, imageProcessing.outputStorage);
            // end
        } catch (error) {
            console.error("An error occurred while processing promises in oneImage:", error);
            throw error;
        }
    } catch (error) {
        console.error("Internal Server Error", error);
        if (!res.headersSent) { // jak stream to nagłówki mogły już byc wysłane...
            return res.status(500).json({ error: "Internal Server Error", message: error.message});
        }
    }
});

function createImageProcessingRequest(data) {
    // 1) input
    const loaderTyp = data.loaderTyp ?? 'local';
    const imagePath = data.imagePath;
    const outputStorage = data.outputStorage ?? 'local';

    // 2) resize (w /one obsługujemy max 1 resize)
    const hasResize = data.outputResize != null && String(data.outputResize).trim() !== '';
    const outputResize = hasResize ? [new ResizeConfig(data)] : null;

    // 3) format (w /one wybieramy 1 format)
    const format = (data.outputFormat ?? 'jpg').toLowerCase();

    // 4) config dla formatu
    const outputFormat = {};
    switch (format) {
        case 'avif':
            outputFormat.avif = new AvifConfig(data);
            break;
        case 'webp':
            outputFormat.webp = new WebpConfig(data);
            break;
        case 'jpg':
        default:
            outputFormat.jpg = new JpgConfig(data);
            break;
    }

    // 5) request
    return new ImageProcessingRequest({
        loaderTyp,
        imagePath,
        outputStorage,
        outputResize,
        outputFormat,
    });
}





export default router;