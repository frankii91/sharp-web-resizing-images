import * as ftp from "basic-ftp";
import path from "path";
import { Readable } from "stream";
import { FTP_HOST, FTP_PASSWORD, FTP_USER } from "../config.js";

// ✅ ważne: nie używaj path.join do ścieżek FTP (na Windows zrobi "\"), tylko POSIX "/"
const ftpPath = (...parts) =>
    path.posix.join(...parts.map((p) => String(p ?? "").replaceAll("\\", "/")));

// ✅ normalize: zawsze absolutna ścieżka katalogu, bez końcowych "/" (poza "/")
const normalizeDir = (dirPath) => {
    let p = String(dirPath ?? "").replaceAll("\\", "/").trim();
    if (!p.startsWith("/")) p = "/" + p;
    if (p.length > 1) p = p.replace(/\/+$/, "");
    return p || "/";
};

// ✅ normalize file path (może być plik lub katalog)
const normalizePath = (p) => {
    let s = String(p ?? "").replaceAll("\\", "/").trim();
    if (!s.startsWith("/")) s = "/" + s;
    // dla plików nie ucinamy końcowych "/" agresywnie, ale usuń wielokrotne
    s = s.replace(/\/{2,}/g, "/");
    return s || "/";
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

/**
 * Upload Buffer -> FTP
 */
async function FTPupload(buffer, dirPath, fileName) {
    const client = await Client();
    const dir = normalizeDir(dirPath);
    const remoteFilePath = ftpPath(dir, fileName);

    try {
        // ✅ najprościej i pewnie (Node 24 OK)
        const bufferStream = Readable.from(buffer);

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

/**
 * Remove file + cleanup empty parent dirs
 */
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
                dir = normalizeDir(path.posix.dirname(dir));
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

/**
 * List directory contents
 */
async function FTPlist(dirPath = "/") {
    const client = await Client();
    const dir = normalizeDir(dirPath);

    try {
        const list = await client.list(dir);
        // filtruj "." / ".."
        return list.filter((i) => i?.name !== "." && i?.name !== "..");
    } catch (error) {
        console.error(`FTP Error during list ${dir}:`, error);
        throw new Error(`FTP Error during list ${dir}: ${error?.message || error}`);
    } finally {
        client.close();
    }
}

/**
 * Stat path (file or dir) - uses SIZE/MDTM where possible
 * Zwraca { exists, type, size, modifiedAt, path }
 */
async function FTPstat(remotePath) {
    const client = await Client();
    const p = normalizePath(remotePath);

    try {
        // próba wykrycia czy to katalog:
        // - list(dirname) i szukamy elementu po name
        // - jeśli dirname === p (bo p ma końcówkę "/") to list(p)
        const dir = normalizeDir(path.posix.dirname(p));
        const base = path.posix.basename(p);

        // jeżeli ktoś podał "/a/b/" to basename będzie "", więc potraktuj jako dir
        const isDirQuery = !base || p.endsWith("/");

        if (isDirQuery) {
            // jeśli to katalog - spróbuj list()
            const items = await client.list(normalizeDir(p));
            return {
                exists: true,
                type: "dir",
                size: null,
                modifiedAt: null,
                path: normalizeDir(p),
                items: items.filter((i) => i?.name !== "." && i?.name !== ".."),
            };
        }

        // plik: size + lastMod
        const size = await client.size(p);
        let modifiedAt = null;
        try {
            modifiedAt = await client.lastMod(p);
        } catch (_) {
            // lastMod nie zawsze działa na wszystkich serwerach
        }

        return {
            exists: true,
            type: "file",
            size,
            modifiedAt,
            path: p,
        };
    } catch (error) {
        // jeśli SIZE/MDTM walnie, spróbuj jeszcze list() jako fallback
        try {
            const dir = normalizeDir(path.posix.dirname(p));
            const base = path.posix.basename(p);
            const list = await client.list(dir);
            const hit = list.find((i) => i?.name === base);
            if (!hit) {
                return { exists: false, type: "unknown", size: null, modifiedAt: null, path: p };
            }
            return {
                exists: true,
                type: hit.isDirectory ? "dir" : "file",
                size: hit.size ?? null,
                modifiedAt: hit.modifiedAt ?? null,
                path: p,
            };
        } catch (_) {
            return { exists: false, type: "unknown", size: null, modifiedAt: null, path: p };
        } finally {
            client.close();
        }
    } finally {
        // jeżeli weszliśmy w fallback, client.close() jest już w finally fallbacku,
        // ale close() jest idempotentne w basic-ftp, więc zostawiamy też tu:
        client.close();
    }
}

/**
 * mkdir -p
 */
async function FTPmkdirp(dirPath) {
    const client = await Client();
    const dir = normalizeDir(dirPath);

    try {
        await client.ensureDir(dir);
        return true;
    } catch (error) {
        console.error(`FTP Error during mkdirp ${dir}:`, error);
        throw new Error(`FTP Error during mkdirp ${dir}: ${error?.message || error}`);
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

export { FTPremove, FTPupload, FTPlist, FTPstat, FTPmkdirp, checkFeatures };
