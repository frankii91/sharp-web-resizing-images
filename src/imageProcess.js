import sharp from "sharp";
import {StorageManagerV} from "./storage/resultStorage.js";
import {flattenObject} from "./tools.js";

function imageProcess(imageProcessing, res, sharpStream, fileNameWithoutExt, promises, resizeConfig){
    try {
        const formats = Object.keys(imageProcessing.outputFormat);
        const isStream = imageProcessing.outputStorage === 'stream';
        const list = isStream ? [formats[0]] : formats;
        for (let outputFormat of list) {
            promises.push(imageProcessFor(imageProcessing, res, sharpStream, outputFormat, fileNameWithoutExt, resizeConfig ));
        }
    } catch (error) {
        console.error("Wystąpił błąd w imageProcess:", error);
        throw error;
    }
}

async function imageProcessFor(imageProcessing, res, sharpStream, outputFormat, fileNameWithoutExt, resizeConfig ){
    try {
        const formatConfig = imageProcessing.outputFormat[outputFormat];
        let file;
        let buffer;
        let metaTags = {
            resizeConfig: resizeConfig ? resizeConfig.toJSON() : null,
            formatConfig: formatConfig.toJSON(),
            outputFormat
        };
        const flattenedMetaTags = flattenObject(metaTags);

        console.debug(flattenedMetaTags);

        switch (outputFormat) {
            case "webp":
                file = `${fileNameWithoutExt}.${outputFormat}`;
                buffer = await sharpStream.clone().webp(formatConfig.getSharpConfig()).toBuffer();
                console.debug("webp");
                // if(RESULT_MULTI_SAVE){
                //     return await new StorageManagerV(imageProcessing.outputStorage, buffer, imageProcessing.filePathWithoutFileName, file, res, 'image/webp', flattenedMetaTags).save();
                // }
                return await new StorageManagerV(
                    imageProcessing.outputStorage,
                    buffer,
                    imageProcessing.filePathWithoutFileName,
                    file,
                    res,
                    'image/webp',
                    flattenedMetaTags
                ).save();

                // break;
            case "avif":
                file = `${fileNameWithoutExt}.${outputFormat}`;
                buffer = await sharpStream.clone().avif(formatConfig.getSharpConfig()).toBuffer();
                console.debug("avif");
                // if(RESULT_MULTI_SAVE){
                //     return await new StorageManagerV(imageProcessing.outputStorage, buffer, imageProcessing.filePathWithoutFileName, file, res, 'image/avif', flattenedMetaTags).save();
                // }
                return await new StorageManagerV(
                    imageProcessing.outputStorage,
                    buffer,
                    imageProcessing.filePathWithoutFileName,
                    file,
                    res,
                    'image/avif',
                    flattenedMetaTags
                ).save();
                // break;
            case "jpg":
            default:
                file = `${fileNameWithoutExt}.${outputFormat}`;
                buffer = await sharpStream.clone().jpeg(formatConfig.getSharpConfig()).toBuffer();
                console.debug("jpg");
                // if(RESULT_MULTI_SAVE){
                //     return await new StorageManagerV(imageProcessing.outputStorage, buffer, imageProcessing.filePathWithoutFileName, file, res, 'image/jpeg', flattenedMetaTags).save();
                // }
                return await new StorageManagerV(
                    imageProcessing.outputStorage,
                    buffer,
                    imageProcessing.filePathWithoutFileName,
                    file,
                    res,
                    'image/jpeg',
                    flattenedMetaTags
                ).save();
                // break;
        }

    } catch (error) {
        console.error("Wystąpił błąd w imageProcessFor:", error);
        throw error;
    }
}

async function imagePreProcess(imageProcessing, res){
    let promises = [];
    try{
        const isStream = imageProcessing.outputStorage === 'stream';
        const imageBuffer = await imageProcessing.loader();

        let sharpStream   = sharp(imageBuffer, { failOn: 'none' });
        const resizeConfigs = imageProcessing.outputResize;
        if(resizeConfigs) {
            const list = isStream ? [resizeConfigs[0]] : resizeConfigs;
            for (const resizeConfig of list) {
                let sharpStreamResize = await sharpStream.clone().resize(resizeConfig.width, resizeConfig.height, resizeConfig.getSharpConfig())
                console.debug(resizeConfig.width + "x" + resizeConfig.height);
                imageProcess(imageProcessing, res, sharpStreamResize, `${imageProcessing.fileNameWithoutExt}${resizeConfig.addNameWithSuffix}`, promises, resizeConfig);
            }
        }else{
            imageProcess(imageProcessing, res, sharpStream, imageProcessing.fileNameWithoutExt, promises, resizeConfigs);
        }

        return {
            promises
        };
    } catch (error) {
        console.error(error)
        return {
            ...error,
            promises
        };
    }
}

function debugPreProces(req, imageProcessing){
    try{
        const data = req.query;
        //console.debug("Parse json body OK!: ", imageProcessing.imagePath);
        console.debug(imageProcessing.loaderTyp);
        console.debug(imageProcessing.imagePath);
        console.debug(imageProcessing.outputStorage);

        console.debug(imageProcessing.outputResize)
        const isStream = imageProcessing.outputStorage === 'stream';

        const resizeConfigs = imageProcessing.outputResize;
        if (resizeConfigs) {
            const list = isStream ? [resizeConfigs[0]] : resizeConfigs;
            for (const resizeConfig of list) {
                const configKeys = Object.keys(resizeConfig);
                for (const configKey of configKeys) {
                    const configValue = resizeConfig[configKey];
                    console.debug(`Config for resizeConfig outputResize=${resizeConfig.outputResize}, key: ${configKey}, value: ${configValue}`);
                }
            }
        }

        const formats = Object.keys(imageProcessing.outputFormat);
        const listFormats = isStream ? [formats[0]] : formats;

        for (let format of listFormats) {
            const formatConfig = imageProcessing.outputFormat[format];
            const keys = Object.keys(formatConfig);
            for (const configKey of keys) {
                const configValue = formatConfig[configKey];
                console.debug(`Config for outputFormat ${format}, key: ${configKey}, value: ${configValue}`);
            }
        }

        console.debug("End debug Print ... ");

    } catch (error) {
        console.error("Error parse: ", error);
        throw new Error(`Error parse: ${error.message}`);
    }
}

export {
    imagePreProcess,
    debugPreProces
};