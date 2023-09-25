import sharp from "sharp";
import color from "color";
import {StorageManagerV} from "./storage/resultStorage.js";

function imageProcess(imageProcessing, res, sharpStream, fileNameWithoutExt, promises, savedFiles){
    try {
        const formats = Object.keys(imageProcessing.outputFormat);
        for (let outputFormat of formats) {
            promises.push(imageProcessFor(imageProcessing, res, sharpStream, outputFormat, fileNameWithoutExt, savedFiles ));
        }
    } catch (error) {
        console.error("Wystąpił błąd w imageProcess:", error);
        throw error;
    }
}
async function imageProcessFor(imageProcessing, res, sharpStream, outputFormat, fileNameWithoutExt, savedFiles ){
    try {
        const formatConfig = imageProcessing.outputFormat[outputFormat];
        let file;
        let buffer;
        switch (outputFormat) {
            case "webp":
                file = `${fileNameWithoutExt}.${outputFormat}`;
                buffer = await sharpStream.clone().webp(formatConfig.getSharpConfig()).toBuffer();
                console.debug("webp");
                return await new StorageManagerV(imageProcessing.outputStorage, buffer, imageProcessing.filePathWithoutFileName, file, res, 'image/webp').save();
                break;
            case "avif":
                file = `${fileNameWithoutExt}.${outputFormat}`;
                buffer = await sharpStream.clone().avif(formatConfig.getSharpConfig()).toBuffer();
                console.debug("avif");
                return await new StorageManagerV(imageProcessing.outputStorage, buffer, imageProcessing.filePathWithoutFileName, file, res, 'image/avif').save();
                break;
            case "jpg":
            default:
                file = `${fileNameWithoutExt}.${outputFormat}`;
                buffer = await sharpStream.clone().jpeg(formatConfig.getSharpConfig()).toBuffer();
                console.debug("jpg");
                return await new StorageManagerV(imageProcessing.outputStorage, buffer, imageProcessing.filePathWithoutFileName, file, res, 'image/jpeg').save();
                break;
        }

    } catch (error) {
        console.error("Wystąpił błąd w imageProcessFor:", error);
        throw error;
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

        const resizeConfigs = imageProcessing.outputResize;

        if (resizeConfigs) {
            for (const resizeConfig of resizeConfigs) {
                const configKeys = Object.keys(resizeConfig);
                for (const configKey of configKeys) {
                    const configValue = resizeConfig[configKey];
                    console.debug(`Config for resizeConfig outputResize=${resizeConfig.outputResize}, key: ${configKey}, value: ${configValue}`);
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
            }
        }

        console.debug("End debug Print ... ");

    } catch (error) {
        console.error("Error parse: ", error);
        throw new Error(`Error parse: ${error.message}`);
    }
}

async function imagePreProcess(imageProcessing, res){
    let promises = [];
    let savedFiles = [];
    try{
        const imageBuffer = await imageProcessing.loader();

        let sharpStream   = sharp(imageBuffer, { failOn: 'none' });
        const resizeConfigs = imageProcessing.outputResize;
        if(resizeConfigs) {
            for (const resizeConfig of resizeConfigs) {
                let sharpStreamResize = await sharpStream.clone().resize(resizeConfig.width, resizeConfig.height, resizeConfig.getSharpConfig())
                console.debug(resizeConfig.width + "x" + resizeConfig.height);
                imageProcess(imageProcessing, res, sharpStreamResize, `${imageProcessing.fileNameWithoutExt}${resizeConfig.addNameWithSuffix}`, promises, savedFiles);
            }
        }else{
            imageProcess(imageProcessing, res, sharpStream, imageProcessing.fileNameWithoutExt, promises, savedFiles);
        }

        return {
            promises,
            savedFiles
        };
    } catch (error) {
        console.error(error)
        return {
            ...error,
            promises,
            savedFiles
        };
    }
}

export {
    imagePreProcess,
    debugPreProces
};