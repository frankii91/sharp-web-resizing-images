// src/test.js
import express from "express";
import path from "path";

import { FTPupload, FTPremove, FTPlist, FTPstat, FTPmkdirp } from "./storage/ftp.js";
import { AWS_PutObject, AWS_DeleteObject, AWS_HeadObject, AWS_GetObject, AWS_SignedGetUrl } from "./storage/aws-s3.js";


import { FTP_BaseDirImagesResult } from "./config.js";

const router = express.Router();

// helpers (POSIX paths for remote systems)
const posixJoin = (...parts) =>
    path.posix.join(...parts.map((p) => String(p ?? "").replaceAll("\\", "/")));

const normalizeDir = (p) => {
    let d = String(p ?? "").replaceAll("\\", "/");
    if (!d.startsWith("/")) d = "/" + d;
    if (d.length > 1) d = d.replace(/\/+$/, "");
    return d || "/";
};

const normalizeKey = (k) =>
    String(k ?? "").replaceAll("\\", "/").replace(/^\/+/, "");

/**
 * GET /test
 * @summary Test root
 * @tags test
 * @return {object} 200 - OK
 */
router.get("/", async (_req, res) => {
    return res.json({
        ok: true,
        endpoints: [
            "/test/ftp/upload",
            "/test/ftp/delete",
            "/test/ftp/mkdir",
            "/test/ftp/list",
            "/test/ftp/stat",
            "/test/ftp/roundtrip",
            "/test/s3/put",
            "/test/s3/delete",
            "/test/s3/head",
            "/test/s3/get",
            "/test/s3/signed-get",
            "/test/s3/roundtrip",
        ],
    });
});

/**
 * GET /test/ftp/upload
 * @summary FTP upload Buffer->file
 * @tags test
 * @param {string} dir.query - subdir, np. /images/test
 * @param {string} name.query - filename, np. hello.txt
 * @param {string} text.query - content
 * @return {object} 200 - OK
 */
router.get("/ftp/upload", async (req, res) => {
    try {
        const dir = normalizeDir(req.query.dir ?? "/images/test");
        const name = String(req.query.name ?? "hello.txt");
        const text = String(req.query.text ?? `hello ${new Date().toISOString()}`);
        const buffer = Buffer.from(text, "utf8");

        const remoteDir = posixJoin(normalizeDir(FTP_BaseDirImagesResult), dir);
        const ok = await FTPupload(buffer, remoteDir, name);

        return res.status(200).json({
            ok: true,
            storage: "ftp",
            remoteDir,
            name,
            bytes: buffer.length,
            result: ok,
        });
    } catch (e) {
        return res.status(500).json({ ok: false, storage: "ftp", error: e?.message || String(e) });
    }
});

/**
 * GET /test/ftp/delete
 * @summary FTP delete file + cleanup empty parent dirs
 * @tags test
 * @param {string} dir.query - subdir, np. /images/test
 * @param {string} name.query - filename
 * @return {object} 200 - OK
 */
router.get("/ftp/delete", async (req, res) => {
    try {
        const dir = normalizeDir(req.query.dir ?? "/images/test");
        const name = String(req.query.name ?? "hello.txt");

        const remoteDir = posixJoin(normalizeDir(FTP_BaseDirImagesResult), dir);
        const ok = await FTPremove(remoteDir, name);

        return res.status(200).json({
            ok: true,
            storage: "ftp",
            remoteDir,
            name,
            result: ok,
        });
    } catch (e) {
        return res.status(500).json({ ok: false, storage: "ftp", error: e?.message || String(e) });
    }
});

/**
 * GET /test/ftp/mkdir
 * @summary FTP ensureDir (mkdir -p)
 * @tags test
 * @param {string} dir.query - subdir, np. /images/test/a/b
 * @return {object} 200 - OK
 */
router.get("/ftp/mkdir", async (req, res) => {
    try {
        const dir = normalizeDir(req.query.dir ?? "/images/test/a/b");
        const remoteDir = posixJoin(normalizeDir(FTP_BaseDirImagesResult), dir);

        const ok = await FTPmkdirp(remoteDir);

        return res.status(200).json({ ok: true, storage: "ftp", remoteDir, result: ok });
    } catch (e) {
        return res.status(500).json({ ok: false, storage: "ftp", error: e?.message || String(e) });
    }
});

/**
 * GET /test/ftp/list
 * @summary FTP list directory
 * @tags test
 * @param {string} dir.query - subdir, np. /images/test
 * @return {object} 200 - OK
 */
router.get("/ftp/list", async (req, res) => {
    try {
        const dir = normalizeDir(req.query.dir ?? "/images/test");
        const remoteDir = posixJoin(normalizeDir(FTP_BaseDirImagesResult), dir);

        const list = await FTPlist(remoteDir);

        return res.status(200).json({ ok: true, storage: "ftp", remoteDir, list });
    } catch (e) {
        return res.status(500).json({ ok: false, storage: "ftp", error: e?.message || String(e) });
    }
});

/**
 * GET /test/ftp/stat
 * @summary FTP stat file (size + exists)
 * @tags test
 * @param {string} dir.query - subdir
 * @param {string} name.query - filename
 * @return {object} 200 - OK
 */
router.get("/ftp/stat", async (req, res) => {
    try {
        const dir = normalizeDir(req.query.dir ?? "/images/test");
        const name = String(req.query.name ?? "hello.txt");
        const remoteDir = posixJoin(normalizeDir(FTP_BaseDirImagesResult), dir);

        const stat = await FTPstat(remoteDir, name);

        return res.status(200).json({ ok: true, storage: "ftp", remoteDir, name, stat });
    } catch (e) {
        return res.status(500).json({ ok: false, storage: "ftp", error: e?.message || String(e) });
    }
});

/**
 * GET /test/ftp/roundtrip
 * @summary FTP upload -> stat -> delete
 * @tags test
 * @param {string} dir.query
 * @param {string} name.query
 * @param {string} text.query
 * @return {object} 200 - OK
 */
router.get("/ftp/roundtrip", async (req, res) => {
    const dir = normalizeDir(req.query.dir ?? "/images/test/roundtrip");
    const name = String(req.query.name ?? "hello.txt");
    const text = String(req.query.text ?? `hello ${new Date().toISOString()}`);
    const buffer = Buffer.from(text, "utf8");
    const remoteDir = posixJoin(normalizeDir(FTP_BaseDirImagesResult), dir);

    try {
        await FTPupload(buffer, remoteDir, name);
        const stat = await FTPstat(remoteDir, name);
        await FTPremove(remoteDir, name);

        return res.status(200).json({
            ok: true,
            storage: "ftp",
            remoteDir,
            name,
            uploadedBytes: buffer.length,
            stat,
            removed: true,
        });
    } catch (e) {
        return res.status(500).json({
            ok: false,
            storage: "ftp",
            remoteDir,
            name,
            error: e?.message || String(e),
        });
    }
});

/**
 * GET /test/s3/put
 * @summary S3/R2 put (Buffer -> object)
 * @tags test
 * @param {string} key.query - np. /images/test/hello.txt
 * @param {string} text.query
 * @param {string} contentType.query
 * @return {object} 200 - OK
 */
router.get("/s3/put", async (req, res) => {
    try {
        const keyRaw = String(req.query.key ?? "/images/test/hello.txt");
        const key = normalizeKey(keyRaw);

        const text = String(req.query.text ?? `hello ${new Date().toISOString()}`);
        const contentType = String(req.query.contentType ?? "text/plain; charset=utf-8");
        const buffer = Buffer.from(text, "utf8");

        const metaTags = {
            "x-test": "true",
            "x-created": new Date().toISOString(),
        };

        const result = await AWS_PutObject(buffer, key, contentType, metaTags);

        return res.status(200).json({
            ok: true,
            storage: "s3",
            key,
            bytes: buffer.length,
            result,
        });
    } catch (e) {
        return res.status(500).json({ ok: false, storage: "s3", error: e?.message || String(e) });
    }
});

/**
 * GET /test/s3/delete
 * @summary S3/R2 delete object
 * @tags test
 * @param {string} key.query
 * @return {object} 200 - OK
 */
router.get("/s3/delete", async (req, res) => {
    try {
        const keyRaw = String(req.query.key ?? "/images/test/hello.txt");
        const key = normalizeKey(keyRaw);

        const result = await AWS_DeleteObject(key);

        return res.status(200).json({ ok: true, storage: "s3", key, result });
    } catch (e) {
        return res.status(500).json({ ok: false, storage: "s3", error: e?.message || String(e) });
    }
});

/**
 * GET /test/s3/head
 * @summary S3/R2 head object (exists/metadata)
 * @tags test
 * @param {string} key.query
 * @return {object} 200 - OK
 */
router.get("/s3/head", async (req, res) => {
    try {
        const keyRaw = String(req.query.key ?? "/images/test/hello.txt");
        const key = normalizeKey(keyRaw);

        const result = await AWS_HeadObject(key);

        return res.status(200).json({ ok: true, storage: "s3", key, result });
    } catch (e) {
        return res.status(500).json({ ok: false, storage: "s3", error: e?.message || String(e) });
    }
});

/**
 * GET /test/s3/get
 * @summary S3/R2 get object (downloads and returns as text if possible)
 * @tags test
 * @param {string} key.query
 * @return {object} 200 - OK
 */
router.get("/s3/get", async (req, res) => {
    try {
        const keyRaw = String(req.query.key ?? "/images/test/hello.txt");
        const key = normalizeKey(keyRaw);

        const { bodyText, contentType, contentLength } = await AWS_GetObject(key);

        return res.status(200).json({
            ok: true,
            storage: "s3",
            key,
            contentType,
            contentLength,
            bodyText,
        });
    } catch (e) {
        return res.status(500).json({ ok: false, storage: "s3", error: e?.message || String(e) });
    }
});

/**
 * GET /test/s3/signed-get
 * @summary S3/R2 signed GET URL
 * @tags test
 * @param {string} key.query
 * @param {number} ttl.query - seconds
 * @return {object} 200 - OK
 */
router.get("/s3/signed-get", async (req, res) => {
    try {
        const keyRaw = String(req.query.key ?? "/images/test/hello.txt");
        const key = normalizeKey(keyRaw);
        const ttl = Number(req.query.ttl ?? 60);

        const url = await AWS_SignedGetUrl(key, ttl);

        return res.status(200).json({ ok: true, storage: "s3", key, ttl, url });
    } catch (e) {
        return res.status(500).json({ ok: false, storage: "s3", error: e?.message || String(e) });
    }
});

/**
 * GET /test/s3/roundtrip
 * @summary S3/R2 put -> head -> get -> delete
 * @tags test
 * @param {string} key.query
 * @param {string} text.query
 * @return {object} 200 - OK
 */
router.get("/s3/roundtrip", async (req, res) => {
    const key = normalizeKey(String(req.query.key ?? "/images/test/roundtrip/hello.txt"));
    const text = String(req.query.text ?? `hello ${new Date().toISOString()}`);
    const buffer = Buffer.from(text, "utf8");

    try {
        await AWS_PutObject(buffer, key, "text/plain; charset=utf-8", { "x-test": "true" });
        const head = await AWS_HeadObject(key);
        const got = await AWS_GetObject(key);
        await AWS_DeleteObject(key);

        return res.status(200).json({
            ok: true,
            storage: "s3",
            key,
            uploadedBytes: buffer.length,
            head,
            got,
            deleted: true,
        });
    } catch (e) {
        return res.status(500).json({ ok: false, storage: "s3", key, error: e?.message || String(e) });
    }
});

export default router;
