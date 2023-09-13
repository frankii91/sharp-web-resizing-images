import express from 'express';

import sharp from "sharp";
import color from "color";
import {
    createDirectory,
    sanitizePath,
    cutPath,
    pathNormalize,
    loader,
    isValidResize,
    parseBool,
    validateBool
} from "./tools.js";

import {
    __dirImagesLocal,
    __dirImagesMount,
    __dirImagesResultLocal,
    __dirImagesResultMount
} from './directories.js';



class ResizeConfig {
    constructor(data) {
        this.outputResize = data.outputResize;
        this.fit = data.fit || 'contain';
        this.position = data.position || 'center';
        this.background = data.background || 'rgb(255,255,255)';
        this.kernel = data.kernel || 'lanczos3';
        this.withoutEnlargement = data.withoutEnlargement || false;
        this.withoutReduction = data.withoutReduction || false;
        this.fastShrinkOnLoad = data.fastShrinkOnLoad || true;
        this.validateData();

    }
    validateAndSetDimensions(outputResize) {
        if (! this.outputResize) throw new Error("Invalid resize format. Should be [int]x[int] e.g. 100x100");
        this.dimensions = this.isValidResize(outputResize);
        if (! this.dimensions) throw new Error("Invalid resize format. Should be [int]x[int] e.g. 100x100");
        this.width =  this.dimensions.width;
        this.height =  this.dimensions.height;
    }
    isValidResize(value) {

        const index = value.indexOf('x');
        if (index === -1) return false;
        const width = parseInt(value.slice(0, index), 10);
        const height = parseInt(value.slice(index + 1), 10);

        if (isNaN(width) || isNaN(height)) return false;

        return { width, height };
    }
    validateFit(fit){
        const allowedFits = {
            cover: true,
            contain: true,
            fill: true,
            inside: true,
            outside: true
        };
        if (!allowedFits.hasOwnProperty(fit)) throw new Error('Invalid "resize.fit" parameter');
    }
    validatePosition(position){
        const allowedPositions = {
            'top': true,
            'right top': true,
            'right': true,
            'right bottom': true,
            'bottom': true,
            'left bottom': true,
            'left': true,
            'left top': true,
            'center': true
        };
        if (!allowedPositions.hasOwnProperty(position)) throw new Error('Invalid "resize.position" parameter');
    }
    validateBackground(background){
        if (!/^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/.test(background)) throw new Error('Invalid "resize.background" parameter');
    }
    validateKernel(kernel){
        const allowedKernels = {
            'nearest': true,
            'cubic': true,
            'mitchell': true,
            'lanczos2': true,
            'lanczos3': true
        };
        if (!allowedKernels.hasOwnProperty(kernel)) throw new Error('Invalid "resize.kernel" parameter');
    }
    validateData() {
        //if (!IS_DEVELOPMENT_MODE) return;
        this.validateAndSetDimensions(this.outputResize);
        this.validateFit(this.fit);
        this.validatePosition(this.position);
        this.validateBackground(this.background);
        this.validateKernel(this.kernel);
        this.withoutEnlargement = validateBool(this.withoutEnlargement, "resize.withoutEnlargement");
        this.withoutReduction = validateBool(this.withoutReduction, "resize.withoutReduction");
        this.fastShrinkOnLoad = validateBool(this.fastShrinkOnLoad, "resize.fastShrinkOnLoad");
    }

    getSharpConfig() {
        return {
            fit: this.fit,
            position: this.position,
            background: this.background,
            kernel: this.kernel,
            withoutEnlargement: this.withoutEnlargement,
            withoutReduction: this.withoutReduction,
            fastShrinkOnLoad: this.fastShrinkOnLoad
        };
    }
}

class AvifConfig {
    constructor(data) {
        this.quality = data.quality || 50;
        this.lossless = data.lossless || false;
        this.effort = data.effort || 4;
        this.chromaSubsampling = data.chromaSubsampling || '4:4:4';
        this.validateData();
    }
    validateQuality(quality){
        quality = parseInt(quality, 10);
        if (isNaN(quality) || +quality < 1 || +quality > 100) throw new Error(`Invalid "avif.quality" parameter. Should be an integer between 1 and 100.`);
    }
    validateEffort(effort) {
        effort = parseInt(effort, 10);
        if (isNaN(effort) || effort < 0 || effort > 9) throw new Error(`Invalid "avif.effort" parameter. Should be an integer between 0 and 9.`);
    }
    validateChromaSubsampling(chromaSubsampling){
        if (!/^(\d+):(\d+):(\d+)$/.test(chromaSubsampling)) throw new Error(`Invalid "avif.chromaSubsampling" parameter. Should be e '4:4:4' set to '4:2:0' to use chroma subsampling`);
    }
    validateData(){
        this.validateQuality(this.quality);
        this.lossless = validateBool(this.lossless, "avif.lossless");
        this.validateEffort(this.effort);
        this.validateChromaSubsampling(this.chromaSubsampling);

    }
    getSharpConfig() {
        return {
            quality: this.quality,
            lossless: this.lossless,
            effort: this.effort,
            chromaSubsampling: this.chromaSubsampling
        };
    }
}

class WebpConfig {
    constructor(data) {
        this.quality = data.quality || 80;
        this.alphaQuality = data.alphaQuality || 100;
        this.lossless = data.lossless || false;
        this.nearLossless = data.nearLossless || false;
        this.smartSubsample = data.smartSubsample || false;
        this.preset = data.preset || 'default';
        this.effort = data.effort || 4;
        this.loop = data.loop || 0;
        this.delay = data.delay || 100;
        this.minSize = data.minSize || false;
        this.mixed = data.mixed || false;
        this.force = data.force || true;
        this.validateData();
    }

    validateQuality(quality){
        quality = parseInt(quality, 10);
        if (isNaN(quality) || +quality < 1 || +quality > 100) throw new Error(`Invalid "webp.quality" parameter. Should be an integer between 1 and 100.`);
    }
    validateAlphaQuality(alphaQuality){
        alphaQuality = parseInt(alphaQuality, 10);
        if (isNaN(alphaQuality) || +alphaQuality < 0 || +alphaQuality > 100) throw new Error(`Invalid "webp.alphaQuality" parameter. Should be an integer between 0 and 100.`);
    }
    validatePreset(preset){
        if (!["default", "photo", "picture", "drawing", "icon", "text"].includes(preset)) throw new Error(`Invalid "webp.preset" parameter. Allowed presets are default, photo, picture, drawing, icon, text.`);
    }
    validateEffort(effort){
        effort = parseInt(effort, 10);
        if (isNaN(effort) || +effort < 0 || +effort > 6) throw new Error(`Invalid "webp.effort" parameter. Should be an integer between 0 and 6.`);
    }
    validateLoop(loop){
        loop = parseInt(loop, 10);
        if (isNaN(loop) || +loop < 0 || +loop > 1000) throw new Error(`Invalid "webp.loop" parameter. Should be number of animation iterations, use 0 for infinite = 1000 animation`);
    }
    validateDelay(delay){
        delay = parseInt(delay, 10);
        if (isNaN(delay) || +delay < 1 || +delay > 10000) throw new Error(`Invalid "webp.delay" parameter. Should be delay(s) between animation frames (in milliseconds)`);
    }
    validateData(){
        this.validateQuality(this.quality);
        this.validateAlphaQuality(this.alphaQuality);
        this.lossless = validateBool(this.lossless, "webp.lossless");
        this.nearLossless = validateBool(this.nearLossless, "webp.nearLossless");
        this.smartSubsample = validateBool(this.smartSubsample, "webp.smartSubsample");
        this.validatePreset(this.preset);
        this.validateEffort(this.effort);
        this.validateLoop(this.loop);
        this.validateDelay(this.delay);
        this.minSize = validateBool(this.minSize, "webp.minSize");
        this.mixed = validateBool(this.mixed, "webp.mixed");
        this.force = validateBool(this.force, "webp.force");validateBool
    }
    getSharpConfig() {
        return {
            quality : this.quality,
            alphaQuality : this.alphaQuality,
            lossless : this.lossless,
            nearLossless : this.nearLossless,
            smartSubsample : this.smartSubsample,
            preset : this.preset,
            effort : this.effort,
            loop : this.loop,
            delay : this.delay,
            minSize : this.minSize,
            mixed : this.mixed,
            force : this.force
        };
    }
}

class JpgConfig {
    constructor(data) {
        this.quality = data.quality || 80;
        this.progressive = data.progressive || false;
        this.chromaSubsampling = data.chromaSubsampling || '4:2:0';
        this.optimiseCoding = data.optimiseCoding || true;
        this.mozjpeg = data.mozjpeg || false;
        this.trellisQuantisation = data.trellisQuantisation || false;
        this.overshootDeringing = data.overshootDeringing || false;
        this.optimiseScans = data.optimiseScans || false;
        this.quantisationTable = data.quantisationTable || 0;
        this.force = data.force || true;
        this.validateData();
    }

    validateQuality(quality){
        quality = parseInt(quality, 10);
        if (isNaN(quality) || +quality < 1 || +quality > 100) throw new Error(`Invalid "jpg.quality" parameter. Should be an integer between 1 and 100.`);
    }
    validateChromaSubsampling(chromaSubsampling){
        if (!/^(\d+):(\d+):(\d+)$/.test(chromaSubsampling)) throw new Error(`Invalid "jpg.chromaSubsampling" parameter. set to '4:4:4' to prevent chroma subsampling otherwise defaults to '4:2:0' chroma subsampling`);
    }
    validateQuantisationTable(quantisationTable){
        quantisationTable = parseInt(quantisationTable, 10);
        if (isNaN(quantisationTable)|| +quantisationTable < 0 || +quantisationTable > 8)  throw new Error(`Invalid "jpg.quantisationTable" parameter. Should be an integer between 1 and 100.`);
    }
    validateData(){
        this.validateQuality(this.quality);
        this.progressive = validateBool(this.progressive, "jpg.progressive");
        this.validateChromaSubsampling(this.chromaSubsampling);
        this.optimiseCoding = validateBool(this.optimiseCoding, "jpg.optimiseCoding");
        this.mozjpeg = validateBool(this.mozjpeg, "jpg.mozjpeg");
        this.trellisQuantisation = validateBool(this.trellisQuantisation, "jpg.trellisQuantisation");
        this.overshootDeringing = validateBool(this.overshootDeringing, "jpg.overshootDeringing");
        this.optimiseScans = validateBool(this.optimiseScans, "jpg.optimiseScans");
        this.validateQuantisationTable(this.quantisationTable);
        this.force = validateBool(this.force, "jpg.force");
    }
    getSharpConfig() {
        return {
            quality : this.quality,
            progressive : this.progressive,
            chromaSubsampling : this.chromaSubsampling,
            optimiseCoding : this.optimiseCoding,
            mozjpeg : this.mozjpeg,
            trellisQuantisation : this.trellisQuantisation,
            overshootDeringing : this.overshootDeringing,
            optimiseScans : this.optimiseScans,
            quantisationTable : this.quantisationTable,
            orce : this.force,
        };
    }
}

class ImageProcessingRequest {
    constructor(data) {
        this.loaderTyp = data.loaderTyp || 'local';
        this.imagePath = data.imagePath;
        this.resultTyp = data.resultTyp || 'local';

        this.validateData();

        // this.outputResize = Array.isArray(data.outputResize) ? data.outputResize.map(resizeData => new ResizeConfig(resizeData)) : [];

        // if (typeof data.outputResize === 'object' && data.outputResize !== null) {
        //     this.outputResize = new ResizeConfig(data.outputResize);
        // } else if (data.outputResize === null) {
        //     this.outputResize = data.outputResize;
        // } else {
        //     throw new Error("Invalid data for outputResize");
        // }
        if (Array.isArray(data.outputResize)) {
            this.outputResize = data.outputResize.map(item => new ResizeConfig(item));
        } else if (data.outputResize === null) {
            this.outputResize = data.outputResize;
        } else {
            throw new Error("Invalid data for outputResize");
        }

        this.outputFormat = {};
        const allowedFormats = ['avif', 'webp', 'jpg'];
        if (data.outputFormat) {
            allowedFormats.forEach(format => {
                if (data.outputFormat.hasOwnProperty(format)) {
                    const formatData = data.outputFormat[format];

                    if (formatData === null) {
                        this.outputFormat[format] = new (this.getFormatClass(format))({});
                    } else if (typeof formatData === 'object' && !Array.isArray(formatData)) {
                        try {
                            this.outputFormat[format] = new (this.getFormatClass(format))(formatData);
                        } catch (error) {
                            throw new Error(`Error initializing ${format}: ${error.message}`);
                        }
                    } else {
                        throw new Error(`Invalid data for ${format}`);
                    }
                }
            });
        }


    }
    getFormatClass(format) {
        switch (format) {
            case 'avif':
                return AvifConfig;
            case 'webp':
                return WebpConfig;
            case 'jpg':
                return JpgConfig;
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }

    validateLoaderAndPath(loaderTyp, imagePath) {
        if (!imagePath) throw new Error('Invalid "imagePath" parameter');

        switch (loaderTyp) {
            case 'local':
            case 'mount':
                let localFilePath;
                if (loaderTyp === 'local') {
                    localFilePath = __dirImagesLocal + "/" + sanitizePath(__dirImagesLocal, imagePath);
                } else {
                    localFilePath = __dirImagesLocal + "/" + sanitizePath(__dirImagesMount, imagePath);
                }
                if (!fs.existsSync(localFilePath)) {
                    throw new Error(`File does not exist: ${localFilePath}`);
                }
                break;
            case 'url':
                try {
                    new URL(imagePath);
                } catch (error) {
                    throw new Error(`Invalid URL: ${imagePath}`);
                }
                break;
        }
    }
    validateLoaderTyp(loaderTyp){
        const allowedLoaderTyp = {
            'local': true,
            'mount': true,
            'url': true
        };
        if (!allowedLoaderTyp.hasOwnProperty(loaderTyp)) throw new Error('Invalid "loaderTyp" parameter');
    }

    validateResultTyp(resultTyp){
    const allowedResultTyp = {
        'local': true,
        'mount': true,
        'stream': true
    };
    if (!allowedResultTyp.hasOwnProperty(resultTyp)) throw new Error('Invalid "resultTyp" parameter');
}
    validateData(){
        this.validateLoaderTyp(this.loaderTyp);
        this.validateLoaderAndPath(this.loaderTyp, this.imagePath);
        this.validateResultTyp(this.resultTyp);
    }
}

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
      "fastShrinkOnLoad": true
  },
  {
      "outputResize": "1500x400",
      "fit": "contain",
      "position": "top",
      "background": "rgb(255,255,255)",
      "kernel": "lanczos3",
      "withoutEnlargement": false,
      "withoutReduction": false,
      "fastShrinkOnLoad": true
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
        "chromaSubsampling": "4:2:0",
        "optimiseCoding": true,
        "mozjpeg": false,
        "trellisQuantisation": false,
        "overshootDeringing": false,
        "optimiseScans": false,
        "quantisationTable": 0,
        "force": true
    }
  },
  "resultTyp": "local"
}`;

router.get('/', async (req, res)=>
{
    console.debug("/multi");
    try {
        let imageProcessing ;
        try{
            const parsedData = JSON.parse(dddd);
            imageProcessing  = new ImageProcessingRequest(parsedData);

            console.debug("Parse json body OK!: ", imageProcessing .imagePath);
            console.debug(imageProcessing.loaderTyp);
            console.debug(imageProcessing.imagePath);
            console.debug(imageProcessing.resultTyp);

            console.debug(imageProcessing.outputResize)

            const resizeConfigs = imageProcessing.outputResize;

            if (resizeConfigs) {
                for (const resizeConfig of resizeConfigs) {
                    const configKeys = Object.keys(resizeConfig);
                    for (const configKey of configKeys) {
                        const configValue = resizeConfig[configKey];
                        console.debug(`Config for resizeConfig outputResize=${resizeConfig.outputResize}, key: ${configKey}, value: ${configValue}`);
                        // Wywołaj tutaj swoją funkcję asynchroniczną
                        // await someAsyncFunction(configKey, configValue);
                    }
                }
            }

            const formats = Object.keys(imageProcessing.outputFormat);
            for (let format of formats) {
                const formatConfig = imageProcessing.outputFormat[format];
                const keys = Object.keys(formatConfig);
                for (const configKey of keys) {
                    const configValue = formatConfig[configKey];
                    console.debug(`Config for outputFormat ${format}, key: ${configKey}, value: ${configValue}`);
                    // Jeśli masz jakąś funkcję asynchroniczną, możesz użyć await tutaj
                    // await someAsyncFunction(configValue);
                }
            }

            console.debug("End debug Print ... ");

        } catch (error) {
            console.error("Error parse json: ", error);
            throw new Error(`Error parse json: ${error.message}`);
        }
        // ------------------------------------------------------------------------------------------------------------
        // ------------------------------------------------------------------------------------------------------------
        // ------------------------------------------------------------------------------------------------------------

        const imageBuffer = await loader(imageProcessing .loaderTyp, imageProcessing .imagePath);
        const { filePathWithoutFileName, fileNameWithoutExt, fileExt } =  pathNormalize(imageProcessing.loaderTyp, imageProcessing.imagePath);

        const destinationDirLocal = __dirImagesResultLocal + "/" + filePathWithoutFileName;
        const destinationDirMount = __dirImagesResultMount + "/" + filePathWithoutFileName;
        let destinationDir;
        switch (imageProcessing.resultTyp) {
            case "mount":
                await createDirectory(destinationDirMount);
                destinationDir = destinationDirMount;
                break;
            case "local":
            default:
                await createDirectory(destinationDirLocal);
                destinationDir = destinationDirLocal;
                break;
        }


        let sharpStream   = sharp(imageBuffer, { failOn: 'none' });

        const promises = [];

        const resizeConfigs = imageProcessing.outputResize;
        if(resizeConfigs) {
            for (const resizeConfig of resizeConfigs) {
                const sharpResize = await sharpStream.clone().resize(resizeConfig.width, resizeConfig.height, resizeConfig.getSharpConfig())
                console.debug(resizeConfig.width + "x" + resizeConfig.height);

                const formats = Object.keys(imageProcessing.outputFormat);
                for (let outputFormat of formats) {
                    const formatConfig = imageProcessing.outputFormat[outputFormat];
                    switch (outputFormat) {
                        case "webp":
                            const sharpStream_webp = sharpResize.webp(formatConfig.getSharpConfig());
                            await sharpStream_webp.toFile(`${destinationDir}/${fileNameWithoutExt}-${resizeConfig.width}x${resizeConfig.height}.${outputFormat}`);
                            console.debug("webp");
                            break;
                        case "avif":
                            const sharpStream_avif = sharpResize.avif(formatConfig.getSharpConfig());
                            await sharpStream_avif.toFile(`${destinationDir}/${fileNameWithoutExt}-${resizeConfig.width}x${resizeConfig.height}.${outputFormat}`);
                            console.debug("avif");
                            break;
                        case "jpg":
                        default:
                            const sharpStream_jpg = sharpResize.jpeg(formatConfig.getSharpConfig());
                            await sharpStream_jpg.toFile(`${destinationDir}/${fileNameWithoutExt}-${resizeConfig.width}x${resizeConfig.height}.${outputFormat}`);
                            console.debug("jpg");
                            break;
                    }
                }
            }
        }

        console.log("Resize ... ");
        return  res.status(200).json({ error: "OK", message: "wiadomosc OKcc"});
    } catch (error) {
        console.error("Internal Server Error", error);
        return res.status(500).json({ error: "Internal Server Error", message: error.message});
    }

});

export default router;