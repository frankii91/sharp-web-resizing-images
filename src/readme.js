import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import showdown from 'showdown';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, '..', 'README-HOWTO.MD');

const converter = new showdown.Converter();

let cachedHtml = null;
let cachedMtimeMs = 0;

/**
 * GET /readme
 * @summary Render README-HOWTO.MD as HTML
 * @tags docs
 * @return {string} 200 - HTML
 * @return {string} 500 - Error
 */
router.get('/', async (req, res) => {
    try {
        const stat = await fs.stat(filePath);

        if (!cachedHtml || stat.mtimeMs !== cachedMtimeMs) {
            const md = await fs.readFile(filePath, 'utf8');
            cachedHtml = converter.makeHtml(md);
            cachedMtimeMs = stat.mtimeMs;
        }

        return res.type('html').send(cachedHtml);
    } catch (error) {
        return res.status(500).send(`Error reading file: ${filePath} : ${error.message}`);
    }
});

export default router;
