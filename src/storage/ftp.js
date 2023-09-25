import * as ftp from "basic-ftp"
import * as path from 'path';
import { Readable } from 'stream';
import {FTP_HOST, FTP_PASSWORD, FTP_USER} from "../config.js";
async function Client(){
    const client = new ftp.Client()
    client.ftp.verbose = true;
    try {
        await client.access({
            host: FTP_HOST,
            user: FTP_USER,
            password: FTP_PASSWORD,
            secure: true
        })
        return client;
    }
    catch(error) {
        console.error('Error Client connect:', error);
        throw new Error(`Error Client connect: ${error}`);
    }
}

async function FTPupload(buffer, dirPath, fileName) {
    const client = await Client();
    const remoteFilePath = path.join(dirPath, fileName)

    try {
        const bufferStream = new Readable();
        bufferStream.push(buffer); // bufor to Twój Buffer
        bufferStream.push(null); // Zakończenie strumienia

        await client.ensureDir(dirPath);
        await client.uploadFrom(bufferStream, remoteFilePath);

        const localBufferSize = buffer.length;
        const remoteFileSize = await client.size(remoteFilePath);

        if (localBufferSize !== remoteFileSize) {
            console.error('Weryfikacja po przesłaniu nie powiodła się, rozmiar pliku różni się!');
            await client.remove(remoteFilePath);
            throw new Error('Weryfikacja po przesłaniu nie powiodła się, rozmiar pliku różni się!');
        }

        console.debug('Plik został pomyślnie przesłany na FTP i zweryfikowany.');
        return true;
    } catch (error) {
        console.error(`FTP Error during uploading file ${remoteFilePath}:`, error);
        throw new Error(`FTP Error during uploading file ${remoteFilePath}: ${error}`);
    } finally {
        client.close();
    }
}

async function FTPremove(buffer, dirPath, fileName) {
    const client = await Client();
    const remoteFilePath = path.join(dirPath, fileName)

    try {
        await client.remove(remoteFilePath);
        while (dirPath && dirPath !== '/') {
            const list = await client.list(dirPath);
            if (list.length === 0) {
                await client.removeDir(dirPath);
                dirPath = path.dirname(dirPath);
            } else {
                break;
            }
        }
        return true;
    } catch (error) {
        console.error(`FTP Error during removing file and empty parent directories of ${remoteFilePath}:`, error);
        throw new Error(`FTP Error during removing file and empty parent directories of ${remoteFilePath}: ${error}`);
    } finally {
        client.close();
    }
}

async function checkFeatures() {
    const client = await Client();
    try {
        console.log(await client.list())
        const features = await client.features();
        console.log('Obsługiwane cechy:', features);

    } catch (err) {
        console.error('Błąd FTP:', err);
    } finally {
        client.close();
    }
}

export {
    FTPremove,
    FTPupload,
    checkFeatures
}