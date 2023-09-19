import express from 'express';

import {
    retryRejectedPromises,
} from "./tools.js";

import {
    ResizeConfig,
    AvifConfig,
    WebpConfig,
    JpgConfig,
    ImageProcessingRequest
} from './class.js';

import {imagePreProcess, debugPreProces} from "./imageProcess.js";
import {promises as fs} from "fs";

const router = express.Router();

router.get('/', async (req, res)=>
{
    console.debug("/one");
    try {
        const data = req.query;
        const imageProcessing = createImageProcessingRequest(data);

        await debugPreProces(req, imageProcessing);
        const { promises, savedFiles } = await imagePreProcess(imageProcessing, res);

        await retryRejectedPromises(promises)
            .then(results => {
                console.debug("Wszystkie obietnice zostały spełnione! w /one");
                if(imageProcessing.outputStorage !== "stream"){
                    return res.status(200).json({ error: null, message: "OK" });
                }
            })
            .catch(err => {
                console.error("Nie udało się spełnić wszystkich obietnic nawet po wielokrotnych próbach", err);
                // Usuń wszystkie zapisane pliki
                for (const filePath of savedFiles) {
                    fs.unlink(filePath)
                        .then(() => console.log(`Plik ${filePath} został usunięty.`))
                        .catch(error => console.error(`Nie można usunąć pliku ${filePath}. Błąd: ${error.message}`));
                }
                return res.status(500).json({ error: "Internal Server Error", message: err.message });
            });
    } catch (error) {
        console.error("Internal Server Error", error);
        return res.status(500).json({ error: "Internal Server Error", message: error.message});
    }
});


function createImageProcessingRequest(data) {
    const loaderTyp = data.loaderTyp || 'local';
    const imagePath = data.imagePath;
    const outputStorage = data.outputStorage || 'local';

    // Twórz obiekt ResizeConfig tylko, jeśli dostępne są odpowiednie parametry

    const outputResize = data.outputResize ? [new ResizeConfig(data)] : null;

    // Twórz obiekt AvifConfig tylko, jeśli dostępne są odpowiednie parametry
    // const avifConfig = data.outputFormat?.avif ? new AvifConfig(data.outputFormat.avif) : null;
    // const avifConfig = data.outputFormat === 'avif' ? new AvifConfig() : null;
    const avifConfig = data.outputFormat === 'avif' ? new AvifConfig(data) : null;

    // Twórz obiekt WebpConfig tylko, jeśli dostępne są odpowiednie parametry
    const webpConfig = data.outputFormat  === 'webp' ? new WebpConfig(data) : null;

    // Twórz obiekt JpgConfig tylko, jeśli dostępne są odpowiednie parametry
    const jpgConfig = data.outputFormat  === 'jpg' ? new JpgConfig(data) : null;

    // Tworzenie obiektu `outputFormat` tylko z istniejącymi konfiguracjami
    let outputFormat = {};
    if (avifConfig) {
        outputFormat.avif = avifConfig;
    } else if (webpConfig) {
        outputFormat.webp = webpConfig;
    } else if (jpgConfig) {
        outputFormat.jpg = jpgConfig;
    } else {
        // Jeśli nie ma żadnych konfiguracji, użyj domyślnie konfiguracji `jpg`
        outputFormat.jpg = new JpgConfig({});
    }

    // Tworzenie obiektu `ImageProcessingRequest`
    const imageProcessingRequestData = {
        loaderTyp,
        imagePath,
        outputStorage,
        outputResize,
        outputFormat,
    };

    const imageProcessingRequest = new ImageProcessingRequest(imageProcessingRequestData);

    return imageProcessingRequest;
}




export default router;