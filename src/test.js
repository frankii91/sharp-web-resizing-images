import express from 'express';
const router = express.Router();
import {AWS_DeleteObject, AWS_DeleteObjects} from "./storage/aws-s3.js";
import {processPromises} from "./tools.js";
import {StorageManagerV} from "./storage/resultStorage.js";
import {ImageProcessingRequest} from "./class.js";
import {checkFeatures, FTPupload} from "./storage/ftp.js";

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
router.get('/', async (req, res)=> {
    let ftp;
    try{
        ftp = await FTPupload('/app/result/images/homeslider/1476/gk-meble.jpg' , './images/homeslider/1476/gk-meble.jpg');
    }
    catch (error){
        console.log('blad')
    }
    res.status(200).json({ error: "OK", message: ftp});



    // let imageProcessing ;
    // const parsedData = JSON.parse(dddd);
    // imageProcessing  = new ImageProcessingRequest(parsedData);
    // const ggg = imageProcessing.toJSON();
    // res.status(200).json({ error: "OK", message: ggg});

    //
    // //await AWS_DeleteObjects();
    //
    // let promises = [];
    // promises.push(testfunction());
    //
    //
    // try {
    //     await processPromises(promises);
    // } catch (err) {
    //     console.error("An error occurred while processing promises in oneImage:", err);
    // }


});



async function testfunction(){
    const ggggg = await new StorageManagerV('stream', null, '/images/homeslider/1476/', 'gk-meble-cc.jpg', null, null).delete();

    return ggggg;
   // throw new Error(JSON.stringify(ggggg));
}
export default router;