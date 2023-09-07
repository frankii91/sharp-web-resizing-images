import got from 'got';
import {promises as fs} from "fs";
import path from "path";
import {__dirImagesLocal, __dirImagesMount} from "./directories.js";

async function createDirectory(path){
    try {
        await fs.mkdir(path, { recursive: true });
        return true;
    } catch (error) {
        console.error('Could not create directory. An error occurred:', error);
        throw new Error('Could not create directory');
    }
}

function sanitizePath(dirLocal, imagePath){
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

function cutPath(imagePath){
    const filePathWithoutFileName = path.dirname(imagePath);
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

function pathNormalize(loaderTyp, imagePath) {

    if (!loaderTyp) {
        throw new Error("loaderTyp parameter is required");
    }

    if (!imagePath) {
        throw new Error("imagePath parameter is required");
    }

    switch (loaderTyp) {
        case 'local':
            try {
                imagePath = sanitizePath(__dirImagesLocal, imagePath);
                console.log("Local path parse :" + imagePath);
                return cutPath(imagePath);
            } catch (error) {
                console.error("Error Path parse:", error);
                throw new Error(`Could not Path parse: ${error.message}`);
            }
        case 'mount':
            try {
                imagePath = sanitizePath(__dirImagesLocal, imagePath);
                console.log("Mount path parse :" +  imagePath);
                return cutPath(imagePath);
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
                const filePathWithoutFileName = filePath.substring(0, filePath.lastIndexOf('/'));
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

async function loader(loaderTyp, imagePath) {
    if (!loaderTyp) {
        throw new Error("loaderTyp parameter is required");
    }

    if (!imagePath) {
        throw new Error("imagePath parameter is required");
    }
    let localFilePath;
    switch (loaderTyp) {
        case 'local':
            try {
                localFilePath = __dirImagesLocal + "/" + sanitizePath(__dirImagesLocal, imagePath)
                console.log("local FS imagePath:" + localFilePath);
                return await fs.readFile(localFilePath);
            } catch (error) {
                console.error("Error reading the file local:", error);
                throw new Error(`Could not read file local: ${error.message}`);
            }
        case 'mount':
            try {
                localFilePath = __dirImagesLocal + "/" + sanitizePath(__dirImagesMount, imagePath)
                console.log("mount FS imagePath:" + localFilePath);
                return await fs.readFile(localFilePath);
            } catch (error) {
                console.error("Error reading the file local:", error);
                throw new Error(`Could not read file local: ${error.message}`);
            }
        case 'url':
            // Kod do ładowania pliku z URL
            console.log("URL imagePath:" + imagePath);
            try {
                new URL(imagePath);
                return await got(imagePath).buffer();
            } catch (error) {
                console.error("Error downloading the file:", error);
                throw new Error(`Could not download file: ${error.message}`);
            }
        default:
            throw new Error('Invalid loader specified');
    }

}

function isValidResize(value) {
    const index = value.indexOf('x');
    if (index === -1) return false;

    const width = parseInt(value.slice(0, index), 10);
    const height = parseInt(value.slice(index + 1), 10);

    if (isNaN(width) || isNaN(height)) return false;

    return { width, height };
}

function parseBool(value) {
    if (typeof value === 'string') {
        value = value.toLowerCase().trim();
        if (value === 'true' || value === '1') {
            return true;
        }
        if (value === 'false' || value === '0') {
            return false;
        }
        return false;
        //throw new Error("Error parse to bool");
    }
    if (typeof value === 'number') {
        return value === 1;
    }
    return false;
    //throw new Error("Error parse to bool");
}

export {
    createDirectory,
    sanitizePath,
    cutPath,
    pathNormalize,
    loader,
    isValidResize,
    parseBool
};