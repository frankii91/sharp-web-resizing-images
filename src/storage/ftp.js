import * as ftp from "basic-ftp";
import path from "path";
import { Readable } from "stream";
import { FTP_HOST, FTP_PASSWORD, FTP_USER } from "../config.js";

// ✅ ważne: nie używaj path.join do ścieżek FTP (na Windows zrobi "\"), tylko POSIX "/"
const ftpPath = (...parts) =>
    path.posix.join(...parts.map((p) => String(p ?? "").replaceAll("\\", "/")));

const normalizeDir = (dirPath) => {
    let p = String(dirPath ?? "").replaceAll("\\", "/");
    // usuń końcowe slashe (poza "/")
    if (p.length > 1) p = p.replace(/\/+$/, "");
    return p || "/";
};

async function Client() {
    const client = new ftp.Client();
    client.ftp.verbose = true;

    try {
        await client.access({
            host: FTP_HOST,
            user: FTP_USER,
            password: FTP_PASSWORD,
            secure: true,
            // secureOptions: { rejectUnauthorized: false },
        });

        return client;
    } catch (error) {
        console.error("Error Client connect:", error);
        throw new Error(`Error Client connect: ${error?.message || error}`);
    }
}

async function FTPupload(buffer, dirPath, fileName) {
    const client = await Client();
    const dir = normalizeDir(dirPath);
    const remoteFilePath = ftpPath(dir, fileName);

    try {
        const bufferStream = new Readable({
            read() {
                this.push(buffer);
                this.push(null);
            },
        });

        await client.ensureDir(dir);
        await client.uploadFrom(bufferStream, remoteFilePath);

        const localBufferSize = buffer.length;
        const remoteFileSize = await client.size(remoteFilePath);

        if (localBufferSize !== remoteFileSize) {
            console.error("FTP verify failed: file size mismatch");
            await client.remove(remoteFilePath);
            throw new Error("FTP verify failed: file size mismatch");
        }

        console.debug("FTP upload OK:", remoteFilePath);
        return true;
    } catch (error) {
        console.error(`FTP Error during uploading file ${remoteFilePath}:`, error);
        throw new Error(
            `FTP Error during uploading file ${remoteFilePath}: ${error?.message || error}`
        );
    } finally {
        client.close();
    }
}

async function FTPremove(dirPath, fileName) {
    const client = await Client();
    let dir = normalizeDir(dirPath);
    const remoteFilePath = ftpPath(dir, fileName);

    try {
        await client.remove(remoteFilePath);

        // ✅ usuń puste katalogi nadrzędne (do momentu aż trafisz na niepusty albo "/")
        while (dir && dir !== "/") {
            const list = await client.list(dir);

            // list może zwrócić np. "." / ".." u niektórych serwerów – odfiltruj
            const realItems = list.filter((i) => i?.name !== "." && i?.name !== "..");

            if (realItems.length === 0) {
                await client.removeDir(dir);
                dir = path.posix.dirname(dir);
            } else {
                break;
            }
        }

        console.debug("FTP remove OK:", remoteFilePath);
        return true;
    } catch (error) {
        console.error(`FTP Error during removing file/dirs of ${remoteFilePath}:`, error);
        throw new Error(
            `FTP Error during removing file/dirs of ${remoteFilePath}: ${error?.message || error}`
        );
    } finally {
        client.close();
    }
}

async function checkFeatures() {
    const client = await Client();
    try {
        console.log(await client.list());
        const features = await client.features();
        console.log("Obsługiwane cechy:", features);
    } catch (err) {
        console.error("Błąd FTP:", err);
    } finally {
        client.close();
    }
}

export { FTPremove, FTPupload, checkFeatures };
