import fs from 'fs/promises';
import * as path from 'path';
import dirManager from './directoryManager.js';
import {AWS_DeleteObject, AWS_PutObject} from "./aws-s3.js";
import {
    __dirImagesResultLocal,
    __dirImagesResultMount,
    FTP_BaseDirImagesResult, RESULT_MULTI_SAVE
} from "../config.js";
import {FTPremove, FTPupload} from "./ftp.js";


class BufferManager {
    constructor() {
        this.buffers = [];
    }

    addBuffer(buffer) {
        return new Promise((resolve) => {
            this.buffers.push(buffer);
            resolve();
        });
    }

    getBuffers() {
        return new Promise((resolve) => {
            resolve(this.buffers);
        });
    }

    clearBuffers() {
        return new Promise((resolve) => {
            this.buffers = [];
            resolve();
        });
    }
}

class BufferManagerFactory {
    create() {
        return new BufferManager();
    }
}

// Singleton Factory
const bufferManagerFactory = new BufferManagerFactory();

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
        return fs.writeFile(`${path.join(this.dirPath, this.fileName)}`,  this.buffer);
    }
    async delete() {
        return fs.unlink(`${path.join(this.dirPath, this.fileName)}`);
    }
}
class MountStorage extends LocalStorage {

}

// AWS S3 przechowywanie
class S3Storage extends Storage {
    constructor(buffer, key, contentType, metaTags) {
        super(buffer, null, null);
        this.key = key;
        this.contentType = contentType;
        this.metaTags = metaTags;

    }

    async save() {
        return await AWS_PutObject(this.buffer , this.key, this.contentType, this.metaTags);
    }
    async delete() {
        return await AWS_DeleteObject(this.key);
    }
}

// FTP przechowywanie
class FTPStorage extends Storage {
    async save() {
        return await FTPupload(this.buffer, this.dirPath, this.fileName);
    }
    async delete() {
        return await FTPremove(this.buffer, this.dirPath, this.fileName);
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

    constructor(outputStorage, buffer, dirPath, fileName, response, contentType, metaTags) {
        this.bufferManager = bufferManagerFactory.create();

        this.outputStorage = outputStorage;
        this.buffer = buffer;
        this.dirPath = dirPath;
        this.fileName = fileName;
        this.response = response;
        this.contentType = contentType;
        this.metaTags = metaTags;

        /** @type {Storage} */
        this.storage = null;

    }

    async save() {
        let result;

        try {
            if(RESULT_MULTI_SAVE){
                result = await this.bufferManager.addBuffer(
                    {  outputStorage: this.outputStorage,
                        buffer: this.buffer,
                        dirPath: this.dirPath,
                        fileName: this.fileName,
                        response: this.response,
                        contentType: this.contentType,
                        metaTags: this.metaTags,
                    }
                )
            }
            else{
                switch(this.outputStorage) {
                    case 'local':
                        this.storage = new LocalStorage(this.buffer, `${path.join(__dirImagesResultLocal, this.dirPath)}`, this.fileName);
                        break;
                    case 'mount':
                        this.storage = new MountStorage(this.buffer, `${path.join(__dirImagesResultMount, this.dirPath)}`, this.fileName);
                        break;
                    case 'cr2':
                        this.storage = new S3Storage(this.buffer, `${path.join(this.dirPath, this.fileName)}`, this.contentType, this.metaTags);
                        break;
                    case 'ftp':
                        this.storage = new FTPStorage(this.buffer, `${path.join(FTP_BaseDirImagesResult, this.dirPath)}`, this.fileName);
                        break;
                    case 'stream':
                        this.storage = new StreamStorage(this.buffer, this.response, this.contentType);
                        break;
                    default:
                        throw new Error(`Unsupported output storage type: ${this.outputStorage}`);
                }
                result = await this.storage.save();
            }
            // Jeśli operacja zakończyła się pomyślnie, dodaj dodatkowe informacje.
            return {
                ...result,
                storageType: this.getStorageType(),
                dirPath: this.dirPath,
                fileName: this.fileName,
                status: 'ok'
            };
        } catch (error) {
            // Przechwycenie błędu, dodanie dodatkowych informacji i ponowne rzucenie błędu.
            throw {
                ...error,
                storageType: this.getStorageType(),
                dirPath: this.dirPath,
                fileName: this.fileName,
                status: 'error'
            };
        }
    }
    getStorageType() {
        if (this.storage instanceof LocalStorage) return 'local';
        if (this.storage instanceof MountStorage) return 'mount';
        if (this.storage instanceof S3Storage) return 'cr2';
        if (this.storage instanceof FTPStorage) return 'ftp';
        if (this.storage instanceof StreamStorage) return 'stream';
        // ... dla innych typów przechowywania ...
        return 'unknown';
    }

    async delete() {
        if (typeof this.storage.delete === 'function') {
            try {
                const result = await this.storage.delete();
                // Jeśli operacja zakończyła się pomyślnie, dodaj dodatkowe informacje.
                return {
                    ...result,
                    storageType: this.getStorageType(),
                    dirPath: this.dirPath,
                    fileName: this.fileName,
                    status: 'ok'
                };
            } catch (error) {
                // Przechwycenie błędu, dodanie dodatkowych informacji i ponowne rzucenie błędu.
                throw {
                    ...error,
                    storageType: this.getStorageType(),
                    dirPath: this.dirPath,
                    fileName: this.fileName,
                    status: 'error'
                };
            }
        } else {
            throw new Error("Delete method not implemented for this storage type.");
        }
    }
}
export {
    StorageManagerV
}