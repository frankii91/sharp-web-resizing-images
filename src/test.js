// src/test.js
import express from "express";
import path from "path";

import { FTPupload, FTPremove } from "./storage/ftp.js";
import { AWS_PutObject, AWS_DeleteObject } from "./storage/aws-s3.js";
import { FTP_BaseDirImagesResult } from "./config.js";

const router = express.Router();

// helpers
const posixJoin = (...parts) =>
    path.posix.join(...parts.map((p) => String(p ?? "").replaceAll("\\", "/")));

const normalizeDir = (p) => {
    let d = String(p ?? "").replaceAll("\\", "/");
    if (!d.startsWith("/")) d = "/" + d;
    if (d.length > 1) d = d.replace(/\/+$/, "");
    return d || "/";
};

const normalizeKey = (k) => String(k ?? "").replaceAll("\\", "/").replace(/^\/+/, "");

/**
 * FTP TESTS
 *
 * Upload:
 *   GET /test/ftp/upload?dir=/images/test&name=hello.txt&text=abc
 *
 * Delete + cleanup empty dirs:
 *   GET /test/ftp/delete?dir=/images/test&name=hello.txt
 */

// FTP upload (Buffer -> FTP)
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

// FTP delete (file + delete empty parent dirs)
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
 * S3 / R2 TESTS
 *
 * Put:
 *   GET /test/s3/put?key=/images/test/hello.txt&text=abc&contentType=text/plain
 *
 * Delete:
 *   GET /test/s3/delete?key=/images/test/hello.txt
 */

// S3/R2 put (Buffer -> R2)
router.get("/s3/put", async (req, res) => {
    try {
        const keyRaw = String(req.query.key ?? "/images/test/hello.txt");
        const key = normalizeKey(keyRaw);

        const text = String(req.query.text ?? `hello ${new Date().toISOString()}`);
        const contentType = String(req.query.contentType ?? "text/plain; charset=utf-8");
        const buffer = Buffer.from(text, "utf8");

        // metaTags muszą być string->string (AWS S3 / R2)
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

// S3/R2 delete
router.get("/s3/delete", async (req, res) => {
    try {
        const keyRaw = String(req.query.key ?? "/images/test/hello.txt");
        const key = normalizeKey(keyRaw);

        const result = await AWS_DeleteObject(key);

        return res.status(200).json({
            ok: true,
            storage: "s3",
            key,
            result,
        });
    } catch (e) {
        return res.status(500).json({ ok: false, storage: "s3", error: e?.message || String(e) });
    }
});

export default router;
