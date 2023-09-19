import fs from 'fs/promises';
import dirManager from './directoryManager.js';
import {AWS_PutObject} from "./file_storage_cloudflarer2.js";
import {__dirImagesResultLocal, __dirImagesResultMount} from "./directories.js";

class Storage {
    constructor(buffer, dirPath, fileName) {
        this.buffer = buffer;
        this.dirPath = dirPath;
        this.fileName = fileName;
    }

    async save() {
        throw new Error("save method not implemented");
    }

    async delete() {
        throw new Error("delete method not implemented");
    }
}

class LocalStorage extends Storage {
    async save() {
        await dirManager.initDirectory(this.dirPath);
        return fs.writeFile(`${this.dirPath}/${this.fileName}`,  this.buffer);
    }
    async delete() {
        return fs.unlink(`${this.dirPath}/${this.fileName}`);
    }
}

// AWS S3 przechowywanie
class S3Storage extends Storage {
    constructor(buffer, key, contentType) {
        super(buffer, null, null);
        this.key = key;
        this.contentType = contentType;
    }

    async save() {
        return await AWS_PutObject(this.buffer , this.key, this.contentType);
    }
    async delete() {
       // return await AWS_DeleteObject(this.filePath);
    }
}

// Strumień do przeglądarki
class StreamStorage extends Storage {
    constructor(buffer, response, contentType) {
        super(buffer, null, null);
        this.response = response;
        this.contentType = contentType;
    }
    async save() {
        try {
            this.response.setHeader('Content-Type', this.contentType);
            this.response.end(this.buffer);
        } catch (error) {
            console.error("Error while saving the buffer:", error);
            this.response.status(500).json({ error: "Internal Server Error", message: error.message});
        }
    }
}

class StorageManagerV {
    constructor(outputStorage, buffer, dirPath, fileName, response, contentType) {
        /** @type {Storage} */
        this.storage = null;

        switch(outputStorage) {
            case 'local':
                this.storage = new LocalStorage(buffer, `${__dirImagesResultLocal}/${dirPath}`, fileName);
                break;
            case 'mount':
                this.storage = new LocalStorage(buffer, `${__dirImagesResultMount}/${dirPath}`, fileName);
                break;
            case 'cr2':
                this.storage = new S3Storage(buffer, `${dirPath}/${fileName}`, contentType);
                break;
            case 'stream':
                this.storage = new StreamStorage(buffer, response, contentType);
                break;
            default:
                throw new Error(`Unsupported output storage type: ${outputStorage}`);
        }
    }
    async save() {
        return this.storage.save();
    }

    async delete() {
        if (typeof this.storage.delete === 'function') {
            return this.storage.delete();
        } else {
            throw new Error("Delete method not implemented for this storage type.");
        }
    }
}
export {
    StorageManagerV
}