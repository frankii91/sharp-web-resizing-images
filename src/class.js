import {validateBool} from "./tools.js";
import * as path from 'path';

//import {promises as fs} from "fs";
import fs from "fs";

import got from "got";
import {__dirImagesLocal, __dirImagesMount, __dirImagesResultLocal, __dirImagesResultMount} from "./config.js";


class BaseClass {
    constructor() {
        this.PROPERTIES_TO_OMIT = new Set(['PROPERTIES_TO_OMIT']);
    }

    toJSON() {
        const output = {};
        for (const key of Object.keys(this)) {
            if (!this.PROPERTIES_TO_OMIT.has(key)) {
                if (Array.isArray(this[key])) {
                    // Jeśli właściwość jest tablicą
                    output[key] = this[key].map(el => {
                        if (el instanceof Object && typeof el.toJSON === 'function') {
                            // Jeśli element tablicy jest obiektem i ma metodę toJSON
                            return el.toJSON();
                        } else {
                            // Dla innych typów wartości (np. prymitywów)
                            return el;
                        }
                    });
                } else if (this[key] instanceof Object && typeof this[key].toJSON === 'function') {
                    // Dla pojedynczych obiektów
                    output[key] = this[key].toJSON();
                } else {
                    // Dla innych typów wartości
                    output[key] = this[key];
                }
            }
        }
        return output;
    }
}

class ResizeConfig extends BaseClass {
    constructor(data) {
        super();
        // this.PROPERTIES_TO_OMIT = new Set([...this.PROPERTIES_TO_OMIT, 'destinationDirLocal', 'destinationDirMount']);

        this.outputResize = data.outputResize;
        this.fit = data.fit || 'contain';
        this.position = data.position || 'center';
        this.background = data.background || 'rgb(255,255,255)';
        this.kernel = data.kernel || 'lanczos3';
        this.withoutEnlargement = data.withoutEnlargement || false;
        this.withoutReduction = data.withoutReduction || false;
        this.fastShrinkOnLoad = data.fastShrinkOnLoad || true;
        this.addName = data.addName || '';
        this.addNameWithSuffix = this.addName &&  this.addName.trim() !== '' ? `-${this.addName}` : '';
        this.validateData();

    }
    validateAndSetDimensions() {
        if (!this.outputResize) throw new Error("Invalid resize format. Should be [int]x[int] e.g. 100x100");
        const dimensions = this.isValidResize(this.outputResize);
        if (!dimensions) throw new Error("Invalid resize format. Should be [int]x[int] e.g. 100x100");
        this.width =  dimensions.width;
        this.height =  dimensions.height;
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
    validateAddName(addName){
        if (addName != null && typeof addName === 'string' && !/^[^/\\:*?"<>|]*$/.test(addName)) {
            throw new Error('Invalid "addName" parameter');
        }
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
        this.validateAndSetDimensions();
        this.validateFit(this.fit);
        this.validatePosition(this.position);
        this.validateBackground(this.background);
        this.validateKernel(this.kernel);
        this.withoutEnlargement = validateBool(this.withoutEnlargement, "resize.withoutEnlargement");
        this.withoutReduction = validateBool(this.withoutReduction, "resize.withoutReduction");
        this.fastShrinkOnLoad = validateBool(this.fastShrinkOnLoad, "resize.fastShrinkOnLoad");
        this.validateAddName(this.addName);
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

class AvifConfig extends BaseClass {
    constructor(data) {
        super();
        // this.PROPERTIES_TO_OMIT = new Set([...this.PROPERTIES_TO_OMIT, 'destinationDirLocal', 'destinationDirMount']);
        this.quality = data.quality || 50;
        this.lossless = data.lossless || false;
        this.effort = data.effort || 4;
        this.chromaSubsampling = data.chromaSubsampling || '4:4:4';
        this.validateData();
    }
    validateQuality(){
        this.quality = parseInt(this.quality, 10);
        if (isNaN(this.quality) || +this.quality < 1 || +this.quality > 100) throw new Error(`Invalid "avif.quality" parameter. Should be an integer between 1 and 100.`);
    }
    validateEffort() {
        this.effort = parseInt(this.effort, 10);
        if (isNaN(this.effort) || this.effort < 0 || this.effort > 9) throw new Error(`Invalid "avif.effort" parameter. Should be an integer between 0 and 9.`);
    }
    validateChromaSubsampling(){
        if (!/^(\d+):(\d+):(\d+)$/.test(this.chromaSubsampling)) throw new Error(`Invalid "avif.chromaSubsampling" parameter. Should be e '4:4:4' set to '4:2:0' to use chroma subsampling`);
    }
    validateData(){
        this.validateQuality();
        this.lossless = validateBool(this.lossless, "avif.lossless");
        this.validateEffort();
        this.validateChromaSubsampling();

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

class WebpConfig extends BaseClass {
    constructor(data) {
        super();
        // this.PROPERTIES_TO_OMIT = new Set([...this.PROPERTIES_TO_OMIT, 'destinationDirLocal', 'destinationDirMount']);
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

    validateQuality(){
        this.quality = parseInt(this.quality, 10);
        if (isNaN(this.quality) || +this.quality < 1 || +this.quality > 100) throw new Error(`Invalid "webp.quality" parameter. Should be an integer between 1 and 100.`);
    }
    validateAlphaQuality(){
        this.alphaQuality = parseInt(this.alphaQuality, 10);
        if (isNaN(this.alphaQuality) || +this.alphaQuality < 0 || +this.alphaQuality > 100) throw new Error(`Invalid "webp.alphaQuality" parameter. Should be an integer between 0 and 100.`);
    }
    validatePreset(){
        if (!["default", "photo", "picture", "drawing", "icon", "text"].includes(this.preset)) throw new Error(`Invalid "webp.preset" parameter. Allowed presets are default, photo, picture, drawing, icon, text.`);
    }
    validateEffort(){
        this.effort = parseInt(this.effort, 10);
        if (isNaN(this.effort) || +this.effort < 0 || +this.effort > 6) throw new Error(`Invalid "webp.effort" parameter. Should be an integer between 0 and 6.`);
    }
    validateLoop(){
        this.loop = parseInt(this.loop, 10);
        if (isNaN(this.loop) || +this.loop < 0 || +this.loop > 1000) throw new Error(`Invalid "webp.loop" parameter. Should be number of animation iterations, use 0 for infinite = 1000 animation`);
    }
    validateDelay(){
        this.delay  = parseInt(this.delay , 10);
        if (isNaN(this.delay ) || +this.delay  < 1 || +this.delay  > 10000) throw new Error(`Invalid "webp.delay" parameter. Should be delay(s) between animation frames (in milliseconds)`);
    }
    validateData(){
        this.validateQuality();
        this.validateAlphaQuality();
        this.lossless = validateBool(this.lossless, "webp.lossless");
        this.nearLossless = validateBool(this.nearLossless, "webp.nearLossless");
        this.smartSubsample = validateBool(this.smartSubsample, "webp.smartSubsample");
        this.validatePreset();
        this.validateEffort();
        this.validateLoop();
        this.validateDelay();
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

class JpgConfig extends BaseClass {
    constructor(data) {
        super();
        // this.PROPERTIES_TO_OMIT = new Set([...this.PROPERTIES_TO_OMIT, 'destinationDirLocal', 'destinationDirMount']);
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

    validateQuality(){
        this.quality = parseInt(this.quality, 10);
        if (isNaN(this.quality) || +this.quality < 1 || +this.quality > 100) throw new Error(`Invalid "jpg.quality" parameter. Should be an integer between 1 and 100.`);
    }
    validateChromaSubsampling(){
        if (!/^(\d+):(\d+):(\d+)$/.test(this.chromaSubsampling)) throw new Error(`Invalid "jpg.chromaSubsampling" parameter. set to '4:4:4' to prevent chroma subsampling otherwise defaults to '4:2:0' chroma subsampling`);
    }
    validateQuantisationTable(){
        this.quantisationTable = parseInt(this.quantisationTable, 10);
        if (isNaN(this.quantisationTable)|| +this.quantisationTable < 0 || +this.quantisationTable > 8)  throw new Error(`Invalid "jpg.quantisationTable" parameter. Should be an integer between 1 and 100.`);
    }
    validateData(){
        this.validateQuality();
        this.progressive = validateBool(this.progressive, "jpg.progressive");
        this.validateChromaSubsampling();
        this.optimiseCoding = validateBool(this.optimiseCoding, "jpg.optimiseCoding");
        this.mozjpeg = validateBool(this.mozjpeg, "jpg.mozjpeg");
        this.trellisQuantisation = validateBool(this.trellisQuantisation, "jpg.trellisQuantisation");
        this.overshootDeringing = validateBool(this.overshootDeringing, "jpg.overshootDeringing");
        this.optimiseScans = validateBool(this.optimiseScans, "jpg.optimiseScans");
        this.validateQuantisationTable();
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
            force : this.force,
        };
    }
}

class ImageProcessingRequest extends BaseClass {
    constructor(data) {
        super();
        this.PROPERTIES_TO_OMIT = new Set([...this.PROPERTIES_TO_OMIT, 'destinationDirLocal', 'destinationDirMount']);

        this.loaderTyp = data.loaderTyp || 'local';
        this.imagePath = data.imagePath;
        this.outputStorage = data.outputStorage || 'local';
        this.validateData();
        const { filePathWithoutFileName, fileNameWithoutExt, fileExt } =  this.pathNormalize(this.loaderTyp, this.imagePath);
        this.filePathWithoutFileName = filePathWithoutFileName;
        this.fileNameWithoutExt = fileNameWithoutExt;
        this.fileExt = fileExt;
        this.destinationDirLocal = path.join(__dirImagesResultLocal, this.filePathWithoutFileName);
        this.destinationDirMount = path.join(__dirImagesResultMount, this.filePathWithoutFileName);


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
    async loader() {
        if (!this.loaderTyp) {
            throw new Error("loaderTyp parameter is required");
        }

        if (!this.imagePath) {
            throw new Error("imagePath parameter is required");
        }
        let localFilePath;
        switch (this.loaderTyp) {
            case 'local':
                try {
                    localFilePath = __dirImagesLocal + "/" + this.sanitizePath(__dirImagesLocal, this.imagePath)
                    console.log("local FS imagePath:" + localFilePath);
                    return await fs.promises.readFile(localFilePath);
                } catch (error) {
                    console.error("Error reading the file local:", error);
                    throw new Error(`Could not read file local: ${error.message}`);
                }
            case 'mount':
                try {
                    localFilePath = __dirImagesMount + "/" + this.sanitizePath(__dirImagesMount, this.imagePath)
                    console.log("mount FS imagePath:" + localFilePath);
                    return await fs.promises.readFile(localFilePath);
                } catch (error) {
                    console.error("Error reading the file local:", error);
                    throw new Error(`Could not read file local: ${error.message}`);
                }
            case 'url':
                // Kod do ładowania pliku z URL
                console.log("URL imagePath:" + this.imagePath);
                try {
                    new URL(this.imagePath);
                    return await got(this.imagePath).buffer();
                } catch (error) {
                    console.error("Error downloading the file:", error);
                    throw new Error(`Could not download file: ${error.message}`);
                }
            default:
                throw new Error('Invalid loader specified');
        }

    }

    pathNormalize(loaderTyp, imagePath) {

        if (!loaderTyp) {
            throw new Error("loaderTyp parameter is required");
        }

        if (!imagePath) {
            throw new Error("imagePath parameter is required");
        }

        switch (loaderTyp) {
            case 'local':
                try {
                    imagePath = this.sanitizePath(__dirImagesLocal, imagePath);
                    console.log("Local path parse :" + imagePath);
                    return this.cutPath(imagePath);
                } catch (error) {
                    console.error("Error Path parse:", error);
                    throw new Error(`Could not Path parse: ${error.message}`);
                }
            case 'mount':
                try {
                    // imagePath = this.sanitizePath(__dirImagesLocal, imagePath);
                    imagePath = this.sanitizePath(__dirImagesMount, imagePath);
                    console.log("Mount path parse :" +  imagePath);
                    return this.cutPath(imagePath);
                } catch (error) {
                    console.error("Error Path parse:", error);
                    throw new Error(`Could not Path parse: ${error.message}`);
                }
            case 'url':
                console.log("URL parse: " + imagePath);
                try {
                    const parsedUrl = new URL(imagePath);

                    const protocol = parsedUrl.protocol;
                    const domain = parsedUrl.hostname;
                    const port = parsedUrl.port;
                    const filePath = parsedUrl.pathname;
                    const filePathWithoutFileName =  path.normalize(filePath.substring(0, filePath.lastIndexOf('/')));
                    const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
                    const fileExt = fileName.substring(fileName.lastIndexOf('.'));
                    const fileNameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));

                    const prefix = port ? `${protocol}//${domain}:${port}` : `${protocol}//${domain}`;

                    console.log("URL protocol: " + protocol);
                    console.log("URL domain: " + domain);
                    console.log("URL port: " + port);
                    console.log("URL filePath: " + filePath);
                    console.log("URL filePathWithoutFileName: " + filePathWithoutFileName);

                    console.log("URL fileName: " + fileName);
                    console.log("URL fileNameWithoutExt: " + fileNameWithoutExt);
                    console.log("URL fileExt: " + fileExt);
                    console.log("URL prefix: " + prefix);

                    return {
                        filePathWithoutFileName,
                        fileNameWithoutExt,
                        fileExt
                    };

                } catch (error) {
                    console.error("Error URL parse:", error);
                    throw new Error(`Could not URL parse: ${error.message}`);
                }
            default:
                throw new Error('Error pathNormalize ...');
        }
    }

    sanitizePath(dirLocal, imagePath){
        if (path.isAbsolute(imagePath)) {
            throw new Error("Error path isAbsolute: " + imagePath);
        }
        let normalizedPath = path.normalize(imagePath);
        let absolutePath = path.resolve(dirLocal, normalizedPath);
        if (!absolutePath.startsWith(dirLocal)) {
            throw new Error("Error path - unsafe: ");
        }
        imagePath = absolutePath.substring(dirLocal.length+1)
        console.log("sanitizePath: " + imagePath);
        return imagePath;
    }

    cutPath(imagePath){

        const filePathWithoutFileName = path.dirname(path.normalize(imagePath));
        const fileName = path.basename(imagePath);
        const fileExt = path.extname(imagePath);
        const fileNameWithoutExt = path.basename(imagePath, fileExt);

        console.log("Local filePathWithoutFileName: " + filePathWithoutFileName);
        console.log("Local fileName: " + fileName);
        console.log("Local fileNameWithoutExt: " + fileNameWithoutExt);
        console.log("Local fileExt: " + fileExt);

        return {
            filePathWithoutFileName,
            fileNameWithoutExt,
            fileExt
        };
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
                    localFilePath = path.join(__dirImagesLocal, this.sanitizePath(__dirImagesLocal, imagePath))
                } else {
                    localFilePath = path.join(__dirImagesMount, this.sanitizePath(__dirImagesMount, imagePath))
                }

                try {
                    fs.accessSync(localFilePath, fs.constants.F_OK);

                } catch (err) {

                    throw new Error(`File not exist: ${imagePath}`);

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
    validateLoaderTyp(){
        const allowedLoaderTyp = {
            'local': true,
            'mount': true,
            'url': true
        };
        if (!allowedLoaderTyp.hasOwnProperty(this.loaderTyp)) throw new Error('Invalid "loaderTyp" parameter');
    }

    validateOutputStorage(){
        const allowedOutputStorage = {
            'local': true,
            'mount': true,
            'stream': true,
            'cr2': true,
            'ftp': true
        };
        if (!allowedOutputStorage.hasOwnProperty(this.outputStorage)) throw new Error('Invalid "outputStorage" parameter');
    }
    validateData(){
        this.validateLoaderTyp();
        this.validateLoaderAndPath(this.loaderTyp, this.imagePath);
        this.validateOutputStorage();
    }


}

export {
    ResizeConfig,
    AvifConfig,
    WebpConfig,
    JpgConfig,
    ImageProcessingRequest
};
