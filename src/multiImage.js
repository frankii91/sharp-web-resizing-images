import express from 'express';

import color from "color";

import {
    processPromises, saveMetaTags

} from "./tools.js";

import {
    ImageProcessingRequest
} from './class.js';

import {imagePreProcess, debugPreProces} from "./imageProcess.js";

const router = express.Router();

const dddd = `{
  "loaderTyp": "url",
  "imagePath": "https://i-meble.eu/images/homeslider/1493-homeslider/wrzesniowa-promocja-mebel-bos-do-20.jpg",
  "outputResize": [{
      "outputResize": "1000x200",
      "fit": "contain",
      "position": "top",
      "background": "rgb(255,255,255)",
      "kernel": "lanczos3",
      "withoutEnlargement": false,
      "withoutReduction": false,
      "fastShrinkOnLoad": true,
      "addName": "1000x200"
  },
  {
      "outputResize": "1500x400",
      "fit": "contain",
      "position": "top",
      "background": "rgb(255,255,255)",
      "kernel": "lanczos3",
      "withoutEnlargement": false,
      "withoutReduction": false,
      "fastShrinkOnLoad": true,
      "addName": "1500x400"
  }],
  "outputFormat": {
    "avif":{
        "quality": 60,
        "lossless": false,
        "effort": 4,
        "chromaSubsampling": "4:4:4"
        },
    "webp": {
        "quality": 65,
        "alphaQuality": 100,
        "lossless": false,
        "nearLossless": false,
        "smartSubsample": false,
        "preset": "default",
        "effort": 4,
        "loop": 0,
        "delay": 100,
        "minSize": false,
        "mixed": false,
        "force": true
    },
    "jpg": {
        "quality": 75,
        "progressive": false,
        "chromaSubsampling": "4:4:4",
        "optimiseCoding": true,
        "mozjpeg": false,
        "trellisQuantisation": false,
        "overshootDeringing": false,
        "optimiseScans": false,
        "quantisationTable": 0,
        "force": true
    }
  },
  "outputStorage": "local"
}`;

router.get('/', async (req, res)=>
{
    console.debug("/multi");
    try {
        let imageProcessing ;
        const parsedData = JSON.parse(dddd);
        imageProcessing  = new ImageProcessingRequest(parsedData);

        await debugPreProces(req, imageProcessing);
        const { promises, savedFiles } = await imagePreProcess(imageProcessing);
        promises.push(saveMetaTags(imageProcessing));

        try {
            await processPromises(promises, res);
            // end
        } catch (error) {
            console.error("An error occurred while processing promises in multiImage:", error);
            throw error;
        }
    } catch (error) {
        console.error("Internal Server Error", error);
        return res.status(500).json({ error: "Internal Server Error", message: error.message});
    }

});





export default router;